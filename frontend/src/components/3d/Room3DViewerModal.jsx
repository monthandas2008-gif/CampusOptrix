import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Building,
  Layers,
  Users,
  Wrench,
  Sparkles,
  Maximize2
} from 'lucide-react';
import RoomCanvas from './RoomCanvas';
import RoomInfoPanel3D from './RoomInfoPanel3D';

const VIEW_MODES = [
  { id: 'OCCUPANCY', label: 'Occupancy', icon: Layers, desc: 'Color by seat fill' },
  { id: 'CAPACITY', label: 'Capacity', icon: Users, desc: 'Remaining seats highlight' },
  { id: 'EQUIPMENT', label: 'Equipment', icon: Wrench, desc: 'Hardware & tools status' }
];

export default function Room3DViewerModal({
  room,
  rooms = [],
  timetable = [],
  activeDay = 'Monday',
  userRole = 'admin',
  onClose,
  onSelectRoom,
  onOpenRecommendation,
  onOpenWhatIf
}) {
  const [viewMode, setViewMode] = useState('OCCUPANCY');

  if (!room) return null;

  // Find active student count for this room on active day
  const roomEvents = timetable.filter(
    (e) => e.room_id === room.room_id && e.day === activeDay
  );
  const currentClass = roomEvents[0] || null;
  const currentStudents = currentClass ? currentClass.enrolled_students : 0;
  const capacity = room.capacity || 40;
  const isOvercap = currentStudents > capacity;

  // Back button text based on user role
  let backButtonLabel = 'Back to Campus Map';
  if (userRole === 'student') {
    backButtonLabel = 'Back to My Classes';
  } else if (userRole === 'faculty') {
    backButtonLabel = 'Back to My Schedule';
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        height: '92vh',
        background: 'var(--surface-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Navigation Header */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-white)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 10
        }}>
          {/* Left: Role-Aware Back Button & Room Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ChevronLeft size={16} />
              <span>{backButtonLabel}</span>
            </button>

            <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }} />

            {/* Quick Room Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} color="var(--primary-blue)" />
              <select
                value={room.room_id}
                onChange={(e) => {
                  const target = rooms.find((r) => r.room_id === e.target.value);
                  if (target && onSelectRoom) onSelectRoom(target);
                }}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {rooms.map((r) => (
                  <option key={r.room_id} value={r.room_id}>
                    {r.room_name} ({r.building} • {r.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: 3D View Modes & Close Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                3D Layer:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {VIEW_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = viewMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isActive ? 'var(--primary-blue)' : 'var(--border-color)',
                        background: isActive ? 'var(--primary-blue-light)' : 'var(--surface-muted)',
                        color: isActive ? 'var(--primary-blue)' : 'var(--text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={13} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'var(--surface-muted)',
                color: 'var(--text-secondary)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--status-coral-bg)';
                e.currentTarget.style.color = 'var(--status-coral)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-muted)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 3D Main Viewport & Side Information Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* 3D Canvas Center */}
          <div style={{
            flex: 1,
            position: 'relative',
            background: 'radial-gradient(circle at center, #F8FAFC 0%, #E2E8F0 100%)'
          }}>
            <RoomCanvas
              room={room}
              studentsCurrent={currentStudents}
              viewMode={viewMode}
            />

            {/* Overcapacity Warning Banner */}
            {isOvercap && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '20px',
                background: 'var(--status-coral)',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 10
              }}>
                <span className="pulse-dot" style={{ background: '#FFF' }} />
                <span>OVER CAPACITY: +{currentStudents - capacity} STUDENTS EXCEED SAFETY LIMIT</span>
              </div>
            )}

            {/* Orbit Instructions Footer Helper */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '20px',
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(4px)',
              border: '1px solid var(--border-color)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              boxShadow: 'var(--shadow-sm)',
              pointerEvents: 'none'
            }}>
              Left-click + drag to rotate • Right-click to pan • Scroll to zoom
            </div>
          </div>

          {/* Right Information Panel */}
          <RoomInfoPanel3D
            room={room}
            timetable={timetable}
            activeDay={activeDay}
            onOpenRecommendation={userRole === 'admin' ? onOpenRecommendation : undefined}
            onOpenWhatIf={userRole === 'admin' ? onOpenWhatIf : undefined}
          />
        </div>
      </div>
    </div>
  );
}
