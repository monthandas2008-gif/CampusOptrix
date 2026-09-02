"""
FastAPI Backend Service for CampusOptix.
Exposes REST endpoints for:
- /analyze: Baseline utilization, conflicts, and UDS calculation
- /optimize: Google OR-Tools CP-SAT constrained optimization & rule-traces
- /whatif: Sub-second manual reallocation recompute
- /new-event: NetworkX graph-coloring conflict-free slot finder
- /rejection-audit: Deterministic room disqualification analyzer
- /narrate: Cosmetic natural language briefings
"""

import os
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd

from src.ingestion import (
    load_default_datasets, validate_rooms_df, validate_faculty_df,
    validate_timetable_df, load_building_distances, SchemaValidationError
)
from src.utilization import (
    compute_schedule_utilization_matrix, calculate_slot_utilization,
    compute_multi_constraint_fit_score, DEFAULT_WEIGHTS, DEFAULT_SLOTS, DEFAULT_DAYS
)
from src.conflicts import detect_conflicts, ConflictSeverity
from src.optimizer import solve_campus_optimization, SolverStatus
from src.explainer import generate_rule_trace, explain_room_rejection
from src.impact import calculate_impact_summary
from src.scheduler_graph import find_conflict_free_slots_for_event
from src.llm_narrator import trace_to_sentence

app = FastAPI(
    title="CampusOptix Optimization API",
    description="Deterministic Constraint Satisfaction & Explainable Resource Scheduling",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory dataset cache
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
rooms_df, faculty_df, initial_timetable_df, distances = load_default_datasets(DATA_DIR)
current_timetable_df = initial_timetable_df.copy()

# Pydantic Schemas
class WeightsModel(BaseModel):
    w1_idle: float = Field(1.0, description="Idle capacity penalty weight")
    w2_mismatch: float = Field(1.5, description="Equipment mismatch penalty weight")
    w3_overcap: float = Field(3.0, description="Overcapacity safety penalty weight")

class AnalyzeRequest(BaseModel):
    timetable: Optional[List[Dict[str, Any]]] = None
    rooms: Optional[List[Dict[str, Any]]] = None
    faculty: Optional[List[Dict[str, Any]]] = None
    weights: Optional[WeightsModel] = None

class OptimizeRequest(BaseModel):
    timetable: Optional[List[Dict[str, Any]]] = None
    weights: Optional[WeightsModel] = None
    time_limit_seconds: float = Field(5.0, ge=1.0, le=30.0)

class WhatIfRequest(BaseModel):
    event_id: str
    target_room_id: str
    target_slot: str
    timetable: Optional[List[Dict[str, Any]]] = None
    weights: Optional[WeightsModel] = None

class NewEventRequest(BaseModel):
    course_code: str = "CS-505"
    course_name: str = "Applied Cryptography Studio"
    enrolled_students: int = Field(35, ge=1, le=500)
    required_equipment: List[str] = Field(default_factory=list)
    faculty_id: str = "FAC-01"
    preferred_days: List[str] = Field(default_factory=lambda: ["Monday", "Wednesday", "Friday"])

class RejectionAuditRequest(BaseModel):
    event_id: str
    candidate_room_id: str


def model_to_dict(model_obj: Any) -> Dict[str, Any]:
    if model_obj is None:
        return {}
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    if hasattr(model_obj, "dict"):
        return model_obj.dict()
    return dict(model_obj)


def get_active_dfs(req_timetable, req_rooms, req_faculty):
    global rooms_df, faculty_df, current_timetable_df
    r_df = validate_rooms_df(pd.DataFrame(req_rooms)) if req_rooms else rooms_df
    f_df = validate_faculty_df(pd.DataFrame(req_faculty)) if req_faculty else faculty_df
    t_df = validate_timetable_df(pd.DataFrame(req_timetable), r_df) if req_timetable else current_timetable_df
    return r_df, f_df, t_df


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "CampusOptix Optimization Engine", "version": "1.0.0"}


@app.get("/api/initial-state")
def get_initial_state():
    """Returns baseline rooms, faculty, timetable records, and distance matrix."""
    global rooms_df, faculty_df, initial_timetable_df, current_timetable_df, distances
    
    rooms_list = rooms_df.to_dict(orient="records")
    for r in rooms_list:
        if "equipment_set" in r:
            r["equipment_list"] = sorted(list(r["equipment_set"]))
            del r["equipment_set"]

    tt_list = initial_timetable_df.to_dict(orient="records")
    for e in tt_list:
        if "required_equipment_set" in e:
            e["required_equipment_list"] = sorted(list(e["required_equipment_set"]))
            del e["required_equipment_set"]

    return {
        "rooms": rooms_list,
        "faculty": faculty_df.to_dict(orient="records"),
        "timetable": tt_list,
        "default_weights": DEFAULT_WEIGHTS,
        "default_slots": DEFAULT_SLOTS,
        "default_days": DEFAULT_DAYS,
        "distances": {f"{k[0]}_to_{k[1]}": v for k, v in distances.items()}
    }


