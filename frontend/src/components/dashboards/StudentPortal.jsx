import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Box,
  CheckCircle2,
  AlertTriangle,
  Building2,
  LogOut,
  Search,
  Sparkles,
  BookOpen,
  Send,
  Compass
} from 'lucide-react';

export default function StudentPortal({
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
  const enrolledCourses = user.enrolledCourses || ['CS-101', 'CS-301', 'CS-205', 'CS-402'];
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [studySpaceBuilding, setStudySpaceBuilding] = useState('ALL');

  // Filter student's classes on activeDay
  const studentDayClasses = timetable.filter(
    (e) => enrolledCourses.includes(e.course_code) && e.day === activeDay
  );

  // Identify next class
  const nextClass = studentDayClasses[0] || null;
  const nextRoom = nextClass ? rooms.find((r) => r.room_id === nextClass.room_id) : null;

  // Filter study spaces / available rooms
  const filteredRooms = rooms.filter((r) => {
    if (studySpaceBuilding !== 'ALL' && r.building !== studySpaceBuilding) return false;
    if (roomSearchQuery && !r.room_name.toLowerCase().includes(roomSearchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Profile */}
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
            background: 'var(--teal-light)',
            color: 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} />
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
                background: 'var(--teal-light)',
                color: 'var(--teal)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)'
              }}>
                {user.studentId || 'STU-2026'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {user.title || 'Undergraduate Student'} • {user.department || 'Computer Science Major'}
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

      {/* Next Class Hero Banner */}
      {nextClass && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-blue) 0%, #1A4688 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textTransform: 'uppercase'
            }}>
              Upcoming Lecture Today
            </span>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              fontWeight: 800,
              marginTop: '6px',
              color: '#FFFFFF'
            }}>
              {nextClass.course_code}: {nextClass.course_name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', marginTop: '6px', opacity: 0.9 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} /> {nextClass.slot} ({activeDay})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} /> {nextRoom?.room_name || nextClass.room_id} ({nextRoom?.building})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} /> {nextClass.enrolled_students} Enrolled
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {nextRoom && onOpen3DViewer && (
              <button
                onClick={() => onOpen3DViewer(nextRoom)}
                style={{
                  background: '#FFFFFF',
                  color: 'var(--primary-blue)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Box size={15} />
                <span>View Classroom in 3D</span>
              </button>
            )}

            {nextRoom && onFindBetterRoom && (
              <button
                onClick={() => onFindBetterRoom(nextRoom, nextClass)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Find a better room using CampusOptix optimization"
              >
                <Sparkles size={15} />
                <span>Find Better Room</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* LEFT: Today's Enrolled Timetable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-surface" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  My Enrolled Classes ({activeDay})
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {studentDayClasses.length} registered classes scheduled today
                </div>
              </div>
            </div>

            {studentDayClasses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {studentDayClasses.map((cls) => {
                  const rm = rooms.find((r) => r.room_id === cls.room_id);
                  return (
                    <div
                      key={cls.event_id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                          {cls.course_code}: {cls.course_name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="var(--primary-blue)" /> {cls.slot}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="var(--primary-blue)" /> {rm?.room_name || cls.room_id} ({rm?.building})
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {rm && onFindBetterRoom && (
                          <button
                            onClick={() => onFindBetterRoom(rm, cls)}
                            className="btn-secondary"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            title="Find a better room for this class"
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
                            <span>3D View</span>
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
                No enrolled classes scheduled on {activeDay}. Enjoy your open study time!
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Campus Study Spaces & Room Explorer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-surface" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Campus Room & Study Space Finder
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Explore room hardware, quiet spaces, and 3D floor plans
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={studySpaceBuilding}
                  onChange={(e) => setStudySpaceBuilding(e.target.value)}
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
                  <option value="ALL">All Buildings</option>
                  <option value="Science Hall">Science Hall</option>
                  <option value="Tech Complex">Tech Complex</option>
                  <option value="Central Tower">Central Tower</option>
                  <option value="Engineering Block">Engineering Block</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {filteredRooms.map((rm) => (
                <div
                  key={rm.room_id}
                  style={{
                    padding: '12px',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rm.room_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {rm.building} • {rm.capacity} seats
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '6px' }}>
                      {(rm.equipment_list || []).slice(0, 2).map((eq) => (
                        <span
                          key={eq}
                          style={{
                            background: 'var(--surface-white)',
                            border: '1px solid var(--border-color)',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            fontSize: '9.5px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--status-green)', fontWeight: 600 }}>
                      ● Open Space
                    </span>

                    {onOpen3DViewer && (
                      <button
                        onClick={() => onOpen3DViewer(rm)}
                        className="btn-secondary"
                        style={{ fontSize: '10px', padding: '3px 6px' }}
                      >
                        <Box size={11} color="var(--primary-blue)" />
                        <span>3D</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
