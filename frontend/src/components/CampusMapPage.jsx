import React, { useState } from 'react';
import {
  Building,
  Users,
  Wrench,
  Sparkles,
  Sliders,
  Eye,
  AlertTriangle,
  Layers,
  Cpu,
  Box,
  LayoutGrid
} from 'lucide-react';
import RoomViewer3D from './3d/RoomViewer3D';

const VIEW_MODES = [
  { id: 'OPERATIONS', label: 'Operations', icon: Eye, desc: 'Balanced campus floor plan' },
  { id: 'UTILIZATION', label: 'Utilization', icon: Layers, desc: 'Seat occupancy % fills' },
  { id: 'CAPACITY', label: 'Capacity', icon: Users, desc: 'Room size & headroom' },
  { id: 'CONFLICTS', label: 'Conflicts', icon: AlertTriangle, desc: 'Overcapacity & issues' },
  { id: 'EQUIPMENT', label: 'Equipment', icon: Cpu, desc: 'Specialized lab hardware' }
];

export default function CampusMapPage({
  rooms = [],
  timetable = [],
  activeDay = 'Monday',
  onSelectRoom,
  selectedRoom,
  onNavigate
}) {
  const [mapPresentationMode, setMapPresentationMode] = useState('2D'); // '2D' | '3D'
  const [viewMode, setViewMode] = useState('OPERATIONS');
  const [activeBuildingFilter, setActiveBuildingFilter] = useState('ALL');

  const buildings = ['ALL', ...new Set(rooms.map((r) => r.building))];
  const filteredRooms = activeBuildingFilter === 'ALL'
    ? rooms
    : rooms.filter((r) => r.building === activeBuildingFilter);

  // Group rooms by building
  const roomsByBuilding = {};
  for (const r of filteredRooms) {
    if (!roomsByBuilding[r.building]) roomsByBuilding[r.building] = [];
    roomsByBuilding[r.building].push(r);
  }

  // Filter timetable for active day
  const dayEvents = timetable.filter((e) => e.day === activeDay);

  // If in 3D mode, ensure a room is selected
  const active3DRoom = selectedRoom || rooms[0] || null;

  if (mapPresentationMode === '3D' && active3DRoom) {
    return (
      <RoomViewer3D
        room={active3DRoom}
        rooms={rooms}
        timetable={timetable}
        activeDay={activeDay}
        onSelectRoom={(r) => onSelectRoom(r)}
        onBackTo2D={() => setMapPresentationMode('2D')}
        onOpenRecommendation={() => onNavigate('recommendations')}
        onOpenWhatIf={() => onNavigate('whatif')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* View Modes & 2D / 3D Switcher Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* 2D Plan / 3D Viewer Presentation Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px'
          }}>
            <button
              onClick={() => setMapPresentationMode('2D')}
              style={{
                border: 'none',
                background: mapPresentationMode === '2D' ? 'var(--surface-white)' : 'transparent',
                color: mapPresentationMode === '2D' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: mapPresentationMode === '2D' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: mapPresentationMode === '2D' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <LayoutGrid size={13} />
              <span>2D Floor Plan</span>
            </button>

            <button
              onClick={() => {
                if (!selectedRoom && rooms.length > 0) {
                  onSelectRoom(rooms[0]);
                }
                setMapPresentationMode('3D');
              }}
              style={{
                border: 'none',
                background: mapPresentationMode === '3D' ? 'var(--surface-white)' : 'transparent',
                color: mapPresentationMode === '3D' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: mapPresentationMode === '3D' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: mapPresentationMode === '3D' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Box size={13} color="var(--primary-blue)" />
              <span>3D Room Viewer</span>
            </button>
          </div>
        </div>

        {/* 5 View Mode Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: '4px' }}>
            LAYER:
          </span>
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
                  color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                  padding: '4px 9px',
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

        {/* Building Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zone:</span>
          {buildings.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBuildingFilter(b)}
              style={{
                border: 'none',
                background: activeBuildingFilter === b ? 'var(--primary-blue-light)' : 'transparent',
                color: activeBuildingFilter === b ? 'var(--primary-blue)' : 'var(--text-secondary)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: activeBuildingFilter === b ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Architectural Spatial Floor-Plan Canvas */}
      <div className="campus-grid-pattern card-surface" style={{ padding: '24px', minHeight: '620px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {Object.entries(roomsByBuilding).map(([buildingName, bRooms]) => (
            <div key={buildingName}>
              {/* Building Boundary Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                borderBottom: '1.5px solid var(--border-subtle)',
                paddingBottom: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: 'var(--primary-blue)',
                    color: '#FFF',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    FACILITY ZONE
                  </span>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: 'var(--text-primary)'
                  }}>
                    {buildingName}
                  </h3>
                </div>

                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--text-muted)'
                }}>
                  {bRooms.length} rooms • {bRooms.reduce((s, r) => s + r.capacity, 0)} total seats
                </span>
              </div>

              {/* Floor Plan Room Spatial Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px'
              }}>
                {bRooms.map((room) => {
                  const isSelected = selectedRoom?.room_id === room.room_id;
                  const roomEvents = dayEvents.filter((e) => e.room_id === room.room_id);
                  const totalEnrolled = roomEvents.reduce((sum, e) => sum + e.enrolled_students, 0);
                  const avgUtil = roomEvents.length > 0
                    ? (totalEnrolled / (room.capacity * roomEvents.length)) * 100
                    : 0;

                  const isOvercap = roomEvents.some((e) => e.enrolled_students > room.capacity);
                  const isUnderutilized = avgUtil > 0 && avgUtil < 30;
                  const hasLabTools = room.equipment_list && room.equipment_list.some((eq) => eq.toLowerCase().includes('gpu') || eq.toLowerCase().includes('computer'));

                  // Visual Mode Styling
                  let cardBorder = '1px solid var(--border-color)';
                  let accentColor = 'var(--status-green)';
                  let cardFill = 'var(--surface-white)';

                  if (isSelected) {
                    cardBorder = '2px solid var(--primary-blue)';
                    cardFill = 'var(--surface-white)';
                  } else if (viewMode === 'UTILIZATION') {
                    if (isOvercap) {
                      cardFill = 'var(--status-coral-bg)';
                      accentColor = 'var(--status-coral)';
                    } else if (isUnderutilized) {
                      cardFill = 'var(--status-amber-bg)';
                      accentColor = 'var(--status-amber)';
                    } else {
                      cardFill = 'var(--status-green-bg)';
                      accentColor = 'var(--status-green)';
                    }
                  } else if (viewMode === 'CONFLICTS') {
                    if (isOvercap) {
                      cardFill = 'var(--status-coral-bg)';
                      cardBorder = '1.5px solid var(--status-coral)';
                      accentColor = 'var(--status-coral)';
                    } else {
                      cardFill = 'var(--surface-white)';
                      accentColor = 'var(--border-strong)';
                    }
                  } else if (viewMode === 'EQUIPMENT') {
                    if (hasLabTools) {
                      cardFill = 'var(--teal-light)';
                      accentColor = 'var(--teal)';
                    }
                  } else if (viewMode === 'CAPACITY') {
                    if (room.capacity >= 75) {
                      accentColor = 'var(--primary-blue)';
                    }
                  } else {
                    if (isOvercap) accentColor = 'var(--status-coral)';
                    else if (isUnderutilized) accentColor = 'var(--status-amber)';
                  }

                  return (
                    <div
                      key={room.room_id}
                      onClick={() => onSelectRoom(room)}
                      style={{
                        background: cardFill,
                        border: cardBorder,
                        borderLeft: `4px solid ${accentColor}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                            {room.room_name}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9.5px',
                            color: 'var(--text-secondary)',
                            marginTop: '2px'
                          }}>
                            {room.room_id} // {room.room_type || 'Hall'}
                          </div>
                        </div>

                        <span className="mono-num" style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isOvercap ? 'var(--status-coral)' : isUnderutilized ? 'var(--status-amber)' : 'var(--status-green)'
                        }}>
                          {avgUtil.toFixed(0)}%
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}>
                        <span>👥 <strong>{room.capacity}</strong> seats</span>
                        <span>•</span>
                        <span><strong>{roomEvents.length}</strong> classes today</span>
                      </div>

                      {/* Equipment Chips & Quick 3D trigger */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {room.equipment_list?.slice(0, 2).map((eq) => (
                            <span
                              key={eq}
                              style={{
                                background: 'rgba(36, 87, 166, 0.06)',
                                border: '1px solid var(--border-color)',
                                padding: '1px 5px',
                                borderRadius: '2px',
                                fontSize: '9px',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {eq}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRoom(room);
                            setMapPresentationMode('3D');
                          }}
                          style={{
                            border: '1px solid var(--primary-blue)',
                            background: 'var(--primary-blue-light)',
                            color: 'var(--primary-blue)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Box size={11} /> 3D View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
