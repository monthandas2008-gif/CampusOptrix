import React from 'react';
import {
  Users,
  Wrench,
  Sparkles,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function RoomInfoPanel3D({
  room,
  timetable = [],
  activeDay = 'Monday',
  onOpenRecommendation,
  onOpenWhatIf
}) {
  if (!room) return null;

  // Filter events for this room on the active day
  const roomEvents = timetable.filter(
    (e) => e.room_id === room.room_id && e.day === activeDay
  );

  const totalEnrolled = roomEvents.reduce((sum, e) => sum + e.enrolled_students, 0);
  const currentClass = roomEvents[0] || null;
  const currentStudents = currentClass ? currentClass.enrolled_students : 0;
  const capacity = room.capacity || 40;

  const seatsAvailable = Math.max(0, capacity - currentStudents);
  const overCapacityBy = Math.max(0, currentStudents - capacity);
  const util = capacity > 0 ? (currentStudents / capacity) * 100 : 0;

  return (
    <div style={{
      width: '340px',
      minWidth: '340px',
      background: 'var(--surface-white)',
      borderLeft: '1px solid var(--border-color)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div>
        {/* Room Header */}
        <div style={{
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>
                {room.room_name}
              </h2>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--primary-blue)',
              fontWeight: 600,
              marginTop: '2px'
            }}>
              {room.room_id} // {room.building}
            </div>
          </div>

          <span className={overCapacityBy > 0 ? 'badge-conflict' : util <= 30 && currentStudents > 0 ? 'badge-attention' : 'badge-healthy'}>
            {overCapacityBy > 0 ? 'OVER CAPACITY' : currentStudents === 0 ? 'EMPTY NOW' : 'OCCUPIED'}
          </span>
        </div>

        {/* Current Class Context */}
        {currentClass ? (
          <div style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            margin: '14px 0'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Class ({activeDay} {currentClass.slot})
            </div>
            <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>
              {currentClass.course_code}: {currentClass.course_name}
            </strong>
          </div>
        ) : (
          <div style={{
            padding: '10px',
            textAlign: 'center',
            background: 'var(--surface-muted)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontSize: '11px',
            margin: '14px 0'
          }}>
            No active class in session on {activeDay}
          </div>
        )}

        {/* BOLD AVAILABLE CAPACITY BLOCK (Primary Visual Emphasis) */}
        {overCapacityBy > 0 ? (
          <div style={{
            background: 'var(--status-coral-bg)',
            border: '1.5px solid var(--status-coral)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '10.5px', color: 'var(--status-coral)', fontWeight: 700, textTransform: 'uppercase' }}>
              ⚠️ Space Safety Hazard
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--status-coral)',
              marginTop: '4px'
            }}>
              +{overCapacityBy} OVER CAPACITY
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {currentStudents} students in a {capacity}-seat room
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--status-green-bg)',
            border: '1.5px solid var(--status-green)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '10.5px', color: 'var(--status-green)', fontWeight: 700, textTransform: 'uppercase' }}>
              Seating Headroom
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--status-green)',
              marginTop: '4px'
            }}>
              {seatsAvailable} SEATS AVAILABLE
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {currentStudents} / {capacity} seats occupied ({util.toFixed(0)}%)
            </div>
          </div>
        )}

        {/* Compact Capacity Meter */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Occupancy Progress</span>
            <span className="mono-num" style={{ fontWeight: 700 }}>{util.toFixed(0)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--surface-hover)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, util)}%`,
              height: '100%',
              background: overCapacityBy > 0 ? 'var(--status-coral)' : util <= 30 ? 'var(--status-amber)' : 'var(--status-green)',
              borderRadius: '3px'
            }} />
          </div>
        </div>

        {/* Equipment Verification */}
        <div>
          <div style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Wrench size={13} color="var(--primary-blue)" /> Hardware & Tools Status
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {room.equipment_list?.length > 0 ? (
              room.equipment_list.map((eq) => (
                <span
                  key={eq}
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-color)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    color: 'var(--text-primary)'
                  }}
                >
                  ✓ {eq}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Standard Desk & Whiteboard</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={onOpenRecommendation}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Sparkles size={13} />
          <span>Find Better Room</span>
        </button>

        <button
          onClick={onOpenWhatIf}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Sliders size={13} />
          <span>Open in Simulator</span>
        </button>
      </div>
    </div>
  );
}
