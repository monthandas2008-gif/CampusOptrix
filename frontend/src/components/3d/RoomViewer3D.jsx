import React, { useState } from 'react';
import {
  RotateCcw,
  Layers,
  Users,
  Wrench,
  Building,
  LayoutGrid,
  ChevronLeft
} from 'lucide-react';
import RoomCanvas from './RoomCanvas';
import RoomInfoPanel3D from './RoomInfoPanel3D';

const VIEW_MODES = [
  { id: 'OCCUPANCY', label: 'Occupancy', icon: Layers, desc: 'Color by seat fill' },
  { id: 'CAPACITY', label: 'Capacity', icon: Users, desc: 'Remaining seats highlight' },
  { id: 'EQUIPMENT', label: 'Equipment', icon: Wrench, desc: 'Hardware & tools status' }
];

export default function RoomViewer3D({
  room,
  rooms = [],
  timetable = [],
  activeDay = 'Monday',
  onSelectRoom,
  onBackTo2D,
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-white)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)',
      height: 'calc(100vh - 140px)',
      minHeight: '620px'
    }}>
      {/* 3D Top Control Bar */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-white)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 10
      }}>
        {/* Left: Back to 2D Plan & Room Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackTo2D}
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '11.5px' }}
          >
            <ChevronLeft size={14} />
            <span>2D Floor Plan</span>
          </button>

          <div style={{ height: '16px', width: '1px', background: 'var(--border-color)' }} />

          {/* Quick Room Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} color="var(--primary-blue)" />
            <select
              value={room.room_id}
              onChange={(e) => {
                const target = rooms.find((r) => r.room_id === e.target.value);
                if (target) onSelectRoom(target);
              }}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
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

        {/* Right: 3D View Modes (Occupancy | Capacity | Equipment) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            3D Mode:
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
                    border: '1px solid var(--border-color)',
                    background: isActive ? 'var(--primary-blue)' : 'var(--surface-muted)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <Icon size={12} color={isActive ? '#FFFFFF' : 'var(--text-secondary)'} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 3D Viewport & Right Info Panel */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* 3D Canvas Area */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <RoomCanvas
            room={room}
            studentsCurrent={currentStudents}
            viewMode={viewMode}
          />

          {/* 3D Orbit Tip Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(23, 32, 51, 0.75)',
            backdropFilter: 'blur(3px)',
            color: '#FFFFFF',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '10.5px',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none'
          }}>
            🖱️ Left Click + Drag to Orbit • Scroll to Zoom
          </div>
        </div>

        {/* Right Info Panel */}
        <RoomInfoPanel3D
          room={room}
          timetable={timetable}
          activeDay={activeDay}
          onOpenRecommendation={onOpenRecommendation}
          onOpenWhatIf={onOpenWhatIf}
        />
      </div>
    </div>
  );
}
