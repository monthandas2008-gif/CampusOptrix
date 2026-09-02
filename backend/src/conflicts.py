"""
Rule-Based Conflict Detector for CampusOptix.
Evaluates timetable data against room and faculty constraints using pure pandas/deterministic rules:
- Overcapacity (RED)
- Underutilization <30% (YELLOW)
- Equipment Mismatch (RED - Hard Constraint Violation)
- Room Double-Booking (RED - Highest Priority)
- Faculty Double-Booking (RED)
- Faculty Travel Buffer Violation (YELLOW)
"""

import pandas as pd
from typing import Dict, List, Any, Optional, Tuple

class ConflictSeverity:
    CRITICAL = "CRITICAL" # Hard constraint violation (Fire/safety, Equipment, Double booking)
    WARNING = "WARNING"   # Soft constraint violation / Inefficiency (Underutilized, Travel buffer)


def detect_conflicts(
    timetable_df: pd.DataFrame,
    rooms_df: pd.DataFrame,
    faculty_df: pd.DataFrame,
    distances_matrix: Optional[Dict[Tuple[str, str], int]] = None,
    max_walkable_distance: int = 200,
    min_buffer_minutes: int = 15
) -> Dict[str, Any]:
    """
    Perform exhaustive conflict detection across the timetable.
    Returns:
      - conflict_list: list of structured conflict dicts
      - conflicts_by_event: mapping of event_id -> list of conflicts
      - summary_counts: breakdown by conflict type and severity
    """
    conflicts = []
    
    rooms_map = {r["room_id"]: r for r in rooms_df.to_dict(orient="records")}
    faculty_map = {f["faculty_id"]: f for f in faculty_df.to_dict(orient="records")}
    
    if distances_matrix is None:
        distances_matrix = {}

    def get_building_distance(b1: str, b2: str) -> int:
        if b1 == b2:
            return 0
        return distances_matrix.get((b1, b2), distances_matrix.get((b2, b1), 500))

    # Helper: slot order index
    slot_order = {
        "09:00-10:00": 1, "10:00-11:00": 2, "11:00-12:00": 3, "12:00-13:00": 4,
        "13:00-14:00": 5, "14:00-15:00": 6, "15:00-16:00": 7, "16:00-17:00": 8
    }

    # 1. Check Per-Event Conflicts (Overcapacity, Underutilization, Equipment Mismatch)
    for _, event in timetable_df.iterrows():
        eid = event["event_id"]
        rid = event["room_id"]
        enrolled = int(event["enrolled_students"])
        req_equip = event.get("required_equipment_set", set())
        
        room = rooms_map.get(rid)
        if not room:
            conflicts.append({
                "type": "INVALID_ROOM",
                "severity": ConflictSeverity.CRITICAL,
                "color": "RED",
                "event_id": eid,
                "course_code": event["course_code"],
                "course_name": event["course_name"],
                "day": event["day"],
                "slot": event["slot"],
                "room_id": rid,
                "message": f"Assigned room '{rid}' does not exist in room catalog.",
                "details": {"room_id": rid}
            })
            continue

        cap = int(room["capacity"])
        room_equip = room.get("equipment_set", set())
        room_building = room["building"]

        # Overcapacity check (enrolled > capacity)
        if enrolled > cap:
            excess = enrolled - cap
            severity_score = excess / float(cap)
            conflicts.append({
                "type": "OVERCAPACITY",
                "severity": ConflictSeverity.CRITICAL,
                "color": "RED",
                "event_id": eid,
                "course_code": event["course_code"],
                "course_name": event["course_name"],
                "day": event["day"],
                "slot": event["slot"],
                "room_id": rid,
                "room_name": room["room_name"],
                "building": room_building,
                "message": f"Overcapacity violation: {enrolled} students enrolled in '{room['room_name']}' (Capacity: {cap}, Excess: +{excess}).",
                "details": {"enrolled": enrolled, "capacity": cap, "excess": excess, "severity_score": round(severity_score, 2)}
            })
        
        # Underutilization check (enrolled / capacity < 0.30)
        elif enrolled / float(cap) < 0.30:
            util_pct = (enrolled / float(cap)) * 100.0
            conflicts.append({
                "type": "UNDERUTILIZED",
                "severity": ConflictSeverity.WARNING,
                "color": "YELLOW",
                "event_id": eid,
                "course_code": event["course_code"],
                "course_name": event["course_name"],
                "day": event["day"],
                "slot": event["slot"],
                "room_id": rid,
                "room_name": room["room_name"],
                "building": room_building,
                "message": f"Underutilization warning: only {enrolled}/{cap} seats used ({util_pct:.1f}% utilization). Wasting large room capacity.",
                "details": {"enrolled": enrolled, "capacity": cap, "utilization_pct": round(util_pct, 1)}
            })

        # Equipment mismatch check
        missing_equip = req_equip - room_equip
        if missing_equip:
            conflicts.append({
                "type": "EQUIPMENT_MISMATCH",
                "severity": ConflictSeverity.CRITICAL,
                "color": "RED",
                "event_id": eid,
                "course_code": event["course_code"],
                "course_name": event["course_name"],
                "day": event["day"],
                "slot": event["slot"],
                "room_id": rid,
                "room_name": room["room_name"],
                "building": room_building,
                "message": f"Equipment mismatch: Room lacks required {', '.join(sorted(list(missing_equip)))}.",
                "details": {"required": list(req_equip), "missing": list(missing_equip), "available": list(room_equip)}
            })

    # 2. Check Room Double Booking (Same day, slot, room_id assigned to 2+ events)
    room_slot_grouped = timetable_df.groupby(["day", "slot", "room_id"])
    for (day, slot, rid), group in room_slot_grouped:
        if len(group) > 1:
            room = rooms_map.get(rid, {})
            room_name = room.get("room_name", rid)
            eids = group["event_id"].tolist()
            courses = group["course_code"].tolist()
            for _, event in group.iterrows():
                conflicts.append({
                    "type": "ROOM_DOUBLE_BOOKING",
                    "severity": ConflictSeverity.CRITICAL,
                    "color": "RED",
                    "event_id": event["event_id"],
                    "course_code": event["course_code"],
                    "course_name": event["course_name"],
                    "day": day,
                    "slot": slot,
                    "room_id": rid,
                    "room_name": room_name,
                    "message": f"Room collision: '{room_name}' is double-booked in {slot} on {day} with {', '.join(courses)}.",
                    "details": {"conflicting_events": eids, "courses": courses}
                })

    # 3. Check Faculty Double Booking (Same faculty assigned to 2+ events at same day and slot)
    faculty_slot_grouped = timetable_df.groupby(["day", "slot", "faculty_id"])
    for (day, slot, fid), group in faculty_slot_grouped:
        if len(group) > 1:
            fac = faculty_map.get(fid, {})
            fac_name = fac.get("faculty_name", fid)
            eids = group["event_id"].tolist()
            courses = group["course_code"].tolist()
            rooms_booked = group["room_id"].tolist()
            for _, event in group.iterrows():
                conflicts.append({
                    "type": "FACULTY_DOUBLE_BOOKING",
                    "severity": ConflictSeverity.CRITICAL,
                    "color": "RED",
                    "event_id": event["event_id"],
                    "course_code": event["course_code"],
                    "course_name": event["course_name"],
                    "faculty_id": fid,
                    "faculty_name": fac_name,
                    "day": day,
                    "slot": slot,
                    "room_id": event["room_id"],
                    "message": f"Faculty double-booking: {fac_name} is assigned to multiple classes simultaneously in {slot} ({', '.join(courses)} across rooms {', '.join(rooms_booked)}).",
                    "details": {"conflicting_events": eids, "courses": courses, "rooms": rooms_booked}
                })

    # 4. Check Faculty Travel Buffer Violations (Back-to-back classes across distant buildings)
    for (day, fid), fac_events in timetable_df.groupby(["day", "faculty_id"]):
        fac = faculty_map.get(fid, {})
        fac_name = fac.get("faculty_name", fid)
        
        # Sort events by slot order
        sorted_events = fac_events.sort_values(by="slot", key=lambda s: s.map(lambda x: slot_order.get(x, 99))).to_dict(orient="records")
        for i in range(len(sorted_events) - 1):
            curr_ev = sorted_events[i]
            next_ev = sorted_events[i+1]
            
            curr_slot_idx = slot_order.get(curr_ev["slot"], 0)
            next_slot_idx = slot_order.get(next_ev["slot"], 0)
            
            # Back-to-back consecutive slots (e.g. 09-10 and 10-11)
            if next_slot_idx == curr_slot_idx + 1:
                curr_room = rooms_map.get(curr_ev["room_id"], {})
                next_room = rooms_map.get(next_ev["room_id"], {})
                
                b1 = curr_room.get("building", "")
                b2 = next_room.get("building", "")
                
                dist = get_building_distance(b1, b2)
                if dist > max_walkable_distance:
                    conflicts.append({
                        "type": "FACULTY_BUFFER_VIOLATION",
                        "severity": ConflictSeverity.WARNING,
                        "color": "YELLOW",
                        "event_id": curr_ev["event_id"],
                        "course_code": curr_ev["course_code"],
                        "course_name": curr_ev["course_name"],
                        "faculty_id": fid,
                        "faculty_name": fac_name,
                        "day": day,
                        "slot": curr_ev["slot"],
                        "room_id": curr_ev["room_id"],
                        "message": f"Tight faculty transit: {fac_name} has back-to-back classes in '{b1}' and '{b2}' ({dist}m apart, exceeds {max_walkable_distance}m threshold) with 0-minute transition.",
                        "details": {
                            "next_event_id": next_ev["event_id"],
                            "next_course": next_ev["course_code"],
                            "next_room": next_room.get("room_name", next_ev["room_id"]),
                            "distance_meters": dist,
                            "max_allowed": max_walkable_distance
                        }
                    })

    # Group conflicts by event_id for fast lookup in UI
    conflicts_by_event = {}
    for c in conflicts:
        eid = c.get("event_id")
        if eid:
            if eid not in conflicts_by_event:
                conflicts_by_event[eid] = []
            conflicts_by_event[eid].append(c)

    # Summary counts
    summary = {
        "total_conflicts": len(conflicts),
        "critical_count": sum(1 for c in conflicts if c["severity"] == ConflictSeverity.CRITICAL),
        "warning_count": sum(1 for c in conflicts if c["severity"] == ConflictSeverity.WARNING),
        "overcapacity_count": sum(1 for c in conflicts if c["type"] == "OVERCAPACITY"),
        "underutilized_count": sum(1 for c in conflicts if c["type"] == "UNDERUTILIZED"),
        "equipment_mismatch_count": sum(1 for c in conflicts if c["type"] == "EQUIPMENT_MISMATCH"),
        "room_double_booking_count": sum(1 for c in conflicts if c["type"] == "ROOM_DOUBLE_BOOKING"),
        "faculty_double_booking_count": sum(1 for c in conflicts if c["type"] == "FACULTY_DOUBLE_BOOKING"),
        "faculty_buffer_count": sum(1 for c in conflicts if c["type"] == "FACULTY_BUFFER_VIOLATION")
    }

    return {
        "conflicts": conflicts,
        "conflicts_by_event": conflicts_by_event,
        "summary": summary
    }
