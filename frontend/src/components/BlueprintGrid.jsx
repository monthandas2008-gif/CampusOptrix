import React, { useState } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { AlertTriangle, Wrench, CheckCircle, Info } from 'lucide-react';

const SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Draggable Course Card Component
function DraggableCourseCard({ event, room, onInspect }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event-${event.event_id}`,
    data: { event }
  });

  const enrolled = event.enrolled_students;
  const capacity = room.capacity || 1;
  const util = (enrolled / capacity) * 100;

  // Equipment mismatch check
  const reqEquip = new Set(event.required_equipment_list || []);
  const roomEquip = new Set(room.equipment_list || []);
  let isMismatch = false;
  for (const eq of reqEquip) {
    if (!roomEquip.has(eq)) {
      isMismatch = true;
      break;
    }
  }

  const isOvercap = enrolled > capacity;
  const isUnderutil = util < 30.0;

  let cardBg = '#FFF';
  let borderLeft = '4px solid var(--signal-green)';
  let extraClass = '';

  if (isOvercap) {
    borderLeft = '4px solid var(--signal-amber)';
    extraClass = 'hatch-amber';
  } else if (isMismatch) {
    borderLeft = '4px solid var(--signal-red)';
    cardBg = 'rgba(168, 50, 38, 0.12)';
  } else if (isUnderutil) {
    borderLeft = '4px solid #D4A017';
    cardBg = 'rgba(212, 160, 23, 0.12)';
  }

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    border: '1px solid var(--ink)',
    borderLeft,
    padding: '4px 6px',
    marginBottom: '3px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    background: cardBg,
    cursor: 'grab',
    userSelect: 'none',
    boxShadow: isDragging ? '2px 4px 10px rgba(0,0,0,0.2)' : 'none',
    zIndex: isDragging ? 999 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={extraClass}
      {...listeners}
      {...attributes}
      onClick={() => onInspect({ event, room, util, isOvercap, isMismatch, isUnderutil })}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: 'var(--ink)' }}>{event.course_code}</strong>
        <span style={{ fontSize: '9px', color: 'var(--blueprint)', fontWeight: 600 }}>{event.section || 'Sec A'}</span>
      </div>
      <div style={{ fontSize: '10px', color: '#333', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
        <span>👥 {enrolled}/{capacity} seats</span>
        <span>{util.toFixed(0)}%</span>
      </div>

      {isOvercap && (
        <div style={{
          marginTop: '3px',
          background: 'var(--signal-amber)',
          color: '#FFF',
          fontSize: '8px',
          fontWeight: 700,
          padding: '1px 3px',
          display: 'inline-block'
        }}>
          ⚠️ ROOM TOO SMALL (+{enrolled - capacity})
        </div>
      )}

      {isMismatch && (
        <div style={{
          marginTop: '3px',
          background: 'var(--signal-red)',
          color: '#FFF',
          fontSize: '8px',
          fontWeight: 700,
          padding: '1px 3px',
          display: 'inline-block'
        }}>
          ⚙️ EQUIPMENT MISSING
        </div>
      )}
    </div>
  );
}

// Droppable Slot Container Component
function DroppableSlotCell({ roomId, slot, events, room, onInspect }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${roomId}-${slot}`,
    data: { roomId, slot }
  });

  const cellStyle = {
    border: '1px solid rgba(28, 43, 58, 0.3)',
    padding: '4px',
    verticalAlign: 'top',
    height: '68px',
    minWidth: '120px',
    background: isOver ? 'var(--blueprint-light)' : 'transparent',
    outline: isOver ? '2px dashed var(--blueprint)' : 'none',
    transition: 'background 0.15s ease'
  };

  return (
    <td ref={setNodeRef} style={cellStyle}>
      {events.map((ev) => (
        <DraggableCourseCard
          key={ev.event_id}
          event={ev}
          room={room}
          onInspect={onInspect}
        />
      ))}
    </td>
  );
}

