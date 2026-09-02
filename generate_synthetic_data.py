"""
Synthetic Data Generator for CampusOptix.
Creates realistic university campus datasets with deliberate bottleneck scenarios:
- Overcapacity in small lecture rooms/labs
- Underutilized large auditoriums in morning/afternoon slots
- Equipment mismatch (e.g. ML lab scheduled in basic room without GPU cluster/computers)
- Faculty cross-building back-to-back travel conflicts
"""

import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def generate_datasets():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 1. Rooms Dataset
    rooms_data = [
        {"room_id": "LH-101", "room_name": "Lecture Hall 101", "building": "Science Block", "capacity": 60, "room_type": "Lecture Hall", "equipment": "projector,whiteboard,audio_system"},
        {"room_id": "LH-102", "room_name": "Lecture Hall 102", "building": "Science Block", "capacity": 40, "room_type": "Lecture Hall", "equipment": "projector,whiteboard"},
        {"room_id": "LH-201", "room_name": "Lecture Hall 201", "building": "Tech Complex", "capacity": 75, "room_type": "Lecture Hall", "equipment": "smart_board,projector,audio_system"},
        {"room_id": "LH-202", "room_name": "Lecture Hall 202", "building": "Tech Complex", "capacity": 35, "room_type": "Lecture Hall", "equipment": "projector,whiteboard"},
        {"room_id": "LAB-A", "room_name": "Computing Lab Alpha", "building": "Tech Complex", "capacity": 45, "room_type": "Computer Lab", "equipment": "projector,computers,gpu_cluster,whiteboard"},
        {"room_id": "LAB-B", "room_name": "Computing Lab Beta", "building": "Tech Complex", "capacity": 30, "room_type": "Computer Lab", "equipment": "projector,computers,whiteboard"},
        {"room_id": "LAB-HW", "room_name": "Hardware & IoT Lab", "building": "Science Block", "capacity": 35, "room_type": "Electronics Lab", "equipment": "projector,oscilloscopes,iot_kits,whiteboard"},
        {"room_id": "SEM-01", "room_name": "Seminar Hall North", "building": "Arts Block", "capacity": 120, "room_type": "Seminar Hall", "equipment": "smart_board,projector,audio_system,recording_gear"},
        {"room_id": "SEM-02", "room_name": "Auditorium West", "building": "Arts Block", "capacity": 150, "room_type": "Seminar Hall", "equipment": "smart_board,projector,audio_system,recording_gear"},
        {"room_id": "CR-301", "room_name": "Classroom 301", "building": "Arts Block", "capacity": 30, "room_type": "Classroom", "equipment": "whiteboard"}
    ]
    rooms_df = pd.DataFrame(rooms_data)
    rooms_df.to_csv(os.path.join(DATA_DIR, "sample_rooms.csv"), index=False)

    # 2. Faculty Dataset
    faculty_data = [
        {"faculty_id": "FAC-01", "faculty_name": "Dr. Alan Turing", "department": "Computer Science", "home_building": "Tech Complex"},
        {"faculty_id": "FAC-02", "faculty_name": "Dr. Grace Hopper", "department": "Computer Science", "home_building": "Tech Complex"},
        {"faculty_id": "FAC-03", "faculty_name": "Dr. Claude Shannon", "department": "Information Theory", "home_building": "Science Block"},
        {"faculty_id": "FAC-04", "faculty_name": "Dr. Ada Lovelace", "department": "Mathematics", "home_building": "Science Block"},
        {"faculty_id": "FAC-05", "faculty_name": "Dr. John von Neumann", "department": "Physics", "home_building": "Science Block"},
        {"faculty_id": "FAC-06", "faculty_name": "Dr. Margaret Hamilton", "department": "Software Eng", "home_building": "Tech Complex"},
        {"faculty_id": "FAC-07", "faculty_name": "Prof. Richard Feynman", "department": "Physics", "home_building": "Arts Block"}
    ]
    faculty_df = pd.DataFrame(faculty_data)
    faculty_df.to_csv(os.path.join(DATA_DIR, "sample_faculty.csv"), index=False)

    # 3. Timetable Dataset (with realistic baseline anomalies)
    events_data = [
        # Monday
        {"event_id": "EV-101", "course_code": "CS-301", "course_name": "Algorithms & Optimization", "section": "Sec A", "faculty_id": "FAC-01", "enrolled_students": 55, "day": "Monday", "slot": "09:00-10:00", "room_id": "LH-102", "required_equipment": "projector,whiteboard"}, # Overcapacity in LH-102 (55 > 40)
        {"event_id": "EV-102", "course_code": "CS-402", "course_name": "Deep Learning Studio", "section": "Sec A", "faculty_id": "FAC-02", "enrolled_students": 42, "day": "Monday", "slot": "09:00-10:00", "room_id": "LAB-B", "required_equipment": "projector,computers,gpu_cluster"}, # Overcapacity in LAB-B (42 > 30) AND missing gpu_cluster!
        {"event_id": "EV-103", "course_code": "MATH-201", "course_name": "Linear Algebra", "section": "Sec B", "faculty_id": "FAC-04", "enrolled_students": 25, "day": "Monday", "slot": "09:00-10:00", "room_id": "SEM-02", "required_equipment": "projector"}, # Severely underutilized SEM-02 (25 / 150 = 16.7%)
        {"event_id": "EV-104", "course_code": "CS-301", "course_name": "Algorithms & Optimization", "section": "Sec B", "faculty_id": "FAC-01", "enrolled_students": 38, "day": "Monday", "slot": "10:00-11:00", "room_id": "CR-301", "required_equipment": "projector,whiteboard"}, # Overcapacity (38 > 30) and missing projector! Also FAC-01 back-to-back travel from Science Block to Arts Block (750m)
        {"event_id": "EV-105", "course_code": "SE-401", "course_name": "Cloud Systems & Reliability", "section": "Sec A", "faculty_id": "FAC-06", "enrolled_students": 32, "day": "Monday", "slot": "11:00-12:00", "room_id": "LH-101", "required_equipment": "projector"},
        {"event_id": "EV-106", "course_code": "PHYS-101", "course_name": "Quantum Mechanics Intro", "section": "Sec A", "faculty_id": "FAC-05", "enrolled_students": 68, "day": "Monday", "slot": "11:00-12:00", "room_id": "LH-201", "required_equipment": "smart_board,projector"},
        {"event_id": "EV-107", "course_code": "CS-205", "course_name": "Database Systems Lab", "section": "Sec A", "faculty_id": "FAC-02", "enrolled_students": 28, "day": "Monday", "slot": "14:00-15:00", "room_id": "LAB-B", "required_equipment": "computers,projector"},
        {"event_id": "EV-108", "course_code": "CS-205", "course_name": "Database Systems Lab", "section": "Sec A", "faculty_id": "FAC-02", "enrolled_students": 28, "day": "Monday", "slot": "15:00-16:00", "room_id": "LAB-B", "required_equipment": "computers,projector"},
        {"event_id": "EV-109", "course_code": "PHYS-102", "course_name": "Electromagnetism Seminar", "section": "Sec A", "faculty_id": "FAC-07", "enrolled_students": 110, "day": "Monday", "slot": "14:00-15:00", "room_id": "SEM-01", "required_equipment": "audio_system,projector"},
        
        # Tuesday
        {"event_id": "EV-201", "course_code": "EE-304", "course_name": "Embedded Systems & IoT", "section": "Sec A", "faculty_id": "FAC-03", "enrolled_students": 32, "day": "Tuesday", "slot": "09:00-10:00", "room_id": "LAB-HW", "required_equipment": "oscilloscopes,iot_kits"},
        {"event_id": "EV-202", "course_code": "EE-304", "course_name": "Embedded Systems & IoT", "section": "Sec A", "faculty_id": "FAC-03", "enrolled_students": 32, "day": "Tuesday", "slot": "10:00-11:00", "room_id": "LAB-HW", "required_equipment": "oscilloscopes,iot_kits"},
        {"event_id": "EV-203", "course_code": "CS-101", "course_name": "Intro to Computation", "section": "Sec A", "faculty_id": "FAC-06", "enrolled_students": 72, "day": "Tuesday", "slot": "10:00-11:00", "room_id": "LH-101", "required_equipment": "projector,audio_system"}, # Overcapacity (72 > 60)
        {"event_id": "EV-204", "course_code": "MATH-302", "course_name": "Discrete Mathematics", "section": "Sec A", "faculty_id": "FAC-04", "enrolled_students": 22, "day": "Tuesday", "slot": "11:00-12:00", "room_id": "SEM-01", "required_equipment": "smart_board"}, # Underutilized (22/120 = 18.3%)
        {"event_id": "EV-205", "course_code": "CS-405", "course_name": "AI & Heuristic Search", "section": "Sec A", "faculty_id": "FAC-01", "enrolled_students": 38, "day": "Tuesday", "slot": "14:00-15:00", "room_id": "LH-202", "required_equipment": "projector"}, # Overcapacity (38 > 35)
        {"event_id": "EV-206", "course_code": "CS-405", "course_name": "AI & Heuristic Search", "section": "Sec A", "faculty_id": "FAC-01", "enrolled_students": 38, "day": "Tuesday", "slot": "15:00-16:00", "room_id": "LH-202", "required_equipment": "projector"},

        # Wednesday
        {"event_id": "EV-301", "course_code": "CS-301", "course_name": "Algorithms & Optimization", "section": "Sec A", "faculty_id": "FAC-01", "enrolled_students": 55, "day": "Wednesday", "slot": "09:00-10:00", "room_id": "LH-102", "required_equipment": "projector,whiteboard"}, # Overcapacity in LH-102
        {"event_id": "EV-302", "course_code": "CS-402", "course_name": "Deep Learning Studio", "section": "Sec A", "faculty_id": "FAC-02", "enrolled_students": 42, "day": "Wednesday", "slot": "09:00-10:00", "room_id": "LAB-B", "required_equipment": "projector,computers,gpu_cluster"},
        {"event_id": "EV-303", "course_code": "PHYS-101", "course_name": "Quantum Mechanics Intro", "section": "Sec A", "faculty_id": "FAC-05", "enrolled_students": 68, "day": "Wednesday", "slot": "11:00-12:00", "room_id": "LH-201", "required_equipment": "smart_board,projector"},
        {"event_id": "EV-304", "course_code": "SE-401", "course_name": "Cloud Systems & Reliability", "section": "Sec A", "faculty_id": "FAC-06", "enrolled_students": 32, "day": "Wednesday", "slot": "14:00-15:00", "room_id": "CR-301", "required_equipment": "projector"}, # Missing projector
        {"event_id": "EV-305", "course_code": "INFO-201", "course_name": "Information & Coding Theory", "section": "Sec A", "faculty_id": "FAC-03", "enrolled_students": 58, "day": "Wednesday", "slot": "15:00-16:00", "room_id": "LH-101", "required_equipment": "projector,audio_system"},

        # Thursday
        {"event_id": "EV-401", "course_code": "CS-101", "course_name": "Intro to Computation", "section": "Sec A", "faculty_id": "FAC-06", "enrolled_students": 72, "day": "Thursday", "slot": "10:00-11:00", "room_id": "LH-101", "required_equipment": "projector,audio_system"}, # Overcapacity
        {"event_id": "EV-402", "course_code": "EE-304", "course_name": "Embedded Systems & IoT", "section": "Sec A", "faculty_id": "FAC-03", "enrolled_students": 32, "day": "Thursday", "slot": "11:00-12:00", "room_id": "LAB-HW", "required_equipment": "oscilloscopes,iot_kits"},
        {"event_id": "EV-403", "course_code": "MATH-201", "course_name": "Linear Algebra", "section": "Sec B", "faculty_id": "FAC-04", "enrolled_students": 25, "day": "Thursday", "slot": "14:00-15:00", "room_id": "SEM-02", "required_equipment": "projector"},
        {"event_id": "EV-404", "course_code": "PHYS-102", "course_name": "Electromagnetism Seminar", "section": "Sec A", "faculty_id": "FAC-07", "enrolled_students": 110, "day": "Thursday", "slot": "15:00-16:00", "room_id": "SEM-01", "required_equipment": "audio_system,projector"},

        # Friday
        {"event_id": "EV-501", "course_code": "CS-301", "course_name": "Algorithms & Optimization", "section": "Sec B", "faculty_id": "FAC-01", "enrolled_students": 38, "day": "Friday", "slot": "09:00-10:00", "room_id": "LH-202", "required_equipment": "projector,whiteboard"},
        {"event_id": "EV-502", "course_code": "CS-205", "course_name": "Database Systems Lab", "section": "Sec B", "faculty_id": "FAC-02", "enrolled_students": 44, "day": "Friday", "slot": "10:00-11:00", "room_id": "LAB-B", "required_equipment": "computers,projector"}, # Overcapacity (44 > 30)
        {"event_id": "EV-503", "course_code": "CS-205", "course_name": "Database Systems Lab", "section": "Sec B", "faculty_id": "FAC-02", "enrolled_students": 44, "day": "Friday", "slot": "11:00-12:00", "room_id": "LAB-B", "required_equipment": "computers,projector"}, # Overcapacity
        {"event_id": "EV-504", "course_code": "MATH-302", "course_name": "Discrete Mathematics", "section": "Sec A", "faculty_id": "FAC-04", "enrolled_students": 22, "day": "Friday", "slot": "14:00-15:00", "room_id": "LH-101", "required_equipment": "smart_board"}
    ]
    timetable_df = pd.DataFrame(events_data)
    timetable_df.to_csv(os.path.join(DATA_DIR, "sample_timetable.csv"), index=False)

    # 4. Building Distance Matrix (meters)
    distances_data = [
        {"building_from": "Science Block", "building_to": "Science Block", "distance_meters": 0},
        {"building_from": "Science Block", "building_to": "Tech Complex", "distance_meters": 120},
        {"building_from": "Science Block", "building_to": "Arts Block", "distance_meters": 750},
        {"building_from": "Tech Complex", "building_to": "Science Block", "distance_meters": 120},
        {"building_from": "Tech Complex", "building_to": "Tech Complex", "distance_meters": 0},
        {"building_from": "Tech Complex", "building_to": "Arts Block", "distance_meters": 680},
        {"building_from": "Arts Block", "building_to": "Science Block", "distance_meters": 750},
        {"building_from": "Arts Block", "building_to": "Tech Complex", "distance_meters": 680},
        {"building_from": "Arts Block", "building_to": "Arts Block", "distance_meters": 0},
    ]
    distances_df = pd.DataFrame(distances_data)
    distances_df.to_csv(os.path.join(DATA_DIR, "building_distances.csv"), index=False)
    print("Synthetic datasets successfully created in data/")

if __name__ == "__main__":
    generate_datasets()
