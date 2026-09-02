"""
Comprehensive Test Suite for CampusOptix.
Tests:
- Schema Ingestion & Validation
- Utilization Engine & UDS Scoring
- Conflict Detection (Hard & Soft Constraints)
- OR-Tools CP-SAT Optimization Solver
- Deterministic Rule-Trace Explainer
- Impact Translator
- Conflict-Free Event Scheduler (NetworkX)
"""

import pytest
import pandas as pd
import numpy as np

from src.ingestion import (
    load_default_datasets, validate_rooms_df, validate_faculty_df,
    validate_timetable_df, parse_equipment, SchemaValidationError
)
from src.utilization import (
    calculate_slot_utilization, compute_schedule_utilization_matrix,
    compute_multi_constraint_fit_score
)
from src.conflicts import detect_conflicts, ConflictSeverity
from src.optimizer import solve_campus_optimization, SolverStatus
from src.explainer import generate_rule_trace, explain_room_rejection
from src.impact import calculate_impact_summary
from src.scheduler_graph import find_conflict_free_slots_for_event


@pytest.fixture
def sample_data():
    return load_default_datasets()


def test_schema_ingestion(sample_data):
    rooms_df, faculty_df, timetable_df, distances = sample_data
    assert len(rooms_df) >= 10
    assert len(faculty_df) >= 7
    assert len(timetable_df) >= 20
    assert isinstance(distances, dict)
    assert ("Science Block", "Tech Complex") in distances


def test_invalid_schema_rejection():
    # Bad capacity
    bad_rooms = pd.DataFrame([{"room_id": "R1", "room_name": "Room 1", "building": "B1", "capacity": -10}])
    with pytest.raises(SchemaValidationError):
        validate_rooms_df(bad_rooms)

    # Missing column in timetable
    bad_tt = pd.DataFrame([{"event_id": "E1", "course_code": "CS-101"}])
    with pytest.raises(SchemaValidationError):
        validate_timetable_df(bad_tt)


def test_uds_scoring_logic():
    # 1. Healthy room (50/60 = 83.3%)
    healthy = calculate_slot_utilization(
        enrolled=50,
        capacity=60,
        required_equipment={"projector"},
        room_equipment={"projector", "whiteboard"}
    )
    assert healthy["idle_penalty"] == 0.0
    assert healthy["overcap_penalty"] == 0.0
    assert healthy["mismatch_penalty"] == 0.0
    assert healthy["uds"] == 0.0

    # 2. Overcapacity (70/60 = 116.7%)
    overcap = calculate_slot_utilization(
        enrolled=70,
        capacity=60,
        required_equipment={"projector"},
        room_equipment={"projector"}
    )
    assert overcap["overcap_penalty"] > 0
    assert overcap["uds"] > 0

    # 3. Equipment Mismatch
    mismatch = calculate_slot_utilization(
        enrolled=30,
        capacity=50,
        required_equipment={"gpu_cluster"},
        room_equipment={"projector"}
    )
    assert mismatch["is_mismatch"] is True
    assert mismatch["mismatch_penalty"] == 15.0


def test_conflict_detection(sample_data):
    rooms_df, faculty_df, timetable_df, distances = sample_data
    results = detect_conflicts(timetable_df, rooms_df, faculty_df, distances)
    
    assert results["summary"]["total_conflicts"] > 0
    assert results["summary"]["overcapacity_count"] >= 3
    assert results["summary"]["equipment_mismatch_count"] >= 1


def test_ortools_optimization_solver(sample_data):
    rooms_df, faculty_df, timetable_df, distances = sample_data
    
    opt_result = solve_campus_optimization(
        timetable_df=timetable_df,
        rooms_df=rooms_df,
        faculty_df=faculty_df,
        distances_matrix=distances,
        time_limit_seconds=5.0
    )
    
    assert opt_result["status"] in (SolverStatus.OPTIMAL, SolverStatus.FEASIBLE)
    assert opt_result["reallocations_count"] > 0
    
    opt_df = opt_result["optimized_timetable_df"]
    # Check that after optimization, critical conflicts are eliminated or vastly reduced
    post_conflicts = detect_conflicts(opt_df, rooms_df, faculty_df, distances)
    assert post_conflicts["summary"]["critical_count"] == 0


def test_rule_trace_explainer(sample_data):
    rooms_df, faculty_df, timetable_df, distances = sample_data
    opt_result = solve_campus_optimization(timetable_df, rooms_df, faculty_df, distances)
    
    realloc = opt_result["reallocations"][0]
    trace = generate_rule_trace(realloc, rooms_df, faculty_df, distances)
    
    assert "constraints_checked" in trace
    assert len(trace["constraints_checked"]) == 4
    assert trace["uds_reduction"] >= 0


def test_room_rejection_explainer(sample_data):
    rooms_df, faculty_df, timetable_df, distances = sample_data
    # Event with 55 students, candidate room with cap 30
    ev = {"event_id": "TEST", "enrolled_students": 55, "day": "Monday", "slot": "09:00-10:00", "required_equipment_set": set()}
    rejection = explain_room_rejection(ev, "CR-301", rooms_df, timetable_df)
    
    assert rejection["is_valid"] is False
    assert any("Capacity Violation" in r for r in rejection["reasons"])


def test_conflict_free_new_event_scheduler(sample_data):
    rooms_df, faculty_df, timetable_df, distances = sample_data
    
    event_req = {
        "course_code": "CS-601",
        "course_name": "Special Topics in Optimization",
        "enrolled_students": 30,
        "required_equipment": ["projector"],
        "faculty_id": "FAC-01"
    }
    
    valid_slots = find_conflict_free_slots_for_event(
        event_req=event_req,
        timetable_df=timetable_df,
        rooms_df=rooms_df,
        faculty_df=faculty_df,
        distances_matrix=distances
    )
    
    assert len(valid_slots) > 0
    assert valid_slots[0]["fit_score"] > 0