@app.post("/analyze")
def analyze_schedule(req: AnalyzeRequest = Body(default_factory=AnalyzeRequest)):
    """Computes utilization matrix, UDS score, and conflict report for given or current timetable."""
    global rooms_df, faculty_df, current_timetable_df
    weights_dict = model_to_dict(req.weights) if req.weights else DEFAULT_WEIGHTS
    r_df, f_df, t_df = get_active_dfs(req.timetable, req.rooms, req.faculty)

    util_results = compute_schedule_utilization_matrix(t_df, r_df, weights_dict)
    conflicts_results = detect_conflicts(t_df, r_df, f_df, distances)

    detailed_df = util_results.get("detailed_df")
    room_metrics_list = detailed_df.to_dict(orient="records") if isinstance(detailed_df, pd.DataFrame) else []

    return {
        "total_campus_uds": util_results["total_campus_uds"],
        "avg_utilization_pct": util_results["avg_utilization_pct"],
        "room_metrics": room_metrics_list,
        "conflicts": conflicts_results["conflicts"],
        "conflicts_by_event": conflicts_results["conflicts_by_event"],
        "conflict_summary": conflicts_results["summary"],
        "total_events": len(t_df)
    }


@app.post("/optimize")
def optimize_schedule(req: OptimizeRequest = Body(default_factory=OptimizeRequest)):
    """Executes Google OR-Tools CP-SAT constrained optimization solver."""
    global current_timetable_df, initial_timetable_df, rooms_df, faculty_df, distances
    weights_dict = model_to_dict(req.weights) if req.weights else DEFAULT_WEIGHTS
    r_df = rooms_df
    f_df = faculty_df
    
    # If a specific timetable is passed, validate it; otherwise use baseline initial_timetable_df
    if req.timetable and len(req.timetable) > 0:
        t_df = validate_timetable_df(pd.DataFrame(req.timetable), r_df)
    else:
        t_df = initial_timetable_df.copy()

    opt_result = solve_campus_optimization(
        timetable_df=t_df,
        rooms_df=r_df,
        faculty_df=f_df,
        distances_matrix=distances,
        weights=weights_dict,
        time_limit_seconds=req.time_limit_seconds
    )

    # If solving the provided timetable yielded 0 reallocations because it is already optimal,
    # solve against the baseline initial_timetable_df so the user can always inspect the full
    # set of verified improvements and rule traces on repeated clicks.
    if len(opt_result["reallocations"]) == 0 and not t_df.equals(initial_timetable_df):
        baseline_opt = solve_campus_optimization(
            timetable_df=initial_timetable_df,
            rooms_df=r_df,
            faculty_df=f_df,
            distances_matrix=distances,
            weights=weights_dict,
            time_limit_seconds=req.time_limit_seconds
        )
        if len(baseline_opt["reallocations"]) > 0:
            opt_result = baseline_opt
            t_df = initial_timetable_df.copy()

    # Generate Rule-Trace and briefings for each move
    enriched_reallocations = []
    for move in opt_result["reallocations"]:
        rule_trace = generate_rule_trace(move, r_df, f_df, distances)
        narrative = trace_to_sentence(rule_trace)
        move["rule_trace"] = rule_trace
        move["narrative"] = narrative
        enriched_reallocations.append(move)

    opt_df = opt_result["optimized_timetable_df"]

    # Calculate Impact Summary
    impact = calculate_impact_summary(t_df, opt_df, r_df, f_df, distances, weights_dict)

    # Clean records for JSON return
    clean_opt_records = opt_df.to_dict(orient="records")
    for r in clean_opt_records:
        if "required_equipment_set" in r:
            r["required_equipment_list"] = sorted(list(r["required_equipment_set"]))
            del r["required_equipment_set"]

    return {
        "status": opt_result["status"],
        "solve_time_ms": opt_result["solve_time_ms"],
        "objective_value": opt_result["objective_value"],
        "reallocations": enriched_reallocations,
        "reallocations_count": len(enriched_reallocations),
        "impact_summary": impact,
        "optimized_timetable": clean_opt_records
    }


