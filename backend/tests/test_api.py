"""
Unit & Integration tests for CampusOptrix FastAPI endpoints.
Tests /health, /api/initial-state, /analyze, /optimize, /whatif, /new-event, /rejection-audit, and /reset.
"""

import pytest
import backend.main as api_server
from backend.main import (
    AnalyzeRequest, OptimizeRequest, WhatIfRequest,
    NewEventRequest, RejectionAuditRequest, WeightsModel
)


def test_api_health():
    res = api_server.health_check()
    assert res["status"] == "ok"
    assert "CampusOptrix" in res["service"]


def test_api_initial_state():
    res = api_server.get_initial_state()
    assert "rooms" in res
    assert "faculty" in res
    assert "timetable" in res
    assert len(res["rooms"]) >= 10
    assert len(res["timetable"]) >= 20


def test_api_analyze():
    req = AnalyzeRequest()
    res = api_server.analyze_schedule(req)
    assert "total_campus_uds" in res
    assert "avg_utilization_pct" in res
    assert "conflicts" in res
    assert "conflict_summary" in res
    assert res["total_events"] > 0


def test_api_optimize():
    req = OptimizeRequest(time_limit_seconds=3.0)
    res = api_server.optimize_schedule(req)
    assert res["status"] in ("OPTIMAL", "FEASIBLE")
    assert "reallocations" in res
    assert "impact_summary" in res
    assert "optimized_timetable" in res
    assert res["solve_time_ms"] > 0


def test_api_whatif():
    initial = api_server.get_initial_state()
    first_event = initial["timetable"][0]
    rooms = initial["rooms"]
    target_room = rooms[1]["room_id"] if rooms[0]["room_id"] == first_event["room_id"] else rooms[0]["room_id"]
    
    req = WhatIfRequest(
        event_id=first_event["event_id"],
        target_room_id=target_room,
        target_slot="14:00-15:00"
    )
    res = api_server.whatif_reallocate(req)
    assert res["status"] == "success"
    assert "annotation" in res
    assert res["annotation"]["event_id"] == first_event["event_id"]
    assert "updated_timetable" in res


def test_api_new_event():
    req = NewEventRequest(
        course_code="TEST-101",
        course_name="Introduction to Optimization",
        enrolled_students=25,
        required_equipment=["projector"],
        faculty_id="FAC-01",
        preferred_days=["Monday", "Wednesday"]
    )
    res = api_server.schedule_new_event(req)
    assert res["status"] == "success"
    assert "candidate_slots" in res
    assert isinstance(res["candidate_slots"], list)


def test_api_rejection_audit():
    initial = api_server.get_initial_state()
    first_event = initial["timetable"][0]
    rooms = initial["rooms"]
    # Pick a room that is not the currently assigned room
    other_room = next(r["room_id"] for r in rooms if r["room_id"] != first_event["room_id"])

    req = RejectionAuditRequest(
        event_id=first_event["event_id"],
        candidate_room_id=other_room
    )
    res = api_server.reject_room_audit(req)
    assert "candidate_room_id" in res
    assert "is_eligible" in res
    assert "rejection_reasons" in res


def test_api_reset():
    res = api_server.reset_to_baseline()
    assert res["status"] == "success"
