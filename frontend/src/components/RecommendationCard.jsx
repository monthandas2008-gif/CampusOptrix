import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, ShieldCheck, CheckCircle2, HelpCircle } from 'lucide-react';

export default function RecommendationCard({ move, index }) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const trace = move.rule_trace || {};

  return (
    <div style={{
      border: '1.5px solid var(--ink)',
      borderLeft: '6px solid var(--blueprint)',
      background: '#FFF',
      padding: '14px 18px',
      marginBottom: '14px',
      transition: 'all 0.15s ease'
    }}>
      {/* Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'var(--blueprint)',
              color: '#FFF',
              padding: '1px 6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700
            }}>
              SUGGESTED MOVE #{index + 1}
            </span>
            <span>{move.course_code}: {move.from_room_name}</span>
            <ArrowRight size={14} color="var(--blueprint)" />
            <span style={{ color: 'var(--signal-green)', fontWeight: 800 }}>{move.to_room_name}</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--ink-muted)',
              fontWeight: 600
            }}>
              [{move.day} • {move.slot}]
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: '#333',
            marginTop: '5px'
          }}>
            {move.narrative || `Reassigned ${move.course_code} to fix overcrowding and match equipment.`}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <div style={{ color: 'var(--signal-green)', fontWeight: 700 }}>
              ✓ Problem Resolved
            </div>
            <div style={{ color: 'var(--blueprint)', fontWeight: 600 }}>
              Seats: {move.enrolled_students}/{move.to_capacity} ({move.to_utilization_pct}%)
            </div>
          </div>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expandable Explanation: "Why This Change?" */}
      {isExpanded && (
        <div style={{
          marginTop: '14px',
          borderTop: '1px solid var(--paper-border)',
          paddingTop: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px'
        }}>
          <div style={{
            fontWeight: 700,
            color: 'var(--blueprint)',
            fontSize: '11px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldCheck size={14} /> WHY THIS ROOM WAS CHOSEN:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {trace.constraints_checked?.map((check, cIdx) => {
              const isResolved = check.status === 'RESOLVED' || check.status === 'SATISFIED' || check.status === 'IMPROVED';
              return (
                <div
                  key={cIdx}
                  style={{
                    background: '#FAF8F2',
                    border: '1px solid var(--paper-border)',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <span style={{
                    background: isResolved ? 'rgba(76, 122, 94, 0.2)' : 'rgba(201, 122, 46, 0.2)',
                    color: isResolved ? 'var(--signal-green)' : 'var(--signal-amber)',
                    border: `1px solid ${isResolved ? 'var(--signal-green)' : 'var(--signal-amber)'}`,
                    padding: '1px 5px',
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {isResolved ? '✓ PASSED' : '⚠️ CHECK'}
                  </span>

                  <div style={{ flex: 1, color: 'var(--ink)' }}>
                    <strong>{check.constraint}:</strong> {check.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
