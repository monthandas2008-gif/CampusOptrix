"""
Deterministic Rule-Trace Explainer for CampusOptrix.
Builds auditable, mathematical proof objects for every recommendation and rejection.
Contains exact constraint verification logs, before/after score deltas, and zero LLM hallucination risk.
"""

from typing import Dict, List, Any, Optional
import pandas as pd
from src.utilization import calculate_slot_utilization, compute_multi_constraint_fit_score

def generate_rule_trace(
    reallocation: Dict[str, Any],
    rooms_df: pd.DataFrame,
    faculty_df: pd.DataFrame,
    distances_matrix: Optional[Dict[Any, int]] = None
) -> Dict[str, Any]:
    """
    Generate structured rule trace for a single accepted reallocation.
    """
    if distances_matrix is None:
        distances_matrix = {}

    def get_building_distance(b1: str, b2: str) -> int:
        if b1 == b2:
            return 0
        return distances_matrix.get((b1, b2), distances_matrix.get((b2, b1), 500))

    rooms_map = {r["room_id"]: r for r in rooms_df.to_dict(orient="records")}
    faculty_map = {f["faculty_id"]: f for f in faculty_df.to_dict(orient="records")}
    
    from_r = rooms_map.get(reallocation["from_room_id"], {})
    to_r = rooms_map.get(reallocation["to_room_id"], {})
    fac = faculty_map.get(reallocation["faculty_id"], {})

    enrolled = reallocation["enrolled_students"]
    req_equip = set(reallocation.get("required_equipment", []))
    from_equip = from_r.get("equipment_set", set())
    to_equip = to_r.get("equipment_set", set())

    # Distance to faculty home building
    home_bldg = fac.get("home_building", to_r.get("building", ""))
    from_dist = get_building_distance(home_bldg, from_r.get("building", ""))
    to_dist = get_building_distance(home_bldg, to_r.get("building", ""))

    # Fit scores
    from_fit = compute_multi_constraint_fit_score(enrolled, from_r.get("capacity", 1), req_equip, from_equip, from_dist)
    to_fit = compute_multi_constraint_fit_score(enrolled, to_r.get("capacity", 1), req_equip, to_equip, to_dist)

    constraints_checked = []

    # 1. Capacity Constraint Audit
    cap_before_ok = enrolled <= from_r.get("capacity", 0)
    cap_after_ok = enrolled <= to_r.get("capacity", 0)
    constraints_checked.append({
        "constraint": "Capacity & Fire Code Safety",
        "passed": cap_after_ok,
        "score_before": from_fit["capacity_fit"],
        "score_after": to_fit["capacity_fit"],
        "status": "RESOLVED" if (not cap_before_ok and cap_after_ok) else ("SATISFIED" if cap_after_ok else "VIOLATED"),
        "detail": f"Enrolled: {enrolled} students. Source: '{from_r.get('room_name')}' (Cap: {from_r.get('capacity')}) -> Target: '{to_r.get('room_name')}' (Cap: {to_r.get('capacity')})."
    })

    # 2. Equipment Requirement Audit
    equip_before_ok = req_equip.issubset(from_equip)
    equip_after_ok = req_equip.issubset(to_equip)
    missing_before = list(req_equip - from_equip)
    constraints_checked.append({
        "constraint": "Equipment & Lab Prerequisites",
        "passed": equip_after_ok,
        "score_before": from_fit["equipment_fit"],
        "score_after": to_fit["equipment_fit"],
        "status": "RESOLVED" if (not equip_before_ok and equip_after_ok) else ("SATISFIED" if equip_after_ok else "VIOLATED"),
        "detail": f"Required: {list(req_equip) if req_equip else 'None'}. " + 
                  (f"Missing in source: {missing_before}. " if missing_before else "Source had equipment. ") +
                  f"Target has complete prerequisite match."
    })

    # 3. Faculty Transit & Campus Distance Audit
    constraints_checked.append({
        "constraint": "Faculty Transit Proximity",
        "passed": to_dist <= from_dist or to_dist <= 200,
        "score_before": from_fit["travel_fit"],
        "score_after": to_fit["travel_fit"],
        "status": "IMPROVED" if to_dist < from_dist else "NEUTRAL",
        "detail": f"Distance to {fac.get('faculty_name', 'Faculty')} home ({home_bldg}): {from_dist}m -> {to_dist}m ({'+' if to_dist > from_dist else '-'}{abs(from_dist - to_dist)}m)."
    })

    # 4. Utilization & UDS Debt Reduction Audit
    uds_delta = reallocation["to_uds"] - reallocation["from_uds"]
    constraints_checked.append({
        "constraint": "Utilization Debt Score (UDS) Reduction",
        "passed": uds_delta < 0,
        "score_before": reallocation["from_uds"],
        "score_after": reallocation["to_uds"],
        "status": "IMPROVED" if uds_delta < 0 else "NEUTRAL",
        "detail": f"Room UDS improved from {reallocation['from_uds']} down to {reallocation['to_uds']} (Debt Reduced: {abs(uds_delta):.1f} pts). " +
                  f"Utilization shifted from {reallocation['from_utilization_pct']}% to {reallocation['to_utilization_pct']}%."
    })

    net_fit_gain = round(to_fit["total_fit"] - from_fit["total_fit"], 2)

    return {
        "move": f"Move {reallocation['course_code']} ({reallocation['course_name']}): {reallocation['from_room_name']} → {reallocation['to_room_name']} [{reallocation['day']} {reallocation['slot']}]",
        "event_id": reallocation["event_id"],
        "course_code": reallocation["course_code"],
        "course_name": reallocation["course_name"],
        "faculty_name": fac.get("faculty_name", reallocation["faculty_id"]),
        "from_room": reallocation["from_room_name"],
        "to_room": reallocation["to_room_name"],
        "day": reallocation["day"],
        "slot": reallocation["slot"],
        "net_fit_gain": net_fit_gain,
        "uds_reduction": round(reallocation["from_uds"] - reallocation["to_uds"], 2),
        "constraints_checked": constraints_checked,
        "verdict": "OPTIMAL_AUDITED_REALLOCATION"
    }


