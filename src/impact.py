"""
Impact Translator for CampusOptrix.
Converts raw mathematical optimization metrics and UDS deltas into tangible, operational KPIs:
- Hours/week of wasted room capacity reclaimed
- Additional student seats unlocked
- Critical fire-code and equipment violations cleared
- Faculty cross-campus travel meters eliminated
- Before vs. After comparative impact summary
"""

from typing import Dict, List, Any, Optional
import pandas as pd
from src.utilization import compute_schedule_utilization_matrix
from src.conflicts import detect_conflicts

def calculate_impact_summary(
    before_timetable_df: pd.DataFrame,
    after_timetable_df: pd.DataFrame,
    rooms_df: pd.DataFrame,
    faculty_df: pd.DataFrame,
    distances_matrix: Optional[Dict[Any, int]] = None,
    weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Calculate comprehensive Before vs. After impact metrics.
    """
    # 1. Before Metrics
    before_util = compute_schedule_utilization_matrix(before_timetable_df, rooms_df, weights)
    before_conflicts = detect_conflicts(before_timetable_df, rooms_df, faculty_df, distances_matrix)
    
    # 2. After Metrics
    after_util = compute_schedule_utilization_matrix(after_timetable_df, rooms_df, weights)
    after_conflicts = detect_conflicts(after_timetable_df, rooms_df, faculty_df, distances_matrix)

    # 3. Deltas & Business Translations
    uds_before = before_util["total_campus_uds"]
    uds_after = after_util["total_campus_uds"]
    uds_delta = round(uds_before - uds_after, 2)
    uds_improvement_pct = round(((uds_before - uds_after) / uds_before * 100.0), 1) if uds_before > 0 else 0.0

    # Overcapacity students relieved
    overcap_before = before_conflicts["summary"]["overcapacity_count"]
    overcap_after = after_conflicts["summary"]["overcapacity_count"]
    overcap_resolved = max(0, overcap_before - overcap_after)

    # Equipment mismatches resolved
    equip_before = before_conflicts["summary"]["equipment_mismatch_count"]
    equip_after = after_conflicts["summary"]["equipment_mismatch_count"]
    equip_resolved = max(0, equip_before - equip_after)

    # Underutilized slots reclaimed (hours)
    # Each slot is 1 hour
    underutil_before = before_conflicts["summary"]["underutilized_count"]
    underutil_after = after_conflicts["summary"]["underutilized_count"]
    hours_reclaimed = max(0, underutil_before - underutil_after)

    # Capacity / Seats unlocked: sum of seats gained by moving out of overcapacity rooms
    seats_unlocked = 0
    for _, ev_before in before_timetable_df.iterrows():
        eid = ev_before["event_id"]
        ev_after = after_timetable_df[after_timetable_df["event_id"] == eid]
        if not ev_after.empty:
            ev_after = ev_after.iloc[0]
            if ev_before["room_id"] != ev_after["room_id"]:
                enrolled = ev_before["enrolled_students"]
                r_before = rooms_df[rooms_df["room_id"] == ev_before["room_id"]]
                r_after = rooms_df[rooms_df["room_id"] == ev_after["room_id"]]
                if not r_before.empty and not r_after.empty:
                    cap_before = r_before.iloc[0]["capacity"]
                    cap_after = r_after.iloc[0]["capacity"]
                    if enrolled > cap_before and enrolled <= cap_after:
                        seats_unlocked += (enrolled - cap_before)

    # Faculty transit distance calculation
    if distances_matrix is None:
        distances_matrix = {}

    def get_building_distance(b1: str, b2: str) -> int:
        if b1 == b2:
            return 0
        return distances_matrix.get((b1, b2), distances_matrix.get((b2, b1), 500))

    rooms_map = {r["room_id"]: r for r in rooms_df.to_dict(orient="records")}
    faculty_map = {f["faculty_id"]: f for f in faculty_df.to_dict(orient="records")}

    def compute_total_faculty_travel(df: pd.DataFrame) -> int:
        total_m = 0
        for _, ev in df.iterrows():
            fac = faculty_map.get(ev["faculty_id"], {})
            home_b = fac.get("home_building", "")
            rm = rooms_map.get(ev["room_id"], {})
            rm_b = rm.get("building", "")
            total_m += get_building_distance(home_b, rm_b)
        return total_m

    travel_before_m = compute_total_faculty_travel(before_timetable_df)
    travel_after_m = compute_total_faculty_travel(after_timetable_df)
    travel_saved_m = max(0, travel_before_m - travel_after_m)

    return {
        "uds_before": uds_before,
        "uds_after": uds_after,
        "uds_delta": uds_delta,
        "uds_improvement_pct": uds_improvement_pct,
        "avg_utilization_before": before_util["avg_utilization_pct"],
        "avg_utilization_after": after_util["avg_utilization_pct"],
        "critical_conflicts_before": before_conflicts["summary"]["critical_count"],
        "critical_conflicts_after": after_conflicts["summary"]["critical_count"],
        "warnings_before": before_conflicts["summary"]["warning_count"],
        "warnings_after": after_conflicts["summary"]["warning_count"],
        "overcapacity_resolved": overcap_resolved,
        "equipment_resolved": equip_resolved,
        "hours_reclaimed_weekly": int(hours_reclaimed),
        "seats_unlocked": int(seats_unlocked),
        "faculty_travel_saved_meters": int(travel_saved_m)
    }