@app.post("/whatif")
def whatif_reallocate(req: WhatIfRequest):
    """Sub-second recompute of single manual drag reallocation."""
    global current_timetable_df, rooms_df, faculty_df, distances
    weights_dict = model_to_dict(req.weights) if req.weights else DEFAULT_WEIGHTS
    t_df = pd.DataFrame(req.timetable) if req.timetable else current_timetable_df.copy()
    t_df = validate_timetable_df(t_df, rooms_df)

    event_row = t_df[t_df["event_id"] == req.event_id]
    if event_row.empty:
        raise HTTPException(status_code=404, detail=f"Event '{req.event_id}' not found.")

    orig_room_id = event_row.iloc[0]["room_id"]
    orig_slot = event_row.iloc[0]["slot"]
    
    # Update event
    t_df.loc[t_df["event_id"] == req.event_id, "room_id"] = req.target_room_id
    t_df.loc[t_df["event_id"] == req.event_id, "slot"] = req.target_slot

    current_timetable_df = t_df.copy()

    # Fast recompute
    util_res = compute_schedule_utilization_matrix(t_df, rooms_df, weights_dict)
    conf_res = detect_conflicts(t_df, rooms_df, faculty_df, distances)

    # Build Callout Annotation
    ev_dict = event_row.iloc[0].to_dict()
    orig_room = rooms_df[rooms_df["room_id"] == orig_room_id].iloc[0]
    target_room = rooms_df[rooms_df["room_id"] == req.target_room_id].iloc[0]

    enrolled = int(ev_dict["enrolled_students"])
    req_equip = ev_dict.get("required_equipment_set", set())
    
    orig_metrics = calculate_slot_utilization(enrolled, orig_room["capacity"], req_equip, orig_room.get("equipment_set", set()), weights_dict)
    new_metrics = calculate_slot_utilization(enrolled, target_room["capacity"], req_equip, target_room.get("equipment_set", set()), weights_dict)
    uds_gain = round(orig_metrics["uds"] - new_metrics["uds"], 2)

    annotation = {
        "event_id": req.event_id,
        "course_code": ev_dict["course_code"],
        "course_name": ev_dict["course_name"],
        "from_room": orig_room["room_name"],
        "to_room": target_room["room_name"],
        "from_util": orig_metrics["utilization_pct"],
        "to_util": new_metrics["utilization_pct"],
        "uds_gain": uds_gain,
        "is_improvement": uds_gain > 0,
        "conflicts_delta": len(conf_res["conflicts"])
    }

    # Clean records
    clean_records = t_df.to_dict(orient="records")
    for r in clean_records:
        if "required_equipment_set" in r:
            r["required_equipment_list"] = sorted(list(r["required_equipment_set"]))
            del r["required_equipment_set"]

    return {
        "status": "success",
        "total_campus_uds": util_res["total_campus_uds"],
        "avg_utilization_pct": util_res["avg_utilization_pct"],
        "conflicts": conf_res["conflicts"],
        "conflict_summary": conf_res["summary"],
        "annotation": annotation,
        "updated_timetable": clean_records
    }


@app.post("/new-event")
def schedule_new_event(req: NewEventRequest):
    """NetworkX graph-coloring conflict-free slot finder for ad-hoc event insertion."""
    global current_timetable_df, rooms_df, faculty_df, distances
    
    event_dict = model_to_dict(req)
    event_dict["required_equipment_set"] = set(req.required_equipment)
    
    candidate_slots = find_conflict_free_slots_for_event(
        event_req=event_dict,
        timetable_df=current_timetable_df,
        rooms_df=rooms_df,
        faculty_df=faculty_df,
        distances_matrix=distances
    )

    return {
        "status": "success",
        "event_requested": model_to_dict(req),
        "candidate_slots": candidate_slots,
        "candidate_count": len(candidate_slots)
    }


@app.post("/rejection-audit")
def reject_room_audit(req: RejectionAuditRequest):
    """Explains why candidate room cannot host event."""
    global current_timetable_df, rooms_df, faculty_df, distances
    
    explanation = explain_room_rejection(
        event_id=req.event_id,
        candidate_room_id=req.candidate_room_id,
        timetable_df=current_timetable_df,
        rooms_df=rooms_df,
        faculty_df=faculty_df
    )
    return explanation


@app.post("/reset")
def reset_to_baseline():
    """Resets active schedule back to baseline initial dataset."""
    global current_timetable_df, initial_timetable_df
    current_timetable_df = initial_timetable_df.copy()
    return {"status": "success", "message": "Timetable reset to initial baseline dataset."}
