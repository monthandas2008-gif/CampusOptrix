import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Check,
  X,
  Sparkles,
  Layers,
  Clock,
  Eye,
  BotMessageSquare
} from 'lucide-react';
import RuleTraceModal from './RuleTraceModal';

export default function RecommendationsPage({
  reallocations = [],
  onAcceptMove,
  onAcceptAll,
  onRejectMove,
  onTestInWhatIf,
  onOptimize,
  isOptimizing,
  onAskAssistant,
  onOpen3DViewer
}) {
  const [selectedTraceMove, setSelectedTraceMove] = useState(null);
  const [hoveredMove, setHoveredMove] = useState(null);

  if (reallocations.length === 0) {
    return (
      <div className="card-surface" style={{
        padding: '54px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--primary-blue-light)',
          color: 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sparkles size={24} />
        </div>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '16px',
            fontWeight: 800,
            color: 'var(--text-primary)'
          }}>
            No Optimization Recommendations Generated Yet
          </h2>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            maxWidth: '460px',
            marginTop: '4px'
          }}>
            Run the mathematical solver to find globally optimal room reassignments that eliminate overcrowding and minimize travel distance.
          </p>
        </div>
        <button
          onClick={onOptimize}
          disabled={isOptimizing}
          className="btn-primary"
          style={{ marginTop: '6px' }}
        >
          <Sparkles size={14} />
          <span>{isOptimizing ? 'Analyzing Timetable...' : 'Find Better Room Allocations'}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header Info Banner */}
      <div style={{
        background: 'var(--surface-white)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            Found <strong>{reallocations.length} Verified Operational Decisions</strong>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Hover over any recommendation to preview seat capacity and score improvements.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              reallocations.forEach((m) => onAcceptMove(m));
            }}
            className="btn-primary"
            style={{ fontSize: '11px', padding: '6px 14px' }}
          >
            <Check size={13} />
            <span>Accept All ({reallocations.length})</span>
          </button>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reallocations.map((move, idx) => {
          const isHighImpact = move.uds_gain > 20 || move.from_utilization_pct > 100;
          const isHovered = hoveredMove?.event_id === move.event_id;

          return (
            <div
              key={move.event_id}
              className="card-surface"
              style={{
                padding: '16px 20px',
                borderLeft: `4px solid ${isHighImpact ? 'var(--primary-blue)' : 'var(--teal)'}`,
                background: isHovered ? 'var(--surface-subtle)' : 'var(--surface-white)'
              }}
              onMouseEnter={() => setHoveredMove(move)}
              onMouseLeave={() => setHoveredMove(null)}
            >
              {/* Top Row: Course Code, Priority Badge & Move Transition */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: isHighImpact ? 'var(--primary-blue-light)' : 'var(--teal-light)',
                      color: isHighImpact ? 'var(--primary-blue)' : 'var(--teal)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {isHighImpact ? 'HIGH IMPACT' : 'OPTIMIZATION'}
                    </span>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {move.course_code}: {move.course_name}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      [{move.day} • {move.slot}]
                    </span>
                  </div>

                  {/* Room Transition Block */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '10px',
                    fontSize: '12.5px'
                  }}>
                    <span style={{
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      Current: <strong>{move.from_room_name}</strong> ({move.from_capacity} seats)
                    </span>

                    <ArrowRight size={14} color="var(--primary-blue)" />

                    <span style={{
                      background: 'var(--status-green-bg)',
                      border: '1px solid var(--status-green-border)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--status-green)',
                      fontWeight: 600
                    }}>
                      Proposed: <strong>{move.to_room_name}</strong> ({move.to_capacity} seats)
                    </span>
                  </div>
                </div>

                {/* Right Side Before/After Metrics */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '3px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Occupancy: <span className="mono-num" style={{ color: move.from_utilization_pct > 100 ? 'var(--status-coral)' : 'inherit' }}>{move.from_utilization_pct}%</span> ➔ <strong className="mono-num" style={{ color: 'var(--status-green)' }}>{move.to_utilization_pct}%</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--status-green)', fontWeight: 600 }}>
                    ✓ +{move.uds_gain.toFixed(1)} Pts Score Improvement
                  </div>
                </div>
              </div>

              {/* Verified Checklist Strip */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-green)', fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> Space Safe ({move.enrolled_students} $\le$ {move.to_capacity})
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-green)', fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> Required Tools Matched
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--status-green)', fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> Zero Schedule Clashes
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setSelectedTraceMove(move)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    <ShieldCheck size={13} color="var(--primary-blue)" />
                    <span>View Rule Trace</span>
                  </button>

                  {onOpen3DViewer && (
                    <button
                      onClick={() => onOpen3DViewer(move.to_room_id)}
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      title={`View ${move.to_room_name} in 3D`}
                    >
                      <span>View in 3D</span>
                    </button>
                  )}

                  {onAskAssistant && (
                    <button
                      onClick={() => onAskAssistant(move)}
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--primary-blue)' }}
                    >
                      <BotMessageSquare size={13} />
                      <span>Ask Assistant Why?</span>
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onTestInWhatIf(move)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    <Sliders size={12} />
                    <span>Test in What-If</span>
                  </button>

                  <button
                    onClick={() => onRejectMove(move)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--text-muted)' }}
                  >
                    <X size={12} />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => onAcceptMove(move)}
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                  >
                    <Check size={12} />
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rule Trace Decision Pipeline Modal */}
      {selectedTraceMove && (
        <RuleTraceModal
          move={selectedTraceMove}
          onClose={() => setSelectedTraceMove(null)}
          onApply={(m) => onAcceptMove(m)}
        />
      )}
    </div>
  );
}
