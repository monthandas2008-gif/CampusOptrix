import React, { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import axios from 'axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function NewEventScheduler({ facultyList, roomsList }) {
  const [courseCode, setCourseCode] = useState('CS-505');
  const [courseName, setCourseName] = useState('Applied Cryptography Workshop');
  const [enrolledStudents, setEnrolledStudents] = useState(38);
  const [facultyId, setFacultyId] = useState(facultyList[0]?.faculty_id || 'FAC-01');
  const [selectedEquipment, setSelectedEquipment] = useState(['projector', 'computers']);
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Collect all available equipment from rooms
  const allEquipment = Array.from(new Set(roomsList.flatMap((r) => r.equipment_list || []))).sort();

  async function handleFindSlots(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/new-event', {
        course_code: courseCode,
        course_name: courseName,
        enrolled_students: parseInt(enrolledStudents, 10),
        required_equipment: selectedEquipment,
        faculty_id: facultyId,
        preferred_days: selectedDays
      });
      setResults(response.data.valid_slots || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleEquipment(eq) {
    if (selectedEquipment.includes(eq)) {
      setSelectedEquipment(selectedEquipment.filter((x) => x !== eq));
    } else {
      setSelectedEquipment([...selectedEquipment, eq]);
    }
  }

  function toggleDay(d) {
    if (selectedDays.includes(d)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((x) => x !== d));
      }
    } else {
      setSelectedDays([...selectedDays, d]);
    }
  }

  return (
    <div style={{
      border: '2px solid var(--ink)',
      background: '#FFF',
      padding: '18px 22px',
      marginBottom: '25px'
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '16px',
        fontWeight: 800,
        color: 'var(--ink)',
        textTransform: 'uppercase',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <PlusCircle size={18} color="var(--blueprint)" />
        FIND A FREE ROOM FOR A NEW CLASS OR EVENT
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '16px' }}>
        Need to schedule a new class, guest seminar, or makeup lab? Enter the class details below to immediately find available rooms with zero scheduling clashes.
      </div>

      <form onSubmit={handleFindSlots}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '14px'
        }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Class Code:
            </label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Class / Event Title:
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Number of Students:
            </label>
            <input
              type="number"
              min="5"
              max="250"
              value={enrolledStudents}
              onChange={(e) => setEnrolledStudents(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              required
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
              Teacher / Instructor:
            </label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            >
              {facultyList.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.faculty_name} ({f.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferred Days */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Preferred Days:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DAYS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => toggleDay(d)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  border: '1px solid var(--ink)',
                  background: selectedDays.includes(d) ? 'var(--blueprint)' : '#FAF8F2',
                  color: selectedDays.includes(d) ? '#FFF' : 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Required Equipment Checkboxes */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
            Required Room Tools & Lab Hardware:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {allEquipment.map((eq) => (
              <button
                type="button"
                key={eq}
                onClick={() => toggleEquipment(eq)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  border: '1px solid var(--ink)',
                  background: selectedEquipment.includes(eq) ? 'var(--signal-green)' : '#FAF8F2',
                  color: selectedEquipment.includes(eq) ? '#FFF' : 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                {selectedEquipment.includes(eq) ? '✓ ' : '+ '}{eq}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--blueprint)',
            color: '#FFF',
            border: '2px solid var(--ink)',
            padding: '8px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Search size={14} />
          {loading ? 'Checking room schedules...' : '🔍 Find Available Rooms'}
        </button>
      </form>

      {/* Results Table */}
      {results && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--signal-green)',
            marginBottom: '8px'
          }}>
            ✓ Found {results.length} suitable rooms with zero schedule conflicts:
          </div>

          <div style={{ overflowX: 'auto', border: '1.5px solid var(--ink)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--blueprint)', color: '#FFF' }}>
                  <th style={{ padding: '6px 8px', border: '1px solid var(--ink)', textAlign: 'left' }}>OPTION</th>
                  <th style={{ padding: '6px 8px', border: '1px solid var(--ink)', textAlign: 'left' }}>DAY & TIME</th>
                  <th style={{ padding: '6px 8px', border: '1px solid var(--ink)', textAlign: 'left' }}>SUGGESTED ROOM</th>
                  <th style={{ padding: '6px 8px', border: '1px solid var(--ink)', textAlign: 'left' }}>ROOM SEATING</th>
                  <th style={{ padding: '6px 8px', border: '1px solid var(--ink)', textAlign: 'left' }}>EQUIPMENT STATUS</th>
                  <th style={{ padding: '6px 8px', border: '1px solid var(--ink)', textAlign: 'left' }}>TEACHER TRANSIT</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 8).map((vs, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#FFF' : '#FAF8F2' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid var(--paper-border)', fontWeight: 700 }}>#{vs.recommendation_rank}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid var(--paper-border)' }}>{vs.day} • {vs.slot}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid var(--paper-border)', fontWeight: 600 }}>{vs.room_name} ({vs.building})</td>
                    <td style={{ padding: '6px 8px', border: '1px solid var(--paper-border)' }}>Fits {vs.enrolled} in {vs.capacity} seats ({vs.utilization_pct}% usage)</td>
                    <td style={{ padding: '6px 8px', border: '1px solid var(--paper-border)', color: 'var(--signal-green)', fontWeight: 700 }}>✓ 100% Match</td>
                    <td style={{ padding: '6px 8px', border: '1px solid var(--paper-border)' }}>{vs.distance_from_faculty_home}m from home building</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
