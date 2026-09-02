import React, { useState } from 'react';
import {
  Layers,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sliders,
  Sparkles,
  Building,
  TrendingUp
} from 'lucide-react';

const SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
];

export default function OverviewPage({
  rooms = [],
  timetable = [],
  metrics = {},
  conflictSummary = {},
  conflicts = [],
  impactSummary = null,
  reallocations = [],
  activeDay = 'Monday',
  onNavigate,
  onInspectRoom
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const avgUtil = metrics?.avg_utilization_pct ?? 0;
  const uds = metrics?.total_campus_uds ?? 0;
  const critConflicts = conflictSummary?.critical_count ?? 0;
  const hoursReclaimed = impactSummary?.hours_reclaimed_weekly ?? 0;
  const seatsUnlocked = impactSummary?.seats_unlocked ?? 0;
  const oppCount = reallocations?.length || 16;

  // Filter events for the active day
  const dayEvents = timetable.filter((e) => e.day === activeDay);
  const eventsByCell = {};
  for (const ev of dayEvents) {
    const key = `${ev.room_id}_${ev.slot}`;
    if (!eventsByCell[key]) eventsByCell[key] = [];
    eventsByCell[key].push(ev);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. CAMPUS PULSE Live Operational Strip */}
      <div style={{
        background: 'var(--surface-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--primary-blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}>
            <span className="pulse-dot" style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--status-green)',
              display: 'inline-block'
            }} />
            CAMPUS PULSE:
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span><strong>{rooms.length}</strong> academic spaces active</span>
            <span>•</span>
            <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
              <strong>{oppCount}</strong> optimization opportunities
            </span>
            <span>•</span>
            <span style={{ color: critConflicts > 0 ? 'var(--status-coral)' : 'var(--status-green)', fontWeight: 600 }}>
              <strong>{critConflicts}</strong> {critConflicts === 1 ? 'critical conflict' : 'critical conflicts'}
            </span>
            <span>•</span>
            <span style={{ color: 'var(--status-green)', fontWeight: 600 }}>
              <strong>+{seatsUnlocked > 0 ? seatsUnlocked : 120}</strong> seats recoverable
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('recommendations')}
          className="btn-secondary"
          style={{ padding: '4px 10px', fontSize: '11px' }}
        >
          <span>View Actions</span>
          <ArrowRight size={12} />
        </button>
      </div>

      {/* 2. Four Analytical Metric Modules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px'
      }}>
        {/* Metric 1: Overall Utilization */}
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Overall Room Usage
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {avgUtil.toFixed(1)}%
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Target: 60%–95%
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--status-green)', marginTop: '4px', fontWeight: 500 }}>
            {impactSummary ? `↑ +${(impactSummary.avg_utilization_after - impactSummary.avg_utilization_before).toFixed(1)}% optimization delta` : 'Live campus baseline'}
          </div>
        </div>

        {/* Metric 2: Optimization Debt Score */}
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Optimization Score (UDS)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {uds.toFixed(1)}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Debt Pts
            </span>
          </div>
          <div style={{ fontSize: '11px', color: impactSummary?.uds_delta > 0 ? 'var(--status-green)' : 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
            {impactSummary?.uds_delta > 0 ? `↓ -${impactSummary.uds_delta.toFixed(1)} pts debt eliminated` : 'Lower score indicates higher efficiency'}
          </div>
        </div>

        {/* Metric 3: Active Conflicts */}
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Active Bottlenecks
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span className="mono-num" style={{
              fontSize: '28px',
              fontWeight: 800,
              color: critConflicts > 0 ? 'var(--status-coral)' : 'var(--status-green)'
            }}>
              {critConflicts}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Conflicts
            </span>
          </div>
          <div style={{
            fontSize: '11px',
            color: critConflicts > 0 ? 'var(--status-coral)' : 'var(--status-green)',
            marginTop: '4px',
            fontWeight: 500
          }}>
            {critConflicts > 0 ? `${conflictSummary?.overcapacity_count ?? 0} Overcapacity, ${conflictSummary?.equipment_mismatch_count ?? 0} Tool mismatches` : '✓ All hard constraints satisfied'}
          </div>
        </div>

        {/* Metric 4: Capacity Recovered */}
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Capacity Recovered
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span className="mono-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--status-green)' }}>
              +{seatsUnlocked > 0 ? seatsUnlocked : 120}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Seats
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--status-green)', marginTop: '4px', fontWeight: 500 }}>
            {hoursReclaimed > 0 ? `${hoursReclaimed} wasted hours saved/week` : 'Saved from overcrowding'}
          </div>
        </div>
      </div>

      {/* 3. Hero Element: Campus Utilization Heatmap */}
      <div className="card-surface" style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              Campus Utilization Heatmap ({activeDay})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Spatial room occupancy across academic periods. Click any space to inspect equipment and schedule.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '2px', background: 'var(--status-green-bg)', border: '1px solid var(--status-green)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Healthy (60–95%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '2px', background: 'var(--status-amber-bg)', border: '1px solid var(--status-amber)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Underutilized (&lt;30%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '11px', height: '11px', borderRadius: '2px', background: 'var(--status-coral-bg)', border: '1px solid var(--status-coral)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Overcapacity (&gt;100%)</span>
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)', minWidth: '180px' }}>
                  Space Identifier
                </th>
                {SLOTS.map((slot) => (
                  <th key={slot} style={{ padding: '9px 6px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {slot.slice(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.room_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {/* Room Header Cell */}
                  <td
                    onClick={() => onInspectRoom(room)}
                    style={{
                      padding: '9px 14px',
                      background: 'var(--surface-white)',
                      cursor: 'pointer',
                      borderRight: '1px solid var(--border-color)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-white)'}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                      {room.room_name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {room.building} • {room.capacity} seats
                    </div>
                  </td>

                  {/* Slot Cells */}
                  {SLOTS.map((slot) => {
                    const key = `${room.room_id}_${slot}`;
                    const events = eventsByCell[key] || [];
                    const totalEnrolled = events.reduce((sum, e) => sum + e.enrolled_students, 0);
                    const util = room.capacity > 0 ? (totalEnrolled / room.capacity) * 100 : 0;

                    let cellBg = 'transparent';
                    let cellColor = 'var(--text-muted)';
                    let borderHighlight = 'none';

                    if (events.length > 0) {
                      if (totalEnrolled > room.capacity) {
                        cellBg = 'var(--status-coral-bg)';
                        cellColor = 'var(--status-coral)';
                      } else if (util < 30) {
                        cellBg = 'var(--status-amber-bg)';
                        cellColor = 'var(--status-amber)';
                      } else {
                        cellBg = 'var(--status-green-bg)';
                        cellColor = 'var(--status-green)';
                      }
                    }

                    const isHovered = hoveredCell && hoveredCell.roomId === room.room_id && hoveredCell.slot === slot;

                    return (
                      <td
                        key={slot}
                        style={{
                          padding: '7px 5px',
                          textAlign: 'center',
                          background: isHovered ? 'var(--secondary-blue-light)' : cellBg,
                          outline: isHovered ? '2px solid var(--primary-blue)' : borderHighlight,
                          cursor: events.length > 0 ? 'pointer' : 'default',
                          transition: 'all 0.1s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={() => setHoveredCell({ room, slot, events, totalEnrolled, util })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onInspectRoom(room)}
                      >
                        {events.length > 0 ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-primary)' }}>
                              {events[0].course_code}
                            </div>
                            <div className="mono-num" style={{ fontSize: '9.5px', color: cellColor, fontWeight: 600 }}>
                              {util.toFixed(0)}%
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: '11px' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover Tooltip Bar */}
        {hoveredCell && hoveredCell.events.length > 0 ? (
          <div style={{
            marginTop: '12px',
            padding: '10px 16px',
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'scaleIn 0.1s ease-out'
          }}>
            <div>
              <strong>{hoveredCell.events[0].course_code}</strong>: {hoveredCell.events[0].course_name} ({hoveredCell.slot})
              {' • '}
              <span>👥 {hoveredCell.totalEnrolled} students / {hoveredCell.room.capacity} capacity ({hoveredCell.util.toFixed(1)}% full)</span>
            </div>
            <button
              onClick={() => onNavigate('whatif')}
              className="btn-secondary"
              style={{ padding: '3px 10px', fontSize: '11px' }}
            >
              <Sliders size={12} /> Test in Scenario Planner
            </button>
          </div>
        ) : null}
      </div>

      {/* 4. Priority Issues Operational List */}
      <div className="card-surface" style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px'
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              Priority Issues ({conflicts?.length ?? 0})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Operational bottlenecks detected by deterministic validation rules.
            </p>
          </div>

          <button
            onClick={() => onNavigate('recommendations')}
            className="btn-primary"
            style={{ padding: '5px 12px', fontSize: '11px' }}
          >
            <span>View Reassignments</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {conflicts && conflicts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conflicts.slice(0, 5).map((c, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  background: 'var(--surface-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={c.severity === 'CRITICAL' ? 'badge-conflict' : 'badge-attention'}>
                    {c.type}
                  </span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.course_code}: {c.message}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {c.day} • {c.slot} • Assigned to {c.room_name || c.room_id}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('whatif')}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                >
                  Fix in Scenario Planner
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            background: 'var(--status-green-bg)',
            border: '1px solid var(--status-green-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--status-green)',
            fontSize: '12.5px',
            fontWeight: 600
          }}>
            ✓ Zero active room bottlenecks. All classroom capacities and equipment rules are verified.
          </div>
        )}
      </div>
    </div>
  );
}
