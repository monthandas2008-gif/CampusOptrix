"""
CampusOptix — Explainable Smart Campus Resource & Classroom Optimizer
Entry Point for Streamlit Web Application.
Adheres to "The Blueprint" architectural design system and deterministic OR-Tools optimization.
"""

import os
import time
import pandas as pd
import numpy as np
import streamlit as st
import streamlit.components.v1 as components
import matplotlib.pyplot as plt
import seaborn as sns

# Import core modules
from src.ingestion import (
    load_default_datasets, validate_rooms_df, validate_faculty_df,
    validate_timetable_df, load_building_distances, SchemaValidationError
)
from src.utilization import (
    compute_schedule_utilization_matrix, calculate_slot_utilization,
    DEFAULT_WEIGHTS, DEFAULT_SLOTS, DEFAULT_DAYS
)
from src.conflicts import detect_conflicts, ConflictSeverity
from src.optimizer import solve_campus_optimization, SolverStatus
from src.explainer import generate_rule_trace, explain_room_rejection
from src.impact import calculate_impact_summary
from src.scheduler_graph import find_conflict_free_slots_for_event
from src.llm_narrator import trace_to_sentence
from components.blueprint_grid.renderer import render_blueprint_grid_html

# Set page config
st.set_page_config(
    page_title="CampusOptix — Explainable Resource Optimizer",
    page_icon="📐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject Global Blueprint CSS
st.markdown("""
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  :root {
    --paper: #F2EFE6;
    --ink: #1C2B3A;
    --blueprint: #2F5D8A;
    --signal-amber: #C97A2E;
    --signal-green: #4C7A5E;
    --font-mono: 'IBM Plex Mono', Consolas, monospace;
    --font-sans: 'IBM Plex Sans', sans-serif;
  }

  /* Main background & typography */
  .stApp {
    background-color: var(--paper) !important;
    color: var(--ink) !important;
    font-family: var(--font-sans) !important;
  }

  /* Header Title Block */
  .title-block {
    border: 2px solid var(--ink);
    padding: 14px 20px;
    background: #FAF8F2;
    margin-bottom: 20px;
    position: relative;
  }

  .title-block-header {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--ink);
    text-transform: uppercase;
    margin: 0;
  }

  .title-block-sub {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--blueprint);
    margin-top: 4px;
    font-weight: 600;
  }

  /* KPI metric card */
  .metric-card {
    border: 1.5px solid var(--blueprint);
    background: #FFFFFF;
    padding: 12px 16px;
    margin-bottom: 12px;
  }

  .metric-label {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--blueprint);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    font-family: var(--font-mono);
    font-size: 26px;
    font-weight: 700;
    color: var(--ink);
    margin-top: 4px;
  }

  .metric-delta {
    font-family: var(--font-mono);
    font-size: 11px;
    margin-top: 4px;
  }

  .delta-positive { color: var(--signal-green); font-weight: 600; }
  .delta-negative { color: var(--signal-amber); font-weight: 600; }

  /* Recommendation Card */
  .rec-card {
    border: 1.5px solid var(--ink);
    background: #FFFFFF;
    padding: 14px 18px;
    margin-bottom: 14px;
    border-left: 6px solid var(--blueprint);
  }

  .rec-header {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }

  .rule-tag {
    display: inline-block;
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    margin-right: 6px;
    text-transform: uppercase;
  }

  .tag-resolved { background: rgba(76, 122, 94, 0.2); color: var(--signal-green); border: 1px solid var(--signal-green); }
  .tag-improved { background: rgba(47, 93, 138, 0.15); color: var(--blueprint); border: 1px solid var(--blueprint); }
  .tag-warning { background: rgba(201, 122, 46, 0.2); color: var(--signal-amber); border: 1px solid var(--signal-amber); }

  /* Tab styling */
  .stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    border-bottom: 2px solid var(--blueprint);
  }

  .stTabs [data-baseweb="tab"] {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 600;
    border-radius: 0px !important;
    padding: 8px 16px;
    border: 1px solid var(--blueprint);
    background: #FAF8F2;
    color: var(--ink);
  }

  .stTabs [aria-selected="true"] {
    background: var(--blueprint) !important;
    color: #FFFFFF !important;
  }
</style>
""", unsafe_allow_html=True)


# Initialize Session State
if "rooms_df" not in st.session_state:
    r_df, f_df, t_df, dists = load_default_datasets()
    st.session_state["rooms_df"] = r_df
    st.session_state["faculty_df"] = f_df
    st.session_state["initial_timetable_df"] = t_df
    st.session_state["current_timetable_df"] = t_df.copy()
    st.session_state["distances"] = dists
    st.session_state["optimization_result"] = None
    st.session_state["accepted_moves"] = set()
    st.session_state["weights"] = DEFAULT_WEIGHTS.copy()


# --- SIDEBAR CONFIGURATION ---
with st.sidebar:
    st.markdown("""
    <div style="border: 2px solid #1C2B3A; padding: 10px; background:#FAF8F2; margin-bottom:15px;">
      <div style="font-size:18px; font-weight:800; color:#1C2B3A; letter-spacing:1px;">📐 CAMPUSOPTIX</div>
      <div style="font-family:'IBM Plex Mono', monospace; font-size:10px; color:#2F5D8A;">EXPLAINABLE SCHEDULING ENGINE</div>
      <div style="font-family:'IBM Plex Mono', monospace; font-size:9px; color:#666; margin-top:4px;">OR-Tools CP-SAT • Zero Blackbox</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 🎛️ Scoring Weights (UDS)")
    st.caption("Adjust debt penalty multipliers live:")
    w1 = st.slider("w1: Idle Capacity Penalty", min_value=0.0, max_value=5.0, value=float(st.session_state["weights"]["w1_idle"]), step=0.1)
    w2 = st.slider("w2: Equipment Mismatch Penalty", min_value=0.0, max_value=5.0, value=float(st.session_state["weights"]["w2_mismatch"]), step=0.1)
    w3 = st.slider("w3: Overcapacity Safety Penalty", min_value=0.0, max_value=8.0, value=float(st.session_state["weights"]["w3_overcap"]), step=0.1)
    
    st.session_state["weights"]["w1_idle"] = w1
    st.session_state["weights"]["w2_mismatch"] = w2
    st.session_state["weights"]["w3_overcap"] = w3

    st.divider()
    st.markdown("### 📂 Data Management")
    
    data_source_mode = st.radio("Dataset Source", ["Synthetic Standard (10 Rooms)", "Upload Custom CSVs", "Reset to Baseline"], index=0)
    
    if data_source_mode == "Upload Custom CSVs":
        uploaded_rooms = st.file_uploader("Upload rooms.csv", type=["csv"])
        uploaded_faculty = st.file_uploader("Upload faculty.csv", type=["csv"])
        uploaded_timetable = st.file_uploader("Upload timetable.csv", type=["csv"])
        
        if uploaded_rooms and uploaded_faculty and uploaded_timetable:
            try:
                r_df = validate_rooms_df(pd.read_csv(uploaded_rooms))
                f_df = validate_faculty_df(pd.read_csv(uploaded_faculty))
                t_df = validate_timetable_df(pd.read_csv(uploaded_timetable), r_df)
                
                if st.button("Apply Uploaded Data"):
                    st.session_state["rooms_df"] = r_df
                    st.session_state["faculty_df"] = f_df
                    st.session_state["initial_timetable_df"] = t_df
                    st.session_state["current_timetable_df"] = t_df.copy()
                    st.session_state["optimization_result"] = None
                    st.success("Custom datasets loaded & verified successfully!")
                    st.rerun()
            except SchemaValidationError as e:
                st.error(f"Schema Validation Error: {e}")
            except Exception as e:
                st.error(f"Upload error: {e}")

    elif data_source_mode == "Reset to Baseline":
        if st.button("🔄 Reset All Schedules"):
            r_df, f_df, t_df, dists = load_default_datasets()
            st.session_state["rooms_df"] = r_df
            st.session_state["faculty_df"] = f_df
            st.session_state["initial_timetable_df"] = t_df
            st.session_state["current_timetable_df"] = t_df.copy()
            st.session_state["optimization_result"] = None
            st.session_state["accepted_moves"] = set()
            st.success("Reset to baseline sample!")
            st.rerun()

    st.divider()
    st.markdown("### ⚡ Optimization Engine")
    time_limit = st.slider("CP-SAT Time Limit (s)", min_value=1.0, max_value=15.0, value=3.0, step=0.5)
    
    if st.button("🚀 Run Global Optimization", use_container_width=True, type="primary"):
        with st.spinner("Formulating CP-SAT constraints and solving assignment matrix..."):
            opt_res = solve_campus_optimization(
                timetable_df=st.session_state["initial_timetable_df"],
                rooms_df=st.session_state["rooms_df"],
                faculty_df=st.session_state["faculty_df"],
                distances_matrix=st.session_state["distances"],
                weights=st.session_state["weights"],
                time_limit_seconds=time_limit
            )
            st.session_state["optimization_result"] = opt_res
            st.session_state["current_timetable_df"] = opt_res["optimized_timetable_df"].copy()
            st.success(f"Optimized in {opt_res['solve_time_ms']} ms! {opt_res['reallocations_count']} moves identified.")
            st.rerun()


# --- HEADER TITLE BLOCK ---
st.markdown("""
<div class="title-block">
  <div style="display:flex; justify-content:space-between; align-items:center;">
    <div>
      <h1 class="title-block-header">CAMPUSOPTIX // EXPLAINABLE RESOURCE ALLOCATOR</h1>
      <div class="title-block-sub">SPIDERVERSE HACKATHON 2026 • DETERMINISTIC CONSTRAINT SATISFACTION (OR-TOOLS CP-SAT)</div>
    </div>
    <div style="text-align:right; font-family:'IBM Plex Mono', monospace; font-size:11px; color:#1C2B3A;">
      <div>STATUS: <strong>SYSTEM READY</strong></div>
      <div>MODE: <strong>MULTI-CONSTRAINT AUDIT</strong></div>
    </div>
  </div>
</div>
""", unsafe_allow_html=True)


# Fetch Current Data State
rooms_df = st.session_state["rooms_df"]
faculty_df = st.session_state["faculty_df"]
initial_timetable_df = st.session_state["initial_timetable_df"]
current_timetable_df = st.session_state["current_timetable_df"]
distances = st.session_state["distances"]
weights = st.session_state["weights"]

# Calculate Current State Metrics
current_util = compute_schedule_utilization_matrix(current_timetable_df, rooms_df, weights)
current_conflicts = detect_conflicts(current_timetable_df, rooms_df, faculty_df, distances)
impact_metrics = calculate_impact_summary(initial_timetable_df, current_timetable_df, rooms_df, faculty_df, distances, weights)


# Top Summary KPI Strip
col1, col2, col3, col4, col5 = st.columns(5)
with col1:
    uds_val = current_util["total_campus_uds"]
    st.markdown(f"""
    <div class="metric-card">
      <div class="metric-label">Utilization Debt Score</div>
      <div class="metric-value">{uds_val:.1f}</div>
      <div class="metric-delta {'delta-positive' if impact_metrics['uds_delta'] > 0 else ''}">
        {'↓ -' + str(impact_metrics['uds_delta']) + ' pts reclaimed' if impact_metrics['uds_delta'] > 0 else 'Baseline metric'}
      </div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    avg_u = current_util["avg_utilization_pct"]
    st.markdown(f"""
    <div class="metric-card">
      <div class="metric-label">Avg Room Utilization</div>
      <div class="metric-value">{avg_u:.1f}%</div>
      <div class="metric-delta {'delta-positive' if avg_u >= impact_metrics['avg_utilization_before'] else ''}">
        Target band: 60% – 95%
      </div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    crit_c = current_conflicts["summary"]["critical_count"]
    st.markdown(f"""
    <div class="metric-card">
      <div class="metric-label">Critical Safety Clashes</div>
      <div class="metric-value" style="color: {'#C97A2E' if crit_c > 0 else '#4C7A5E'};">{crit_c}</div>
      <div class="metric-delta">
        {f"⚠️ {current_conflicts['summary']['overcapacity_count']} Overcap, {current_conflicts['summary']['equipment_mismatch_count']} Equip" if crit_c > 0 else "✓ Zero fire-code clashes"}
      </div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    hours_rec = impact_metrics["hours_reclaimed_weekly"]
    st.markdown(f"""
    <div class="metric-card">
      <div class="metric-label">Idle Capacity Reclaimed</div>
      <div class="metric-value">{hours_rec} hrs</div>
      <div class="metric-delta delta-positive">
        +{impact_metrics['seats_unlocked']} seats unlocked
      </div>
    </div>
    """, unsafe_allow_html=True)

with col5:
    travel_saved = impact_metrics["faculty_travel_saved_meters"]
    st.markdown(f"""
    <div class="metric-card">
      <div class="metric-label">Faculty Travel Saved</div>
      <div class="metric-value">{travel_saved} m</div>
      <div class="metric-delta delta-positive">
        Cross-campus sprints cut
      </div>
    </div>
    """, unsafe_allow_html=True)


# --- MAIN INTERFACE TABS ---
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Spatial Heatmap & Diagnostics",
    "⚡ Optimization & Rule-Trace",
    "📐 Live What-If Simulator",
    "➕ Conflict-Free Event Scheduler",
    "🔍 Rejection Audit & Formula Explorer"
])


# ==========================================
# TAB 1: SPATIAL HEATMAP & DIAGNOSTICS
# ==========================================
with tab1:
    st.markdown("#### 🏛️ Campus Space Utilization Matrix")
    
    col_day, col_filter = st.columns([2, 4])
    with col_day:
        selected_day = st.selectbox("Select Day to Inspect", DEFAULT_DAYS, index=0)
    with col_filter:
        selected_building = st.multiselect("Filter by Building", rooms_df["building"].unique(), default=rooms_df["building"].unique())

    # Build Day Heatmap Visual
    day_mat_df = current_util["day_matrices"].get(selected_day)
    if day_mat_df is not None and not day_mat_df.empty:
        filtered_mat = day_mat_df[day_mat_df["building"].isin(selected_building)]
        
        # Prepare numerical matrix for heatmap
        util_cols = [f"{s}_util" for s in DEFAULT_SLOTS]
        plot_data = filtered_mat[util_cols].copy()
        plot_data.columns = [s.replace(":00", "") for s in DEFAULT_SLOTS]
        plot_data.index = filtered_mat["room_name"] + " (" + filtered_mat["room_id"] + ")"

        fig, ax = plt.subplots(figsize=(11, 4.5), facecolor="#F2EFE6")
        ax.set_facecolor("#F2EFE6")

        # Custom architectural colormap
        cmap = sns.diverging_palette(35, 140, s=85, l=55, as_cmap=True)
        sns.heatmap(
            plot_data,
            annot=True,
            fmt=".0f",
            cmap="YlGnBu",
            vmin=0,
            vmax=120,
            cbar_kws={'label': 'Utilization %'},
            linewidths=1.2,
            linecolor='#1C2B3A',
            ax=ax
        )
        ax.set_title(f"SPATIAL UTILIZATION HEATMAP // {selected_day.upper()} (ROOMS × TIME SLOTS)", fontsize=11, fontfamily='monospace', fontweight='bold', color='#1C2B3A', pad=12)
        ax.set_xlabel("Time Slot", fontsize=10, fontfamily='monospace', color='#1C2B3A')
        ax.set_ylabel("Facility / Room", fontsize=10, fontfamily='monospace', color='#1C2B3A')
        plt.xticks(rotation=0, fontfamily='monospace', fontsize=9)
        plt.yticks(fontfamily='monospace', fontsize=9)
        st.pyplot(fig)

    st.markdown("#### 🚨 Detected Bottlenecks & Conflicts")
    if current_conflicts["conflicts"]:
        conf_table = []
        for c in current_conflicts["conflicts"]:
            conf_table.append({
                "Severity": "🔴 CRITICAL" if c["severity"] == ConflictSeverity.CRITICAL else "🟡 WARNING",
                "Type": c["type"],
                "Day & Slot": f"{c.get('day', '')} {c.get('slot', '')}",
                "Course": f"{c.get('course_code', '')} ({c.get('course_name', '')})",
                "Assigned Room": c.get("room_name", c.get("room_id", "N/A")),
                "Issue Description": c["message"]
            })
        st.dataframe(pd.DataFrame(conf_table), use_container_width=True, hide_index=True)
    else:
        st.success("✓ Zero conflicts detected! Current timetable satisfies 100% of hard and soft constraints.")


# ==========================================
# TAB 2: OPTIMIZATION & RULE-TRACE
# ==========================================
with tab2:
    st.markdown("#### ⚡ Deterministic Constraint Optimization (OR-Tools CP-SAT)")
    
    opt_result = st.session_state["optimization_result"]
    if opt_result is None:
        st.info("Run the optimizer via the sidebar button or click below to compute globally optimal room reassignments.")
        if st.button("🚀 Solve Optimization Model Now", type="primary"):
            with st.spinner("Executing CP-SAT solver..."):
                opt_res = solve_campus_optimization(
                    timetable_df=st.session_state["initial_timetable_df"],
                    rooms_df=st.session_state["rooms_df"],
                    faculty_df=st.session_state["faculty_df"],
                    distances_matrix=st.session_state["distances"],
                    weights=st.session_state["weights"]
                )
                st.session_state["optimization_result"] = opt_res
                st.session_state["current_timetable_df"] = opt_res["optimized_timetable_df"].copy()
                st.rerun()
    else:
        st.markdown(f"""
        <div style="background:#FAF8F2; border:1.5px solid var(--blueprint); padding:10px 14px; margin-bottom:15px; font-family:'IBM Plex Mono', monospace; font-size:12px;">
          <strong>SOLVER AUDIT METRICS:</strong> Status: <code>{opt_result['status']}</code> | Solve Time: <code>{opt_result['solve_time_ms']} ms</code> | Total Recommended Reallocations: <code>{opt_result['reallocations_count']}</code> | Engine: <code>Google OR-Tools CP-SAT (Integer Program)</code>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("### 📋 Audited Recommendation Stream")
        st.caption("Every recommended move is accompanied by its deterministic constraint proof log (zero LLM hallucination):")

        for idx, move in enumerate(opt_result["reallocations"]):
            rule_trace = generate_rule_trace(move, rooms_df, faculty_df, distances)
            narrative = trace_to_sentence(rule_trace)

            with st.expander(f"📍 Move #{idx+1}: {rule_trace['course_code']} ({rule_trace['from_room']} ➔ {rule_trace['to_room']}) [{rule_trace['day']} {rule_trace['slot']}]", expanded=(idx < 2)):
                st.markdown(f"**Executive Briefing:** {narrative}")
                
                # Rule Trace Tags & Constraint Checklist
                st.markdown("##### 🔍 Constraint Satisfaction Audit Log:")
                for check in rule_trace["constraints_checked"]:
                    status_badge = f"<span class='rule-tag tag-resolved'>✓ {check['status']}</span>" if "RESOLVED" in check['status'] or "SATISFIED" in check['status'] or "IMPROVED" in check['status'] else f"<span class='rule-tag tag-warning'>⚠️ {check['status']}</span>"
                    st.markdown(f"{status_badge} **{check['constraint']}**: {check['detail']}", unsafe_allow_html=True)

                st.markdown(f"""
                <div style="font-family:'IBM Plex Mono', monospace; font-size:11px; margin-top:8px; color:#2F5D8A;">
                  • Multi-Constraint Net Fit Gain: <strong>+{rule_trace['net_fit_gain']}</strong><br>
                  • Utilization Debt Reduction: <strong>-{rule_trace['uds_reduction']:.1f} pts</strong>
                </div>
                """, unsafe_allow_html=True)


# ==========================================
# TAB 3: LIVE WHAT-IF SIMULATOR
# ==========================================
with tab3:
    st.markdown("#### 📐 Interactive Drafting Canvas & What-If Simulator")
    st.caption("Drag course cards directly between facility cells to test ad-hoc relocations. The engine calculates live UDS debt impact and room suitability instantaneously.")
    
    sim_day = st.selectbox("Simulator Day", DEFAULT_DAYS, index=0, key="sim_day_select")
    
    # Render embedded vanilla HTML/CSS/JS Blueprint grid
    grid_html = render_blueprint_grid_html(
        timetable_df=st.session_state["current_timetable_df"],
        rooms_df=rooms_df,
        faculty_df=faculty_df,
        selected_day=sim_day,
        weights=st.session_state["weights"],
        height=660
    )
    components.html(grid_html, height=680, scrolling=True)


# ==========================================
# TAB 4: CONFLICT-FREE EVENT SCHEDULER
# ==========================================
with tab4:
    st.markdown("#### ➕ Conflict-Free New Event Scheduler (NetworkX Graph Engine)")
    st.caption("Need to schedule an ad-hoc class, guest seminar, or makeup lab? Enter the requirements below to let the graph-coloring engine find optimal, unclashing slots.")

    with st.form("new_event_form"):
        col_c1, col_c2, col_c3 = st.columns(3)
        with col_c1:
            req_code = st.text_input("Course Code", value="CS-505")
            req_name = st.text_input("Course / Event Name", value="Applied Cryptography Workshop")
        with col_c2:
            req_enrolled = st.number_input("Enrolled Student Strength", min_value=5, max_value=200, value=38, step=1)
            req_fac = st.selectbox("Instructor", faculty_df["faculty_name"].tolist(), index=0)
        with col_c3:
            all_equipment = sorted(list(set().union(*rooms_df["equipment_set"])))
            req_equip_selected = st.multiselect("Required Equipment / Lab Hardware", all_equipment, default=["projector"])
            req_days = st.multiselect("Preferred Days", DEFAULT_DAYS, default=["Monday", "Wednesday", "Friday"])

        submit_sched = st.form_submit_state = st.form_submit_button("🔍 Find Conflict-Free Allocations", type="primary")

    if submit_sched:
        fac_id = faculty_df[faculty_df["faculty_name"] == req_fac].iloc[0]["faculty_id"]
        event_req = {
            "course_code": req_code,
            "course_name": req_name,
            "enrolled_students": req_enrolled,
            "required_equipment": req_equip_selected,
            "faculty_id": fac_id
        }
        
        valid_slots = find_conflict_free_slots_for_event(
            event_req=event_req,
            timetable_df=st.session_state["current_timetable_df"],
            rooms_df=rooms_df,
            faculty_df=faculty_df,
            distances_matrix=distances,
            preferred_days=req_days
        )

        if valid_slots:
            st.success(f"✓ Found {len(valid_slots)} valid, zero-conflict candidate slots ranked by Multi-Constraint Fit Score!")
            slots_display = []
            for vs in valid_slots[:8]:
                slots_display.append({
                    "Rank": f"#{vs['recommendation_rank']}",
                    "Day": vs["day"],
                    "Time Slot": vs["slot"],
                    "Room": f"{vs['room_name']} ({vs['building']})",
                    "Capacity": f"{vs['enrolled']}/{vs['capacity']} ({vs['utilization_pct']}%)",
                    "Fit Score": f"+{vs['fit_score']:.2f}",
                    "Expected UDS": f"{vs['expected_uds']:.1f}",
                    "Faculty Transit": f"{vs['distance_from_faculty_home']}m"
                })
            st.dataframe(pd.DataFrame(slots_display), use_container_width=True, hide_index=True)
        else:
            st.warning("No feasible zero-conflict slot found matching all hard equipment, capacity, and instructor constraints across the chosen days.")


# ==========================================
# TAB 5: REJECTION AUDIT & FORMULA EXPLORER
# ==========================================
with tab5:
    st.markdown("#### 🔍 Rejection Audit Investigator")
    st.caption("Ask why a specific room was REJECTED for an event to verify hard constraints and avoid black-box skepticism.")

    col_e1, col_e2 = st.columns(2)
    with col_e1:
        ev_options = [f"{r['event_id']}: {r['course_code']} ({r['day']} {r['slot']})" for _, r in current_timetable_df.iterrows()]
        selected_ev_str = st.selectbox("Select Scheduled Event", ev_options)
        selected_ev_id = selected_ev_str.split(":")[0].strip()
        ev_record = current_timetable_df[current_timetable_df["event_id"] == selected_ev_id].iloc[0].to_dict()

    with col_e2:
        candidate_r_id = st.selectbox("Select Candidate Room to Investigate", rooms_df["room_id"].tolist())

    if st.button("Audit Room Feasibility"):
        rejection_res = explain_room_rejection(ev_record, candidate_r_id, rooms_df, current_timetable_df)
        if rejection_res["is_valid"]:
            st.success(f"✓ Room **{rejection_res['candidate_room']}** is FEASIBLE for this event!")
        else:
            st.error(f"✗ Room **{rejection_res['candidate_room']}** REJECTED due to the following hard constraints:")
            for reason in rejection_res["reasons"]:
                st.markdown(f"• **{reason}**")

    st.divider()
    st.markdown("#### 📐 Mathematical Formulation & Exact Scoring Model")
    st.markdown(r"""
    ##### 1. Utilization Debt Score (UDS) Formula:
    $$\text{UDS}(\text{room}, \text{slot}) = w_1 \cdot \text{idle\_penalty} + w_2 \cdot \text{mismatch\_penalty} + w_3 \cdot \text{overcap\_penalty}$$
    - $\text{idle\_penalty} = \max(0, 0.60 - \text{utilization}) \times 10$
    - $\text{overcap\_penalty} = \max(0, \text{utilization} - 1.0) \times 30$
    - $\text{mismatch\_penalty} = 15.0 \text{ if equipment missing else } 0$

    ##### 2. Multi-Constraint Fit Score:
    $$\text{Fit} = \text{capacity\_fit} + \text{equipment\_fit} + \text{travel\_fit} + \text{buffer\_fit}$$
    - $\text{capacity\_fit} = 1.0 \text{ if enrolled} \le \text{capacity else } -2.0$
    - $\text{equipment\_fit} = 1.0 \text{ if required} \subseteq \text{available else } -5.0$
    - $\text{travel\_fit} = \frac{1}{1 + \frac{\text{distance (meters)}}{100}}$
    - $\text{buffer\_fit} = 1.0 \text{ if transit gap} \ge \text{min buffer else } -1.0$
    """)
