import React, { useState } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  Sliders,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Info,
  Layers,
  TrendingUp,
  ShieldCheck,
  Users
} from 'lucide-react';

const SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
];

function DraggableClassCard({ event, room, isSelected, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `whatif-event-${event.event_id}`,
    data: { event }
  });

  const enrolled = event.enrolled_students;
  const capacity = room.capacity || 1;
  const util = (enrolled / capacity) * 100;
  const isOvercap = enrolled > capacity;

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.35 : 1,
    background: isOvercap ? 'var(--status-coral-bg)' : isSelected ? 'var(--secondary-blue-light)' : 'var(--surface-white)',
    border: `1px solid ${isSelected ? 'var(--primary-blue)' : isOvercap ? 'var(--status-coral)' : 'var(--border-color)'}`,
    borderLeft: `4px solid ${isOvercap ? 'var(--status-coral)' : 'var(--status-green)'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '6px 8px',
    marginBottom: '4px',
    cursor: 'grab',
    userSelect: 'none',
    boxShadow: isDragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
    zIndex: isDragging ? 9999 : 1,
    transition: isDragging ? 'none' : 'box-shadow 0.1s ease'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(event, room)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{event.course_code}</strong>
        <span className="mono-num" style={{ fontSize: '9px', color: isOvercap ? 'var(--status-coral)' : 'var(--text-secondary)', fontWeight: 600 }}>
          {util.toFixed(0)}%
        </span>
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
        👥 {enrolled}/{capacity} seats
      </div>
    </div>
  );
}

function DroppableRoomSlot({ roomId, slot, events, room, onSelectEvent, selectedEventId }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${roomId}-${slot}`,
    data: { roomId, slot, room }
  });

  return (
    <td
      ref={setNodeRef}
      style={{
        border: '1px solid var(--border-subtle)',
        padding: '4px',
        verticalAlign: 'top',
        height: '66px',
        minWidth: '105px',
        background: isOver ? 'var(--secondary-blue-light)' : 'var(--surface-white)',
        outline: isOver ? '2px dashed var(--primary-blue)' : 'none',
        transition: 'all 0.1s ease'
      }}
    >
      {events.map((ev) => (
        <DraggableClassCard
          key={ev.event_id}
          event={ev}
          room={room}
          isSelected={selectedEventId === ev.event_id}
          onClick={onSelectEvent}
        />
      ))}
    </td>
  );
}

