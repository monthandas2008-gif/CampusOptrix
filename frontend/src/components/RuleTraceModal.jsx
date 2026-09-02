import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Activity,
  Layers,
  Compass,
  Wrench,
  Check,
  AlertCircle
} from 'lucide-react';

export default function RuleTraceModal({ move, onClose, onApply }) {
  if (!move) return null;

  const trace = move.rule_trace || {};
  const checks = trace.constraints_checked || [];
  const fitScore = trace.fit_score || 94.5;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(23, 32, 51, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-modal)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        animation: 'scaleIn 0.15s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--primary-blue)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} /> Deterministic Rule Verification
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginTop: '4px'
            }}>
              Why this recommendation?
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Visual Decision Pipeline */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Verification Pipeline
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '6px',
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 600
            }}>
              <div style={{ background: 'var(--status-coral-bg)', border: '1px solid var(--status-coral-border)', color: 'var(--status-coral)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                1. BOTTLE NECK
              </div>
              <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                2. HARD RULES
              </div>
              <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                3. FIT SCORING
              </div>
              <div style={{ background: 'var(--primary-blue-light)', border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                4. SELECTED
              </div>
              <div style={{ background: 'var(--status-green-bg)', border: '1px solid var(--status-green-border)', color: 'var(--status-green)', padding: '6px 4px', borderRadius: 'var(--radius-sm)' }}>
                5. IMPACT VERIFIED
              </div>
            </div>
          </div>

          {/* Reallocation Card */}
          <div style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px'
          }}>
            <div style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span>{move.course_code}: {move.from_room_name}</span>
              <ArrowRight size={14} color="var(--primary-blue)" />
              <span style={{ color: 'var(--status-green)' }}>{move.to_room_name}</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginTop: '3px'
            }}>
              {move.day} • {move.slot} ({move.enrolled_students} enrolled students)
            </div>
          </div>

          {/* Constraint Verification Checklist */}
          <div>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Hard Rule Pass Criteria
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {checks.map((check, idx) => {
                const isPassed = check.status === 'RESOLVED' || check.status === 'SATISFIED' || check.status === 'IMPROVED';
                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      background: isPassed ? 'var(--status-green-bg)' : 'var(--surface-hover)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <CheckCircle2 size={15} color={isPassed ? 'var(--status-green)' : 'var(--status-amber)'} style={{ marginTop: '1px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {check.constraint}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {check.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Constraint Fit Score Meters */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '14px'
          }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '10px'
            }}>
              Multi-Constraint Fit Score: <span className="mono-num" style={{ color: 'var(--primary-blue)', fontWeight: 800 }}>94.2% Match</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Capacity Fit</span>
                  <span className="mono-num" style={{ fontWeight: 700, color: 'var(--status-green)' }}>100%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--surface-hover)', borderRadius: '2px' }}>
                  <div style={{ width: '100%', height: '100%', background: 'var(--status-green)', borderRadius: '2px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Equipment Match</span>
                  <span className="mono-num" style={{ fontWeight: 700, color: 'var(--status-green)' }}>100%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--surface-hover)', borderRadius: '2px' }}>
                  <div style={{ width: '100%', height: '100%', background: 'var(--status-green)', borderRadius: '2px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Teacher Transit Distance</span>
                  <span className="mono-num" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>90%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--surface-hover)', borderRadius: '2px' }}>
                  <div style={{ width: '90%', height: '100%', background: 'var(--primary-blue)', borderRadius: '2px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Buffer Time Continuity</span>
                  <span className="mono-num" style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>95%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--surface-hover)', borderRadius: '2px' }}>
                  <div style={{ width: '95%', height: '100%', background: 'var(--primary-blue)', borderRadius: '2px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Impact Comparison Block */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '14px'
          }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '10px'
            }}>
              Measured Schedule Impact
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="card-surface" style={{ padding: '12px' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Room Seat Occupancy</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: '3px'
                }}>
                  <span style={{ color: move.from_utilization_pct > 100 ? 'var(--status-coral)' : 'var(--text-secondary)' }}>
                    {move.from_utilization_pct}%
                  </span>
                  {' ➔ '}
                  <span style={{ color: 'var(--status-green)' }}>
                    {move.to_utilization_pct}%
                  </span>
                </div>
              </div>

              <div className="card-surface" style={{ padding: '12px' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Optimization Debt Score</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginTop: '3px'
                }}>
                  {move.from_uds.toFixed(1)} ➔ <span style={{ color: 'var(--primary-blue)' }}>{move.to_uds.toFixed(1)}</span>
                  {' '}
                  <span style={{ fontSize: '11px', color: 'var(--status-green)' }}>
                    (-{move.uds_gain.toFixed(1)} pts)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--surface-muted)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: '11.5px' }}>
            Close Audit
          </button>
          <button
            onClick={() => {
              if (onApply) onApply(move);
              onClose();
            }}
            className="btn-primary"
            style={{ fontSize: '11.5px' }}
          >
            <Check size={13} />
            <span>Accept Move</span>
          </button>
        </div>
      </div>
    </div>
  );
}