export default function BlueprintGrid({
  rooms,
  timetable,
  onMoveCourse,
  activeDay,
  onDayChange,
  annotation
}) {
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [inspectedItem, setInspectedItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // 5px movement before initiating drag
      }
    })
  );

  const buildings = ['ALL', ...new Set(rooms.map((r) => r.building))];
  const filteredRooms = selectedBuilding === 'ALL'
    ? rooms
    : rooms.filter((r) => r.building === selectedBuilding);

  // Group events by (roomId, slot) for the active day
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

    const eventId = active.data.current?.event?.event_id;
    const { roomId: targetRoomId, slot: targetSlot } = over.data.current || {};

    if (eventId && targetRoomId && targetSlot) {
      onMoveCourse(eventId, targetRoomId, targetSlot);
    }
  }

  return (
    <div style={{ marginBottom: '25px' }}>
      {/* Control Bar: Day Tabs & Building Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--blueprint)',
        paddingBottom: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Day Selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => onDayChange(day)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 14px',
                border: '1.5px solid var(--blueprint)',
                background: activeDay === day ? 'var(--blueprint)' : '#FAF8F2',
                color: activeDay === day ? '#FFF' : 'var(--ink)',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Building Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--blueprint)' }}>
            FILTER BY BUILDING:
          </span>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '4px 8px',
              border: '1.5px solid var(--ink)',
              background: '#FFF',
              fontWeight: 600
            }}
          >
            {buildings.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DnD Grid Table */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{
          overflowX: 'auto',
          border: '2px solid var(--ink)',
          background: 'var(--paper)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <thead>
              <tr>
                <th style={{
                  background: 'var(--ink)',
                  color: '#FFF',
                  padding: '8px 10px',
                  textAlign: 'left',
                  minWidth: '180px',
                  border: '1px solid var(--ink)',
                  textTransform: 'uppercase'
                }}>
                  ROOM / FACILITY
                </th>
                {SLOTS.map((s) => (
                  <th
                    key={s}
                    style={{
                      background: 'var(--blueprint)',
                      color: '#FFF',
                      padding: '8px 6px',
                      textAlign: 'center',
                      border: '1px solid var(--ink)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room.room_id}>
                  {/* Room Meta Cell */}
                  <td style={{
                    background: 'rgba(47, 93, 138, 0.05)',
                    padding: '6px 10px',
                    border: '1px solid rgba(28, 43, 58, 0.3)',
                    borderRight: '2px solid var(--ink)',
                    verticalAlign: 'top'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>
                      {room.room_name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--blueprint)', marginTop: '2px' }}>
                      {room.building} • Capacity: {room.capacity} seats
                    </div>
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                      🧰 Tools: {room.equipment_list?.length > 0 ? room.equipment_list.join(', ') : 'Standard Desk'}
                    </div>
                  </td>

                  {/* 8 Slot Cells */}
                  {SLOTS.map((slot) => {
                    const key = `${room.room_id}_${slot}`;
                    const slotEvents = eventsByCell[key] || [];
                    return (
                      <DroppableSlotCell
                        key={slot}
                        roomId={room.room_id}
                        slot={slot}
                        events={slotEvents}
                        room={room}
                        onInspect={setInspectedItem}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DndContext>

      {/* Drafting Callout & Leader Line Box */}
      <div style={{
        marginTop: '12px',
        border: '1.5px solid var(--blueprint)',
        background: '#FFF',
        padding: '10px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        position: 'relative'
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--blueprint)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Info size={13} /> [ROOM INSPECTOR & SCENARIO CHANGE PREVIEW]
        </div>

        {annotation ? (
          <div style={{ color: 'var(--ink)', lineHeight: '1.5' }}>
            <strong>⚡ CHANGE PREVIEW:</strong> Moved <code>{annotation.course_code}</code> ({annotation.course_name})<br />
            • Move: <b>{annotation.from_room} [{annotation.from_slot}]</b> ➔ <b>{annotation.to_room} [{annotation.to_slot}]</b><br />
            • Space Check: {annotation.is_capacity_safe ? <span style={{ color: 'var(--signal-green)', fontWeight: 700 }}>✓ PASS (Enough space for all students)</span> : <span style={{ color: 'var(--signal-amber)', fontWeight: 700 }}>✕ OVERCROWDED (Room is too small)</span>}<br />
            • Equipment Check: {annotation.is_equipment_matched ? <span style={{ color: 'var(--signal-green)', fontWeight: 700 }}>✓ PASS (All required tools available)</span> : <span style={{ color: 'var(--signal-red)', fontWeight: 700 }}>✕ MISSING REQUIRED LAB HARDWARE</span>}<br />
            • Overall Improvement: <strong>{annotation.uds_gain >= 0 ? `+${annotation.uds_gain.toFixed(1)} points improved` : `-${Math.abs(annotation.uds_gain).toFixed(1)} points penalty`}</strong>
          </div>
        ) : inspectedItem ? (
          <div style={{ color: 'var(--ink)', lineHeight: '1.5' }}>
            <strong>📍 CLASS DETAILS:</strong> <code>{inspectedItem.event.course_code}</code> - {inspectedItem.event.course_name} ({inspectedItem.event.section || 'Sec A'})<br />
            • Assigned to <b>{inspectedItem.room.room_name}</b> ({inspectedItem.room.building}) at <b>{inspectedItem.event.slot}</b> on <b>{inspectedItem.event.day}</b><br />
            • Attendance: <b>{inspectedItem.event.enrolled_students} students</b> in a <b>{inspectedItem.room.capacity}-seat room</b> ({inspectedItem.util.toFixed(0)}% of seats filled)<br />
            • Required Tools: <em>{inspectedItem.event.required_equipment_list?.length > 0 ? inspectedItem.event.required_equipment_list.join(', ') : 'Standard'}</em> | Available in Room: <em>{inspectedItem.room.equipment_list?.join(', ')}</em>
          </div>
        ) : (
          <div style={{ color: 'var(--ink-muted)' }}>
            💡 <strong>Tip:</strong> Drag and drop any class card to another room or time slot to see what happens, or click any class card to inspect its details.
          </div>
        )}
      </div>
    </div>
  );
}