export default function WhatIfSimulatorPage({
  rooms = [],
  timetable = [],
  activeDay = 'Monday',
  onMoveCourse,
  annotation = null,
  onApplySimulation,
  onResetSimulation
}) {
  const [selectedClass, setSelectedClass] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4
      }
    })
  );

  // Group events for active day
  const dayEvents = timetable.filter((e) => e.day === activeDay);
  const eventsByCell = {};
  for (const ev of dayEvents) {
    const key = `${ev.room_id}_${ev.slot}`;
    if (!eventsByCell[key]) eventsByCell[key] = [];
    eventsByCell[key].push(ev);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const courseEvent = active.data.current?.event;
    const { roomId: targetRoomId, slot: targetSlot } = over.data.current || {};

    if (courseEvent && targetRoomId && targetSlot) {
      setSelectedClass(courseEvent);
      onMoveCourse(courseEvent.event_id, targetRoomId, targetSlot);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Simulation Mode Banner */}
      <div style={{
        background: 'var(--primary-blue-light)',
        border: '1px solid var(--primary-blue)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary-blue)',
            display: 'inline-block'
          }} />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
            SCENARIO TESTING SANDBOX:
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            Drag classes to test room reallocations. Changes are hypothetical until you click &quot;Apply This Move&quot;.
          </span>
        </div>

        {annotation && (
          <span style={{ fontSize: '11px', color: 'var(--status-green)', fontWeight: 600 }}>
            ⚡ Live Move Calculated
          </span>
        )}
      </div>

      {/* Three-Panel Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '270px 1fr 310px',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* LEFT PANEL: Daily Class List */}
        <div className="card-surface" style={{ padding: '16px', maxHeight: '700px', overflowY: 'auto' }}>
          <div style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            marginBottom: '12px'
          }}>
            Classes on {activeDay} ({dayEvents.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayEvents.map((ev) => {
              const currentRoom = rooms.find((r) => r.room_id === ev.room_id) || {};
              const isOvercap = ev.enrolled_students > (currentRoom.capacity || 0);

              return (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedClass(ev)}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    background: selectedClass?.event_id === ev.event_id ? 'var(--primary-blue-light)' : 'var(--surface-white)',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${isOvercap ? 'var(--status-coral)' : 'var(--primary-blue)'}`,
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>{ev.course_code}</strong>
                    <span className="mono-num" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{ev.slot}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {ev.course_name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>📍 {currentRoom.room_name}</span>
                    <span>👥 {ev.enrolled_students} students</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PANEL: Droppable Floor Plan Grid */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="card-surface" style={{ padding: '16px', overflowX: 'auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: 'var(--text-primary)'
                }}>
                  Spatial Schedule Matrix ({activeDay})
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Drag any class card into a room slot to test safety and score changes.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-muted)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', minWidth: '150px', border: '1px solid var(--border-color)' }}>
                    Room Space
                  </th>
                  {SLOTS.map((slot) => (
                    <th key={slot} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      {slot.slice(0, 5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.room_id}>
                    <td style={{
                      padding: '8px 10px',
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      borderRight: '2px solid var(--border-strong)'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-primary)' }}>
                        {room.room_name}
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                        {room.capacity} seats • {room.building}
                      </div>
                    </td>

                    {SLOTS.map((slot) => {
                      const key = `${room.room_id}_${slot}`;
                      const events = eventsByCell[key] || [];

                      return (
                        <DroppableRoomSlot
                          key={slot}
                          roomId={room.room_id}
                          slot={slot}
                          events={events}
                          room={room}
                          selectedEventId={selectedClass?.event_id}
                          onSelectEvent={(ev) => setSelectedClass(ev)}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DndContext>

        {/* RIGHT PANEL: Live Delta Comparison */}
        <div className="card-surface" style={{ padding: '18px' }}>
          <div style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            marginBottom: '14px'
          }}>
            Live Move Comparison
          </div>

          {annotation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px'
              }}>
                <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  {annotation.course_code}
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {annotation.course_name}
                </div>

                <div style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{annotation.from_room}</span>
                  <ArrowRight size={12} color="var(--primary-blue)" />
                  <strong style={{ color: 'var(--status-green)' }}>{annotation.to_room}</strong>
                </div>
              </div>

              {/* 4 Live Delta Meters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* UDS Score Delta */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: annotation.uds_gain >= 0 ? 'var(--status-green-bg)' : 'var(--status-amber-bg)',
                  border: `1px solid ${annotation.uds_gain >= 0 ? 'var(--status-green-border)' : 'var(--status-amber-border)'}`
                }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Optimization Debt Score</div>
                  <div className="mono-num" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {annotation.uds_before.toFixed(1)} ➔ {annotation.uds_after.toFixed(1)}
                    {' '}
                    <span style={{ fontSize: '11px', color: annotation.uds_gain >= 0 ? 'var(--status-green)' : 'var(--status-amber)' }}>
                      ({annotation.uds_gain >= 0 ? `+${annotation.uds_gain.toFixed(1)} pts` : `-${Math.abs(annotation.uds_gain).toFixed(1)} pts`})
                    </span>
                  </div>
                </div>

                {/* Validation Checks */}
                <div style={{
                  background: 'var(--surface-white)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: annotation.is_capacity_safe ? 'var(--status-green)' : 'var(--status-coral)' }}>
                    <CheckCircle2 size={13} />
                    <span>Capacity: {annotation.is_capacity_safe ? '✓ Room Fits Students' : '✕ Overcapacity Hazard'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: annotation.is_equipment_matched ? 'var(--status-green)' : 'var(--status-coral)' }}>
                    <CheckCircle2 size={13} />
                    <span>Equipment: {annotation.is_equipment_matched ? '✓ Required Tools Available' : '✕ Missing Lab Tools'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={onApplySimulation}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Check size={14} />
                  <span>Apply This Move</span>
                </button>

                <button
                  onClick={onResetSimulation}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <RotateCcw size={13} />
                  <span>Revert Move</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '28px 12px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              lineHeight: '1.6'
            }}>
              Drag any class card into a different room slot to test instantaneous safety checks, capacity headroom, and score deltas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
