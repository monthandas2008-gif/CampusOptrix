import React, { useState } from 'react';
import { CalendarPlus, Search, CheckCircle2, Building2, Users, Wrench, Compass } from 'lucide-react';
import axios from 'axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function ScheduleEventPage({
  facultyList = [],
  roomsList = [],
  onEventScheduled
}) {
  const [courseCode, setCourseCode] = useState('CS-505');
  const [courseName, setCourseName] = useState('Applied Cryptography Workshop');
  const [enrolledStudents, setEnrolledStudents] = useState(38);
  const [facultyId, setFacultyId] = useState(facultyList[0]?.faculty_id || 'FAC-01');
  const [selectedEquipment, setSelectedEquipment] = useState(['projector', 'computers']);
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Wednesday', 'Friday']);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Event Details Form */}
      <div className="card-clean" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '18px' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 800,
            color: 'var(--text-primary)'
          }}>
            Event & Class Parameters
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Enter class specifications to find available rooms with guaranteed zero scheduling clashes.
          </p>
        </div>

        <form onSubmit={handleFindSlots}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Course / Event Code:
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Event / Class Title:
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Student Strength (Seats Needed):
              </label>
              <input
                type="number"
                min="5"
                max="250"
                value={enrolledStudents}
                onChange={(e) => setEnrolledStudents(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Instructor / Faculty:
              </label>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  background: 'var(--surface)'
                }}
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Preferred Days:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggleDay(d)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '5px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedDays.includes(d) ? 'var(--primary-blue)' : 'var(--surface-muted)',
                    color: selectedDays.includes(d) ? '#FFF' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Required Equipment */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Required Room Equipment:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allEquipment.map((eq) => (
                <button
                  type="button"
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '5px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedEquipment.includes(eq) ? 'var(--status-green-bg)' : 'var(--surface-muted)',
                    color: selectedEquipment.includes(eq) ? 'var(--status-green)' : 'var(--text-secondary)',
                    borderColor: selectedEquipment.includes(eq) ? 'var(--status-green)' : 'var(--border-color)',
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
            className="btn-primary"
            style={{ padding: '9px 20px' }}
          >
            <Search size={14} />
            <span>{loading ? 'Finding Available Slots...' : 'Find Available Slots'}</span>
          </button>
        </form>
      </div>

      {/* Results Table */}
      {results && (
        <div className="card-clean" style={{ padding: '20px' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--status-green)',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={16} />
            <span>Found {results.length} Available Rooms with Zero Conflicts</span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Rank</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Day & Time</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Suggested Room</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Capacity & Usage</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Equipment Match</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Instructor Transit</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((slot, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      #{slot.recommendation_rank}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                      {slot.day} • <span className="mono-num">{slot.slot}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {slot.room_name} ({slot.building})
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {slot.enrolled} / {slot.capacity} seats ({slot.utilization_pct}% usage)
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--status-green)', fontWeight: 600 }}>
                      ✓ 100% Verified
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {slot.distance_from_faculty_home}m from department
                    </td>
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
