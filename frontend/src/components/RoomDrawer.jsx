import React from 'react';
import {
  X,
  Users,
  Wrench,
  Sparkles,
  Sliders,
  Calendar,
  Box,
  BotMessageSquare
} from 'lucide-react';

export default function RoomDrawer({
  room,
  timetable = [],
  activeDay = 'Monday',
  onClose,
  onOptimizeRoom,
  onTestInWhatIf,
  onOpen3DViewer,
  onAskAssistant,
  onFindBetterRoom
}) {
  if (!room) return null;

  // Filter scheduled events for this room on activeDay
  const dayEvents = timetable.filter(
    (e) => e.room_id === room.room_id && e.day === activeDay
  );

  // Compute average occupancy for this room on activeDay
  const totalEnrolled = dayEvents.reduce((sum, e) => sum + (e.enrolled_students || 0), 0);
  const maxPossible = room.capacity * Math.max(dayEvents.length, 1);
  const avgOccupancyPct = dayEvents.length > 0 ? Math.round((totalEnrolled / maxPossible) * 100) : 0;

  // Determine status color badge
  let statusBadge = (
    <span className="badge-available">
      ● Available
    </span>
  );

  if (dayEvents.some((e) => e.enrolled_students > room.capacity)) {
    statusBadge = (
      <span className="badge-critical">
        ▲ Capacity Hazard
      </span>
    );
  } else if (avgOccupancyPct > 85) {
    statusBadge = (
      <span className="badge-optimal">
        ● High Utilization ({avgOccupancyPct}%)
      </span>
    );
  } else if (avgOccupancyPct < 40 && dayEvents.length > 0) {
    statusBadge = (
      <span className="badge-low">
        ○ Underutilized ({avgOccupancyPct}%)
      </span>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '420px',
        maxWidth: '90vw',
        height: '100vh',
        background: 'var(--surface-white)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-modal)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Drawer Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--primary-blue)',
            fontWeight: 600
          }}>
            {room.room_id}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '18px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginTop: '2px'
          }}>
            {room.room_name}
          </h2>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '2px'
          }}>
            {room.building} • {room.room_type || 'Classroom'}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Body */}
      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        {/* 3D Launch Banner */}
        {onOpen3DViewer && (
          <button
            onClick={() => {
              onOpen3DViewer(room);
              onClose();
            }}
            style={{
              width: '100%',
              background: 'var(--primary-blue-light)',
              border: '1.5px solid var(--primary-blue)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'var(--primary-blue)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={16} />
              <span>Launch 3D Room Viewer</span>
            </div>
            <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>Instant Occupancy ➔</span>
          </button>
        )}

        {/* Ask Assistant About This Room Banner */}
        {onAskAssistant && (
          <button
            onClick={() => {
              onAskAssistant(room);
              onClose();
            }}
            style={{
              width: '100%',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: '11.5px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-blue)' }}>
              <BotMessageSquare size={15} />
              <span>Ask Assistant About This Room</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Get instant analysis ➔</span>
          </button>
        )}

        {/* Status & Capacity Card */}
        <div className="card-surface" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Current Status ({activeDay})
            </span>
            {statusBadge}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Room Capacity</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {room.capacity} seats
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Active Classes</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {dayEvents.length} slots
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Daily Occupancy</span>
              <span className="mono-num" style={{ fontWeight: 600 }}>{avgOccupancyPct}%</span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(avgOccupancyPct, 100)}%`,
                  background: avgOccupancyPct > 100 ? 'var(--status-coral)' : avgOccupancyPct < 40 ? 'var(--status-amber)' : 'var(--primary-blue)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Installed Equipment Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Wrench size={13} color="var(--primary-blue)" />
            <span>Installed Equipment</span>
          </div>

          {room.equipment_list && room.equipment_list.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {room.equipment_list.map((eq) => (
                <span
                  key={eq}
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-color)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11.5px',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span style={{ color: 'var(--status-green)' }}>✓</span>
                  <span>{eq}</span>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Standard classroom tools (Whiteboard, Projector)
            </div>
          )}
        </div>

        {/* Scheduled Classes for Active Day */}
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Calendar size={13} color="var(--primary-blue)" />
            <span>Scheduled Classes ({activeDay})</span>
          </div>

          {dayEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dayEvents.map((ev) => (
                <div
                  key={ev.event_id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-muted)',
                    border: `1px solid ${ev.enrolled_students > room.capacity ? 'var(--status-coral)' : 'var(--border-color)'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ev.course_code}: {ev.course_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {ev.slot} • Faculty: {ev.faculty_id}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="mono-num" style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: ev.enrolled_students > room.capacity ? 'var(--status-coral)' : 'var(--text-primary)'
                    }}>
                      {ev.enrolled_students} / {room.capacity}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      enrolled
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '12px'
            }}>
              No classes scheduled in this room on {activeDay}.
            </div>
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--surface-muted)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => {
            onTestInWhatIf(room);
            onClose();
          }}
          className="btn-secondary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Sliders size={14} />
          <span>Open in Simulator</span>
        </button>

        <button
          onClick={() => {
            if (onFindBetterRoom) {
              onFindBetterRoom(room, dayEvents[0] || null);
            } else if (onOptimizeRoom) {
              onOptimizeRoom();
            }
            onClose();
          }}
          className="btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Sparkles size={14} />
          <span>Find Better Room</span>
        </button>
      </div>
    </div>
  );
}