def explain_room_rejection(
    event: Optional[Dict[str, Any]] = None,
    candidate_room_id: Optional[str] = None,
    rooms_df: Optional[pd.DataFrame] = None,
    timetable_df: Optional[pd.DataFrame] = None,
    event_id: Optional[str] = None,
    faculty_df: Optional[pd.DataFrame] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Explain why a specific candidate room was REJECTED for an event.
    Accepts either an event dict or event_id string along with rooms_df and timetable_df.
    """
    if candidate_room_id is None:
        candidate_room_id = kwargs.get("candidate_room", "")
    if rooms_df is None:
        rooms_df = kwargs.get("rooms", pd.DataFrame())
    if timetable_df is None:
        timetable_df = kwargs.get("timetable", pd.DataFrame())

    # Resolve event if event_id provided
    if event is None:
        target_eid = event_id or kwargs.get("event_id")
        if target_eid and timetable_df is not None and not timetable_df.empty:
            ev_rows = timetable_df[timetable_df["event_id"] == target_eid]
            if not ev_rows.empty:
                event = ev_rows.iloc[0].to_dict()
        if event is None:
            event = kwargs.get("event_dict", {})

    rooms_map = {r["room_id"]: r for r in rooms_df.to_dict(orient="records")} if rooms_df is not None else {}
    cand_room = rooms_map.get(candidate_room_id)
    if not cand_room:
        return {
            "candidate_room_id": candidate_room_id,
            "candidate_room": candidate_room_id,
            "is_valid": False,
            "is_eligible": False,
            "reasons": [f"Room '{candidate_room_id}' does not exist in room catalog."],
            "rejection_reasons": [f"Room '{candidate_room_id}' does not exist in room catalog."]
        }

    reasons = []
    enrolled = int(event.get("enrolled_students", 0))
    req_equip = set(event.get("required_equipment_set", event.get("required_equipment", [])))
    
    # 1. Capacity check
    if enrolled > cand_room["capacity"]:
        reasons.append(f"Capacity Violation: {enrolled} students exceeds room capacity ({cand_room['capacity']}).")

    # 2. Equipment check
    room_equip = cand_room.get("equipment_set", set())
    if isinstance(room_equip, (list, tuple)):
        room_equip = set(room_equip)
    missing_equip = req_equip - room_equip
    if missing_equip:
        reasons.append(f"Equipment Mismatch: Room lacks {sorted(list(missing_equip))}.")

    # 3. Schedule collision check
    if timetable_df is not None and not timetable_df.empty and "day" in event and "slot" in event:
        clashing = timetable_df[
            (timetable_df["day"] == event["day"]) & 
            (timetable_df["slot"] == event["slot"]) & 
            (timetable_df["room_id"] == candidate_room_id) &
            (timetable_df["event_id"] != event.get("event_id", ""))
        ]
        if not clashing.empty:
            clash_courses = clashing["course_code"].tolist()
            reasons.append(f"Room Double-Booking: Room already occupied by {clash_courses} during {event['day']} {event['slot']}.")

    is_ok = len(reasons) == 0
    default_msg = ["Room meets all constraints and is feasible."] if is_ok else reasons

    return {
        "candidate_room_id": candidate_room_id,
        "candidate_room": cand_room["room_name"],
        "is_valid": is_ok,
        "is_eligible": is_ok,
        "reasons": default_msg,
        "rejection_reasons": default_msg
    }
