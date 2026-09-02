"""
Utilization Engine and Utilization Debt Score (UDS) Calculation.
Calculates:
- Room/Slot utilization rate (% enrolled / capacity)
- Utilization Debt Score (UDS) per room/slot/day and campus aggregate
- Multi-Constraint Fit Score per candidate assignment
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple

DEFAULT_WEIGHTS = {
    "w1_idle": 1.0,      # Weight for idle/underutilized capacity penalty
    "w2_mismatch": 1.5,  # Weight for equipment mismatch penalty
    "w3_overcap": 3.0    # Weight for overcapacity safety violation penalty
}

DEFAULT_SLOTS = [
    "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
    "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
]

DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def calculate_slot_utilization(
    enrolled: int, 
    capacity: int, 
    required_equipment: set, 
    room_equipment: set,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, float]:
    """
    Compute utilization percentage and UDS components for a single room-slot.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS

    w1 = weights.get("w1_idle", 1.0)
    w2 = weights.get("w2_mismatch", 1.5)
    w3 = weights.get("w3_overcap", 3.0)

    if capacity <= 0:
        utilization = 0.0
    else:
        utilization = enrolled / float(capacity)

    # Penalize under 60% utilized: max(0, 0.6 - utilization) * 10
    if enrolled > 0:
        idle_penalty = max(0.0, 0.60 - utilization) * 10.0
    else:
        # Empty room slot has no enrolled students
        idle_penalty = 0.0

    # Heavily penalize overcapacity: max(0, utilization - 1.0) * 30
    overcap_penalty = max(0.0, utilization - 1.0) * 30.0

    # Equipment mismatch penalty: 15.0 if required equipment is missing
    is_mismatch = not required_equipment.issubset(room_equipment) if enrolled > 0 else False
    mismatch_penalty = 15.0 if is_mismatch else 0.0

    # Composite UDS score
    uds = (w1 * idle_penalty) + (w2 * mismatch_penalty) + (w3 * overcap_penalty)

    return {
        "utilization": utilization,
        "utilization_pct": round(utilization * 100.0, 1),
        "idle_penalty": round(idle_penalty, 2),
        "overcap_penalty": round(overcap_penalty, 2),
        "mismatch_penalty": round(mismatch_penalty, 2),
        "uds": round(uds, 2),
        "is_mismatch": is_mismatch
    }


