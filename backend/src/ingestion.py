"""
Data Ingestion and Schema Validation Layer for CampusOptix.
Loads timetable, rooms, faculty, and distance matrix from CSV, Excel, or SQLite.
Validates required columns, ranges, and types, raising explicit descriptive errors.
"""

import os
import sqlite3
import pandas as pd
from typing import Dict, Tuple, List, Any, Optional

REQUIRED_ROOM_COLUMNS = ["room_id", "room_name", "building", "capacity"]
REQUIRED_FACULTY_COLUMNS = ["faculty_id", "faculty_name", "department"]
REQUIRED_TIMETABLE_COLUMNS = ["event_id", "course_code", "course_name", "faculty_id", "enrolled_students", "day", "slot", "room_id"]

VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

class SchemaValidationError(Exception):
    """Raised when an uploaded file violates required schema or data integrity."""
    pass


def parse_equipment(equipment_str: Any) -> set:
    """Safely parse comma-separated equipment string to lowercase set."""
    if pd.isna(equipment_str) or not equipment_str:
        return set()
    if isinstance(equipment_str, set):
        return {str(x).strip().lower() for x in equipment_str}
    if isinstance(equipment_str, (list, tuple)):
        return {str(x).strip().lower() for x in equipment_str}
    return {item.strip().lower() for item in str(equipment_str).split(",") if item.strip()}


