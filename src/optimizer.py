"""
Mathematical Optimization Engine for CampusOptix using Google OR-Tools CP-SAT.
Solves constrained classroom and laboratory reallocation problem to minimize Utilization Debt Score (UDS)
and maximize multi-constraint fit while enforcing strict hard constraints:
1. Strict room capacity (fire/safety code)
2. Exact equipment requirements (hard constraint)
3. No room double-booking in any slot
4. Multi-slot consecutive class continuity (same room across 2-hour lab blocks)
5. Faculty transit minimization across campus buildings
"""

import time
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from ortools.sat.python import cp_model

from src.utilization import calculate_slot_utilization, compute_multi_constraint_fit_score, DEFAULT_WEIGHTS

class SolverStatus:
    OPTIMAL = "OPTIMAL"
    FEASIBLE = "FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    MODEL_INVALID = "MODEL_INVALID"
    UNKNOWN = "UNKNOWN"


def solve_campus_optimization(
    timetable_df: pd.DataFrame,
    rooms_df: pd.DataFrame,
    faculty_df: pd.DataFrame,
    distances_matrix: Optional[Dict[Tuple[str, str], int]] = None,
    weights: Optional[Dict[str, float]] = None,
    time_limit_seconds: float = 5.0,
    allow_unnecessary_moves: bool = False
) -> Dict[str, Any]:
    """
    Run CP-SAT solver to find the globally optimal room reallocation for all scheduled events.
    """
    start_time = time.time()
    
    if weights is None:
        weights = DEFAULT_WEIGHTS
    if distances_matrix is None:
        distances_matrix = {}

    def get_building_distance(b1: str, b2: str) -> int:
        if b1 == b2:
            return 0
        return distances_matrix.get((b1, b2), distances_matrix.get((b2, b1), 500))

    rooms_list = rooms_df.to_dict(orient="records")
    rooms_map = {r["room_id"]: r for r in rooms_list}
    faculty_map = {f["faculty_id"]: f for f in faculty_df.to_dict(orient="records")}
    events_list = timetable_df.to_dict(orient="records")

    model = cp_model.CpModel()

    # Decision variables: x[event_idx, room_idx] in {0, 1}
    x = {}
    
    # Track candidate fit score deltas scaled as integers for CP-SAT
    SCORE_SCALE = 100
    
    # Pre-calculate previous/next class building for faculty to score transit
    slot_order = {
        "09:00-10:00": 1, "10:00-11:00": 2, "11:00-12:00": 3, "12:00-13:00": 4,
        "13:00-14:00": 5, "14:00-15:00": 6, "15:00-16:00": 7, "16:00-17:00": 8
    }

    # Group events by faculty and day to check transit
    fac_day_events = {}
    for e_idx, ev in enumerate(events_list):
        key = (ev["faculty_id"], ev["day"])
        if key not in fac_day_events:
            fac_day_events[key] = []
        fac_day_events[key].append((e_idx, ev))

    # Identify multi-hour lab pairs (same course, section, day, consecutive slots)
    multi_hour_pairs = []
    for (day, cc, sec), group in timetable_df.groupby(["day", "course_code", "section"]):
        if len(group) > 1:
            records = group.sort_values(by="slot", key=lambda s: s.map(lambda x: slot_order.get(x, 99))).to_dict(orient="records")
            for i in range(len(records) - 1):
                s1_idx = slot_order.get(records[i]["slot"], 0)
                s2_idx = slot_order.get(records[i+1]["slot"], 0)
                if s2_idx == s1_idx + 1:
                    # Find indices in events_list
                    idx1 = next(idx for idx, e in enumerate(events_list) if e["event_id"] == records[i]["event_id"])
                    idx2 = next(idx for idx, e in enumerate(events_list) if e["event_id"] == records[i+1]["event_id"])
                    multi_hour_pairs.append((idx1, idx2))

    objective_terms = []

    for i, ev in enumerate(events_list):
        enrolled = int(ev["enrolled_students"])
        req_equip = ev.get("required_equipment_set", set())
        orig_room_id = ev["room_id"]
        orig_room = rooms_map.get(orig_room_id, {})
        orig_cap = orig_room.get("capacity", 1)
        orig_equip = orig_room.get("equipment_set", set())
        orig_uds = calculate_slot_utilization(enrolled, orig_cap, req_equip, orig_equip, weights)["uds"]

        for j, rm in enumerate(rooms_list):
            var = model.NewBoolVar(f"x_{i}_{j}")
            x[i, j] = var
            
            r_id = rm["room_id"]
            r_cap = rm["capacity"]
            r_equip = rm.get("equipment_set", set())
            r_bldg = rm["building"]

            # HARD CONSTRAINT 1: Room Capacity (Safety/Fire code - enrolled <= capacity)
            if enrolled > r_cap:
                model.Add(var == 0)
                continue

            # HARD CONSTRAINT 2: Equipment Match (required subset of available)
            if not req_equip.issubset(r_equip):
                model.Add(var == 0)
                continue

            # Calculate candidate UDS
            cand_uds = calculate_slot_utilization(enrolled, r_cap, req_equip, r_equip, weights)["uds"]
            
            # Faculty Transit Fit
            # Check distance from faculty home building or adjacent classes
            fac = faculty_map.get(ev["faculty_id"], {})
            home_bldg = fac.get("home_building", r_bldg)
            dist_home = get_building_distance(home_bldg, r_bldg)
            travel_fit = 1.0 / (1.0 + (dist_home / 100.0))

            # Multi-constraint fit score
            fit_scores = compute_multi_constraint_fit_score(
                enrolled=enrolled,
                capacity=r_cap,
                required_equipment=req_equip,
                room_equipment=r_equip,
                distance_meters=dist_home
            )
            
            # Gain calculation: (Reduction in UDS) + (Improvement in Fit)
            uds_gain = orig_uds - cand_uds
            total_gain = uds_gain + (fit_scores["total_fit"] * 2.0)
            
            # Slight inertia penalty for moving if original was already valid and good
            if r_id != orig_room_id and not allow_unnecessary_moves:
                if orig_uds < 5.0 and enrolled <= orig_cap and req_equip.issubset(orig_equip):
                    total_gain -= 4.0 # penalize unnecessary movement
            elif r_id == orig_room_id:
                total_gain += 1.0 # slight preference to keep current room if feasible

            scaled_gain = int(round(total_gain * SCORE_SCALE))
            objective_terms.append(scaled_gain * var)

    # HARD CONSTRAINT 3: Exactly one room assigned to each event
    for i in range(len(events_list)):
        model.Add(sum(x[i, j] for j in range(len(rooms_list))) == 1)

    # HARD CONSTRAINT 4: Room Exclusivity (No room double-booking at same day & slot)
    # Group events by (day, slot)
    events_by_timeslot = {}
    for i, ev in enumerate(events_list):
        ts_key = (ev["day"], ev["slot"])
        if ts_key not in events_by_timeslot:
            events_by_timeslot[ts_key] = []
        events_by_timeslot[ts_key].append(i)

    for ts_key, ev_indices in events_by_timeslot.items():
        for j in range(len(rooms_list)):
            # At most 1 event in room j at timeslot ts_key
            model.Add(sum(x[i, j] for i in ev_indices) <= 1)

    # HARD CONSTRAINT 5: Multi-hour lab continuity (multi-slot classes keep same room)
    for idx1, idx2 in multi_hour_pairs:
        for j in range(len(rooms_list)):
            # x[idx1, j] == x[idx2, j]
            model.Add(x[idx1, j] == x[idx2, j])

    # Objective: Maximize total scaled gain
    model.Maximize(sum(objective_terms))

    # Run Solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_search_workers = 4
    
    status_code = solver.Solve(model)
    solve_duration = time.time() - start_time

    status_str = SolverStatus.UNKNOWN
    if status_code == cp_model.OPTIMAL:
        status_str = SolverStatus.OPTIMAL
    elif status_code == cp_model.FEASIBLE:
        status_str = SolverStatus.FEASIBLE
    elif status_code == cp_model.INFEASIBLE:
        status_str = SolverStatus.INFEASIBLE
    elif status_code == cp_model.MODEL_INVALID:
        status_str = SolverStatus.MODEL_INVALID

    # Extract Assignments and Recommendations
    reallocations = []
    optimized_events = []
    
    if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for i, ev in enumerate(events_list):
            orig_rid = ev["room_id"]
            orig_room = rooms_map.get(orig_rid, {})
            assigned_room_idx = None
            for j, rm in enumerate(rooms_list):
                if solver.Value(x[i, j]) == 1:
                    assigned_room_idx = j
                    break
            
            new_room = rooms_list[assigned_room_idx] if assigned_room_idx is not None else orig_room
            new_rid = new_room["room_id"]
            
            opt_ev = ev.copy()
            opt_ev["original_room_id"] = orig_rid
            opt_ev["room_id"] = new_rid
            opt_ev["is_reallocated"] = (orig_rid != new_rid)
            optimized_events.append(opt_ev)

            if orig_rid != new_rid:
                enrolled = ev["enrolled_students"]
                req_equip = ev.get("required_equipment_set", set())
                
                orig_metrics = calculate_slot_utilization(enrolled, orig_room.get("capacity", 1), req_equip, orig_room.get("equipment_set", set()), weights)
                new_metrics = calculate_slot_utilization(enrolled, new_room["capacity"], req_equip, new_room.get("equipment_set", set()), weights)
                
                reallocations.append({
                    "event_id": ev["event_id"],
                    "course_code": ev["course_code"],
                    "course_name": ev["course_name"],
                    "section": ev.get("section", "Sec A"),
                    "faculty_id": ev["faculty_id"],
                    "day": ev["day"],
                    "slot": ev["slot"],
                    "enrolled_students": enrolled,
                    "from_room_id": orig_rid,
                    "from_room_name": orig_room.get("room_name", orig_rid),
                    "from_building": orig_room.get("building", ""),
                    "from_capacity": orig_room.get("capacity", 0),
                    "to_room_id": new_rid,
                    "to_room_name": new_room["room_name"],
                    "to_building": new_room["building"],
                    "to_capacity": new_room["capacity"],
                    "from_utilization_pct": orig_metrics["utilization_pct"],
                    "to_utilization_pct": new_metrics["utilization_pct"],
                    "from_uds": orig_metrics["uds"],
                    "to_uds": new_metrics["uds"],
                    "uds_gain": round(orig_metrics["uds"] - new_metrics["uds"], 2),
                    "required_equipment": list(req_equip),
                    "to_equipment": list(new_room.get("equipment_set", set()))
                })

    optimized_df = pd.DataFrame(optimized_events) if optimized_events else timetable_df.copy()

    return {
        "status": status_str,
        "objective_value": solver.ObjectiveValue() / float(SCORE_SCALE) if status_code in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0.0,
        "solve_time_ms": round(solve_duration * 1000.0, 1),
        "reallocations": reallocations,
        "reallocations_count": len(reallocations),
        "optimized_timetable_df": optimized_df
    }
