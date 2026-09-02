import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  Wrench,
  Box,
  CheckCircle2,
  AlertTriangle,
  Send,
  PlusCircle,
  Building2,
  LogOut,
  Search,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function FacultyDashboard({
  user,
  rooms = [],
  timetable = [],
  activeDay = 'Monday',
  onDayChange,
  onOpen3DViewer,
  onLogout,
  onAskAssistant,
  onFindBetterRoom
}) {
  const facultyId = user.facultyId || 'FAC-01';
  const [selectedSlotFilter, setSelectedSlotFilter] = useState('ALL');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueRoomId, setIssueRoomId] = useState(rooms[0]?.room_id || 'LH-101');
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  // Filter classes taught by this faculty on activeDay
  const myDayClasses = timetable.filter(
    (e) => (e.faculty_id === facultyId || e.faculty_id === 'FAC-01') && e.day === activeDay
  );

  // Find assigned rooms for this faculty
  const assignedRoomIds = [...new Set(myDayClasses.map((c) => c.room_id))];
  const myAssignedRooms = rooms.filter((r) => assignedRoomIds.includes(r.room_id));

  // Vacant rooms on activeDay at 09:00-10:00 or selected slot
  const targetSlot = selectedSlotFilter === 'ALL' ? '09:00-10:00' : selectedSlotFilter;
  const occupiedRoomIds = new Set(
    timetable.filter((e) => e.day === activeDay && e.slot === targetSlot).map((e) => e.room_id)
  );
  const availableRooms = rooms.filter((r) => !occupiedRoomIds.has(r.room_id));

  function handleReportIssue(e) {
    e.preventDefault();
    if (!issueDescription.trim()) return;
    setIssueSubmitted(true);
    setTimeout(() => {
      setIssueSubmitted(false);
      setIssueDescription('');
    }, 3000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Profile & Context */}
      <div style={{
        background: 'var(--surface-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-blue-light)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>
                {user.name}
              </h2>
              <span style={{
                background: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {user.facultyId || 'FAC-01'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {user.title || 'Associate Professor'} • {user.department || 'Computer Science'}
            </div>
          </div>
        </div>

        {/* Day Selector & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            background: 'var(--surface-muted)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
              <button
                key={d}
                onClick={() => onDayChange(d)}
                style={{
                  border: 'none',
                  background: activeDay === d ? 'var(--primary-blue)' : 'transparent',
                  color: activeDay === d ? '#FFF' : 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: activeDay === d ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '6px 12px', color: 'var(--status-coral)' }}
            title="Sign out"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* LEFT: Today's Teaching Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-surface" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Today's Teaching Schedule ({activeDay})
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {myDayClasses.length} lectures and laboratory sessions scheduled
                </div>
              </div>

              <span style={{
                background: 'var(--status-green-bg)',
                color: 'var(--status-green)',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '10.5px',
                fontWeight: 600
              }}>
                ● Active Today
              </span>
            </div>

            {myDayClasses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myDayClasses.map((cls) => {
                  const rm = rooms.find((r) => r.room_id === cls.room_id);
                  const isOvercap = rm && cls.enrolled_students > rm.capacity;

                  return (
                    <div
                      key={cls.event_id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--surface-muted)',
                        border: `1px solid ${isOvercap ? 'var(--status-coral-border)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                            {cls.course_code}: {cls.course_name}
                          </strong>
                          {isOvercap && (
                            <span className="badge-conflict">
                              Over Capacity (+{cls.enrolled_students - rm.capacity})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="var(--primary-blue)" /> {cls.slot}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="var(--primary-blue)" /> {rm?.room_name || cls.room_id} ({rm?.building})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {rm && onFindBetterRoom && (
                          <button
                            onClick={() => onFindBetterRoom(rm, cls)}
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            title="Find a better room for this teaching session"
                          >
                            <Sparkles size={13} color="var(--primary-blue)" />
                            <span>Find Better</span>
                          </button>
                        )}

                        {rm && onOpen3DViewer && (
                          <button
                            onClick={() => onOpen3DViewer(rm)}
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            title="Inspect Room in 3D"
                          >
                            <Box size={13} color="var(--primary-blue)" />
                            <span>3D</span>
                          </button>
                        )}

                        {onAskAssistant && (
                          <button
                            onClick={() => onAskAssistant(rm)}
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--primary-blue)' }}
                            title="Ask AI Assistant about this class"
                          >
                            <span>Ask AI</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                No classes scheduled for {user.name} on {activeDay}.
              </div>
            )}
          </div>

          {/* Assigned Rooms & Equipment Status */}
          <div className="card-surface" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Assigned Room Hardware & Readiness
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myAssignedRooms.map((rm) => (
                <div
                  key={rm.room_id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{rm.room_name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        ({rm.capacity} seats • {rm.building})
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--status-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Operational
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {(rm.equipment_list || []).map((eq) => (
                      <span
                        key={eq}
                        style={{
                          background: 'var(--surface-white)',
                          border: '1px solid var(--border-color)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10.5px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        ✓ {eq}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Quick Room Availability & Work Order Dispatch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Room Finder for Office Hours / Makeups */}
          <div className="card-surface" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Vacant Rooms for Ad-Hoc Sessions
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Available on {activeDay} for review sessions or office hours
                </div>
              </div>

              <select
                value={selectedSlotFilter}
                onChange={(e) => setSelectedSlotFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface-muted)',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              >
                <option value="09:00-10:00">09:00 - 10:00</option>
                <option value="10:00-11:00">10:00 - 11:00</option>
                <option value="11:00-12:00">11:00 - 12:00</option>
                <option value="13:00-14:00">13:00 - 14:00</option>
                <option value="14:00-15:00">14:00 - 15:00</option>
                <option value="15:00-16:00">15:00 - 16:00</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {availableRooms.slice(0, 6).map((rm) => (
                <div
                  key={rm.room_id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rm.room_name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {rm.building} • {rm.capacity} seats
                    </div>
                  </div>

                  <span style={{ fontSize: '10px', color: 'var(--status-green)', fontWeight: 600, marginTop: '6px' }}>
                    ● Vacant in this slot
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Facility Issue Report */}
          <div className="card-surface" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Report Classroom or Lab Equipment Issue
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Notifies campus operations immediately for priority dispatch.
            </p>

            {issueSubmitted ? (
              <div style={{
                background: 'var(--status-green-bg)',
                border: '1px solid var(--status-green-border)',
                color: 'var(--status-green)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>Work order submitted to Operations Dispatch!</span>
              </div>
            ) : (
              <form onSubmit={handleReportIssue} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Affected Room
                  </label>
                  <select
                    value={issueRoomId}
                    onChange={(e) => setIssueRoomId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    {rooms.map((r) => (
                      <option key={r.room_id} value={r.room_id}>
                        {r.room_name} ({r.building})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Problem Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Projector HDMI port damaged, AC unit noisy..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!issueDescription.trim()}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-end', fontSize: '11.5px', marginTop: '4px' }}
                >
                  <Send size={13} />
                  <span>Submit Work Order</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