def validate_rooms_df(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and clean rooms dataframe."""
    missing = [col for col in REQUIRED_ROOM_COLUMNS if col not in df.columns]
    if missing:
        raise SchemaValidationError(f"Rooms data missing required columns: {missing}")
    
    df = df.copy()
    df["room_id"] = df["room_id"].astype(str).str.strip()
    df["room_name"] = df["room_name"].astype(str).str.strip()
    df["building"] = df["building"].astype(str).str.strip()
    df["capacity"] = pd.to_numeric(df["capacity"], errors="coerce")
    
    if df["capacity"].isna().any() or (df["capacity"] <= 0).any():
        raise SchemaValidationError("All room capacities must be positive integers.")
    df["capacity"] = df["capacity"].astype(int)

    if "room_type" not in df.columns:
        df["room_type"] = "Classroom"
    else:
        df["room_type"] = df["room_type"].fillna("Classroom").astype(str).str.strip()
        
    if "equipment" not in df.columns:
        df["equipment"] = ""
    df["equipment_set"] = df["equipment"].apply(parse_equipment)
    
    if df["room_id"].duplicated().any():
        dups = df[df["room_id"].duplicated()]["room_id"].tolist()
        raise SchemaValidationError(f"Duplicate room IDs found: {dups}")
        
    return df


def validate_faculty_df(df: pd.DataFrame) -> pd.DataFrame:
    """Validate and clean faculty dataframe."""
    missing = [col for col in REQUIRED_FACULTY_COLUMNS if col not in df.columns]
    if missing:
        raise SchemaValidationError(f"Faculty data missing required columns: {missing}")
        
    df = df.copy()
    df["faculty_id"] = df["faculty_id"].astype(str).str.strip()
    df["faculty_name"] = df["faculty_name"].astype(str).str.strip()
    df["department"] = df["department"].astype(str).str.strip()
    
    if "home_building" not in df.columns:
        df["home_building"] = "Main Building"
    else:
        df["home_building"] = df["home_building"].fillna("Main Building").astype(str).str.strip()
        
    if df["faculty_id"].duplicated().any():
        dups = df[df["faculty_id"].duplicated()]["faculty_id"].tolist()
        raise SchemaValidationError(f"Duplicate faculty IDs found: {dups}")
        
    return df


def validate_timetable_df(df: pd.DataFrame, rooms_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """Validate and clean timetable dataframe."""
    missing = [col for col in REQUIRED_TIMETABLE_COLUMNS if col not in df.columns]
    if missing:
        raise SchemaValidationError(f"Timetable data missing required columns: {missing}")
        
    df = df.copy()
    df["event_id"] = df["event_id"].astype(str).str.strip()
    df["course_code"] = df["course_code"].astype(str).str.strip()
    df["course_name"] = df["course_name"].astype(str).str.strip()
    df["faculty_id"] = df["faculty_id"].astype(str).str.strip()
    df["day"] = df["day"].astype(str).str.strip()
    df["slot"] = df["slot"].astype(str).str.strip()
    df["room_id"] = df["room_id"].astype(str).str.strip()
    
    if "section" not in df.columns:
        df["section"] = "Sec A"
    else:
        df["section"] = df["section"].fillna("Sec A").astype(str).str.strip()
        
    df["enrolled_students"] = pd.to_numeric(df["enrolled_students"], errors="coerce")
    if df["enrolled_students"].isna().any() or (df["enrolled_students"] <= 0).any():
        raise SchemaValidationError("Enrolled students count must be positive integers.")
    df["enrolled_students"] = df["enrolled_students"].astype(int)

    if "required_equipment" not in df.columns:
        df["required_equipment"] = ""
    df["required_equipment_set"] = df["required_equipment"].apply(parse_equipment)

    # Check for valid days
    invalid_days = set(df["day"]) - set(VALID_DAYS)
    if invalid_days:
        raise SchemaValidationError(f"Invalid days in timetable: {invalid_days}. Expected one of: {VALID_DAYS}")

    if rooms_df is not None:
        known_rooms = set(rooms_df["room_id"])
        unknown_rooms = set(df["room_id"]) - known_rooms
        if unknown_rooms:
            raise SchemaValidationError(f"Timetable references unknown room IDs: {unknown_rooms}")

    return df


def load_building_distances(filepath: Optional[str] = None) -> Dict[Tuple[str, str], int]:
    """Load building distance mapping in meters."""
    default_dist = {
        ("Science Block", "Science Block"): 0,
        ("Science Block", "Tech Complex"): 120,
        ("Science Block", "Arts Block"): 750,
        ("Tech Complex", "Science Block"): 120,
        ("Tech Complex", "Tech Complex"): 0,
        ("Tech Complex", "Arts Block"): 680,
        ("Arts Block", "Science Block"): 750,
        ("Arts Block", "Tech Complex"): 680,
        ("Arts Block", "Arts Block"): 0,
    }
    if filepath and os.path.exists(filepath):
        try:
            df = pd.read_csv(filepath)
            matrix = {}
            for _, row in df.iterrows():
                b1 = str(row["building_from"]).strip()
                b2 = str(row["building_to"]).strip()
                dist = int(row["distance_meters"])
                matrix[(b1, b2)] = dist
            return matrix
        except Exception:
            return default_dist
    return default_dist


def load_from_sqlite(db_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load rooms, faculty, and timetable from SQLite database."""
    conn = sqlite3.connect(db_path)
    try:
        rooms_df = pd.read_sql_query("SELECT * FROM rooms", conn)
        faculty_df = pd.read_sql_query("SELECT * FROM faculty", conn)
        timetable_df = pd.read_sql_query("SELECT * FROM timetable", conn)
        
        rooms_df = validate_rooms_df(rooms_df)
        faculty_df = validate_faculty_df(faculty_df)
        timetable_df = validate_timetable_df(timetable_df, rooms_df)
        return rooms_df, faculty_df, timetable_df
    finally:
        conn.close()


def load_default_datasets(data_dir: Optional[str] = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[Tuple[str, str], int]]:
    """Load standard sample datasets."""
    if data_dir is None:
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        
    rooms_path = os.path.join(data_dir, "sample_rooms.csv")
    faculty_path = os.path.join(data_dir, "sample_faculty.csv")
    timetable_path = os.path.join(data_dir, "sample_timetable.csv")
    distances_path = os.path.join(data_dir, "building_distances.csv")
    
    if not (os.path.exists(rooms_path) and os.path.exists(faculty_path) and os.path.exists(timetable_path)):
        # Generate synthetic data if missing
        from generate_synthetic_data import generate_datasets
        generate_datasets()
        
    rooms_df = validate_rooms_df(pd.read_csv(rooms_path))
    faculty_df = validate_faculty_df(pd.read_csv(faculty_path))
    timetable_df = validate_timetable_df(pd.read_csv(timetable_path), rooms_df)
    distances = load_building_distances(distances_path)
    
    return rooms_df, faculty_df, timetable_df, distances
