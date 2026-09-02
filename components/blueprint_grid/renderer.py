"""
Blueprint Grid Component Renderer for CampusOptix.
Loads template.html and styles.css and substitutes data payloads for embedded Streamlit display.
"""

import json
import os
import pandas as pd
from typing import Dict, List, Any, Optional

def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code."""
    if isinstance(obj, set):
        return sorted(list(obj))
    if isinstance(obj, (pd.Timestamp, pd.Timedelta)):
        return str(obj)
    return str(obj)

def render_blueprint_grid_html(
    timetable_df: pd.DataFrame,
    rooms_df: pd.DataFrame,
    faculty_df: pd.DataFrame,
    selected_day: str = "Monday",
    weights: Optional[Dict[str, float]] = None,
    height: int = 680
) -> str:
    """
    Generate complete self-contained HTML/CSS/JS document for the interactive Blueprint Grid.
    """
    if weights is None:
        weights = {"w1_idle": 1.0, "w2_mismatch": 1.5, "w3_overcap": 3.0}

    # Filter events for the selected day
    day_events = timetable_df[timetable_df["day"] == selected_day].to_dict(orient="records")
    rooms_list = rooms_df.to_dict(orient="records")
    faculty_list = faculty_df.to_dict(orient="records")

    # Ensure clean equipment lists for javascript
    for r in rooms_list:
        if "equipment_set" in r and isinstance(r["equipment_set"], set):
            r["equipment_list"] = sorted(list(r["equipment_set"]))
        elif "equipment" in r:
            r["equipment_list"] = [x.strip().lower() for x in str(r["equipment"]).split(",") if x.strip()]
        else:
            r["equipment_list"] = []

    for e in day_events:
        if "required_equipment_set" in e and isinstance(e["required_equipment_set"], set):
            e["required_equipment_list"] = sorted(list(e["required_equipment_set"]))
        elif "required_equipment" in e:
            e["required_equipment_list"] = [x.strip().lower() for x in str(e["required_equipment"]).split(",") if x.strip()]
        else:
            e["required_equipment_list"] = []

    # Slots
    slots = [
        "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
    ]

    base_dir = os.path.dirname(__file__)
    template_path = os.path.join(base_dir, "template.html")
    css_path = os.path.join(base_dir, "styles.css")

    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    custom_css = ""
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            custom_css = f.read()

    slot_headers_html = "".join([f"<th>{s}</th>" for s in slots])

    html_content = html_content.replace("/* __CUSTOM_CSS__ */", custom_css)
    html_content = html_content.replace("__SELECTED_DAY__", selected_day.upper())
    html_content = html_content.replace("<!-- __SLOT_HEADERS__ -->", slot_headers_html)
    html_content = html_content.replace("__ROOMS_JSON__", json.dumps(rooms_list, default=_json_serial))
    html_content = html_content.replace("__EVENTS_JSON__", json.dumps(day_events, default=_json_serial))
    html_content = html_content.replace("__SLOTS_JSON__", json.dumps(slots))
    html_content = html_content.replace("__WEIGHTS_JSON__", json.dumps(weights))

    return html_content