def compute_schedule_utilization_matrix(
    timetable_df: pd.DataFrame,
    rooms_df: pd.DataFrame,
    weights: Optional[Dict[str, float]] = None,
    days: Optional[List[str]] = None,
    slots: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Build complete room x slot utilization grid for each day and calculate aggregate UDS metrics.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS
    if days is None:
        days = sorted(list(timetable_df["day"].unique())) if not timetable_df.empty else DEFAULT_DAYS
    if slots is None:
        slots = DEFAULT_SLOTS

    rooms_dict = {r["room_id"]: r for r in rooms_df.to_dict(orient="records")}
    
    # Pre-index events by (day, slot, room_id)
    events_map = {}
    for ev in timetable_df.to_dict(orient="records"):
        key = (ev["day"], ev["slot"], ev["room_id"])
        if key not in events_map:
            events_map[key] = []
        events_map[key].append(ev)

    day_matrices = {}
    detailed_records = []
    total_campus_uds = 0.0
    total_overcap_events = 0
    total_underutilized_events = 0
    total_mismatched_events = 0
    total_enrolled_served = 0
    total_capacity_allocated = 0

    for day in days:
        matrix = []
        for room_id, room in rooms_dict.items():
            cap = room["capacity"]
            room_equip = room.get("equipment_set", set())
            room_row = {"room_id": room_id, "room_name": room["room_name"], "building": room["building"], "capacity": cap}
            
            for slot in slots:
                events = events_map.get((day, slot, room_id), [])
                if events:
                    # If multiple (conflict), sum enrolled for capacity calculation
                    total_enrolled = sum(e["enrolled_students"] for e in events)
                    # Union required equipment
                    req_equip = set().union(*[e.get("required_equipment_set", set()) for e in events])
                    course_names = ", ".join([f"{e['course_code']} ({e['enrolled_students']})" for e in events])
                    event_ids = [e["event_id"] for e in events]
                else:
                    total_enrolled = 0
                    req_equip = set()
                    course_names = "Empty"
                    event_ids = []

                metrics = calculate_slot_utilization(total_enrolled, cap, req_equip, room_equip, weights)
                
                room_row[f"{slot}_util"] = metrics["utilization_pct"]
                room_row[f"{slot}_uds"] = metrics["uds"]
                room_row[f"{slot}_label"] = course_names
                room_row[f"{slot}_enrolled"] = total_enrolled

                if total_enrolled > 0:
                    total_enrolled_served += total_enrolled
                    total_capacity_allocated += cap
                    if metrics["utilization"] > 1.0:
                        total_overcap_events += 1
                    elif metrics["utilization"] < 0.30:
                        total_underutilized_events += 1
                    if metrics["is_mismatch"]:
                        total_mismatched_events += 1

                total_campus_uds += metrics["uds"]
                
                detailed_records.append({
                    "day": day,
                    "slot": slot,
                    "room_id": room_id,
                    "room_name": room["room_name"],
                    "building": room["building"],
                    "capacity": cap,
                    "enrolled": total_enrolled,
                    "utilization_pct": metrics["utilization_pct"],
                    "uds": metrics["uds"],
                    "idle_penalty": metrics["idle_penalty"],
                    "overcap_penalty": metrics["overcap_penalty"],
                    "mismatch_penalty": metrics["mismatch_penalty"],
                    "courses": course_names,
                    "event_ids": event_ids
                })
            matrix.append(room_row)
        day_matrices[day] = pd.DataFrame(matrix)

    avg_utilization = (total_enrolled_served / total_capacity_allocated * 100.0) if total_capacity_allocated > 0 else 0.0

    return {
        "day_matrices": day_matrices,
        "detailed_df": pd.DataFrame(detailed_records),
        "total_campus_uds": round(total_campus_uds, 2),
        "avg_utilization_pct": round(avg_utilization, 1),
        "total_overcap_events": total_overcap_events,
        "total_underutilized_events": total_underutilized_events,
        "total_mismatched_events": total_mismatched_events,
        "total_events": len(timetable_df)
    }


def compute_multi_constraint_fit_score(
    enrolled: int,
    capacity: int,
    required_equipment: set,
    room_equipment: set,
    distance_meters: float = 0.0,
    gap_minutes: int = 60,
    min_buffer_minutes: int = 15
) -> Dict[str, float]:
    """
    Compute multi-constraint fit score for a candidate assignment (rules.md section C):
    capacity_fit: 1.0 if enrolled <= capacity else -2.0
    equipment_fit: 1.0 if required_equipment subset of room_equipment else -5.0
    travel_fit: 1 / (1 + distance_meters / 100)
    buffer_fit: 1.0 if gap_minutes >= min_buffer_minutes else -1.0
    Fit = capacity_fit + equipment_fit + travel_fit + buffer_fit
    """
    capacity_fit = 1.0 if enrolled <= capacity else -2.0
    equipment_fit = 1.0 if required_equipment.issubset(room_equipment) else -5.0
    travel_fit = 1.0 / (1.0 + (distance_meters / 100.0))
    buffer_fit = 1.0 if gap_minutes >= min_buffer_minutes else -1.0

    total_fit = capacity_fit + equipment_fit + travel_fit + buffer_fit
    return {
        "capacity_fit": capacity_fit,
        "equipment_fit": equipment_fit,
        "travel_fit": round(travel_fit, 3),
        "buffer_fit": buffer_fit,
        "total_fit": round(total_fit, 3)
    }
