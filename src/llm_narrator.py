"""
Cosmetic Natural Language Phrasing Helper for CampusOptix.
Converts structured Rule-Trace JSON dictionaries into natural narrative sentences.
Deterministic fallback template ensures zero hallucination and zero runtime dependency on external APIs.
"""

from typing import Dict, Any, Optional

def trace_to_sentence(trace_dict: Dict[str, Any]) -> str:
    """
    Translate a structured rule-trace dictionary into a human-readable executive briefing.
    """
    course = trace_dict.get("course_code", "Course")
    c_name = trace_dict.get("course_name", "")
    from_r = trace_dict.get("from_room", "Current Room")
    to_r = trace_dict.get("to_room", "Target Room")
    slot = trace_dict.get("slot", "")
    day = trace_dict.get("day", "")
    uds_drop = trace_dict.get("uds_reduction", 0.0)

    # Key highlights from constraint checks
    highlights = []
    for c in trace_dict.get("constraints_checked", []):
        if c.get("status") == "RESOLVED":
            if "Capacity" in c.get("constraint", ""):
                highlights.append("resolving overcrowding hazard")
            elif "Equipment" in c.get("constraint", ""):
                highlights.append("satisfying required lab hardware")
        elif c.get("status") == "IMPROVED":
            if "Transit" in c.get("constraint", ""):
                highlights.append("reducing faculty campus transit")

    highlight_str = f" by {', '.join(highlights)}" if highlights else ""
    
    sentence = (
        f"Reassign **{course}** ({c_name}) from **{from_r}** to **{to_r}** on {day} ({slot}){highlight_str}. "
        f"This move eliminates **{uds_drop:.1f} debt points** and optimizes room-size matching."
    )
    return sentence
