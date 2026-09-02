import React from 'react';
import { Layers, Activity, AlertTriangle, Clock, Compass, CheckCircle2 } from 'lucide-react';

export default function ImpactSummary({ metrics, conflictSummary, impactSummary }) {
  const avgUtil = metrics?.avg_utilization_pct ?? 0;
  const critConflicts = conflictSummary?.critical_count ?? 0;
  const underutilized = conflictSummary?.underutilized_count ?? 0;
  const hoursReclaimed = impactSummary?.hours_reclaimed_weekly ?? 0;
  const seatsUnlocked = impactSummary?.seats_unlocked ?? 0;
  const travelSaved = impactSummary?.faculty_travel_saved_meters ?? 0;
  const problemsFixed = impactSummary ? (impactSummary.critical_conflicts_before - impactSummary.critical_conflicts_after) : 0;

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Title Block */}
      <div style={{
        border: '2px solid var(--ink)',
        background: '#FAF8F2',
        padding: '14px 20px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '1.2px',
            color: 'var(--ink)',
            textTransform: 'uppercase'
          }}>
            CampusOptix // Smart Classroom & Lab Allocator
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--blueprint)',
            fontWeight: 600,
            marginTop: '4px'
          }}>
            SPIDERVERSE HACKATHON 2026 • AUTOMATED ROOM SCHEDULING & SPACE MANAGEMENT
          </div>
        </div>

        <div style={{
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--ink)',
          lineHeight: '1.4'
        }}>
          <div>CAMPUS STATUS: <strong style={{ color: critConflicts > 0 ? 'var(--signal-amber)' : 'var(--signal-green)' }}>
            {critConflicts > 0 ? `${critConflicts} PROBLEMS FOUND` : '✓ ALL RULES SATISFIED'}
          </strong></div>
          <div>MODE: <strong>SAFE & VERIFIED ALLOCATION</strong></div>
        </div>
      </div>

      {/* 5 Simple Administrator Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Metric 1: Room Usage */}
        <div style={{
          border: '1.5px solid var(--blueprint)',
          background: '#FFF',
          padding: '12px 14px'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--blueprint)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Layers size={14} /> Room Usage
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: '4px'
          }}>
            {avgUtil.toFixed(1)}%
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--ink-muted)',
            marginTop: '2px'
          }}>
            Target: 60% – 95% of seats used
          </div>
        </div>

        {/* Metric 2: Problems Found */}
        <div style={{
          border: '1.5px solid var(--blueprint)',
          background: '#FFF',
          padding: '12px 14px'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--blueprint)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={14} /> Problems Found
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 700,
            color: critConflicts > 0 ? 'var(--signal-amber)' : 'var(--signal-green)',
            marginTop: '4px'
          }}>
            {critConflicts}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: critConflicts > 0 ? 'var(--signal-amber)' : 'var(--signal-green)',
            marginTop: '2px',
            fontWeight: 600
          }}>
            {critConflicts > 0 ? 'Overcrowded / Missing equipment' : '✓ Zero room issues'}
          </div>
        </div>

        {/* Metric 3: Underused Rooms */}
        <div style={{
          border: '1.5px solid var(--blueprint)',
          background: '#FFF',
          padding: '12px 14px'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--blueprint)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Activity size={14} /> Rooms Not Fully Used
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: '4px'
          }}>
            {underutilized}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--ink-muted)',
            marginTop: '2px'
          }}>
            Large halls with &lt;30% attendance
          </div>
        </div>

        {/* Metric 4: Seats Unlocked & Better Used */}
        <div style={{
          border: '1.5px solid var(--blueprint)',
          background: '#FFF',
          padding: '12px 14px'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--blueprint)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Clock size={14} /> Capacity Unlocked
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--signal-green)',
            marginTop: '4px'
          }}>
            +{seatsUnlocked} seats
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--signal-green)',
            marginTop: '2px',
            fontWeight: 600
          }}>
            {hoursReclaimed > 0 ? `${hoursReclaimed} wasted hours saved/week` : 'Saved from overcrowding'}
          </div>
        </div>

        {/* Metric 5: Teacher Walking Saved */}
        <div style={{
          border: '1.5px solid var(--blueprint)',
          background: '#FFF',
          padding: '12px 14px'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--blueprint)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Compass size={14} /> Teacher Transit Saved
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: '4px'
          }}>
            {travelSaved} m
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--signal-green)',
            marginTop: '2px',
            fontWeight: 600
          }}>
            Cross-campus sprints avoided
          </div>
        </div>
      </div>

      {/* Before vs After Impact Alert Bar (If optimization was run) */}
      {impactSummary && (
        <div style={{
          marginTop: '12px',
          border: '1.5px solid var(--signal-green)',
          background: 'var(--signal-green-bg)',
          padding: '10px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <CheckCircle2 size={16} color="var(--signal-green)" />
          <span>
            <strong>SCHEDULE IMPROVEMENT SUMMARY:</strong>
            {' '}Room usage changed from <b>{impactSummary.avg_utilization_before.toFixed(1)}%</b> to <b>{impactSummary.avg_utilization_after.toFixed(1)}%</b>.
            {' '}<b>{problemsFixed} problems fixed</b> (Overcapacity & equipment mismatches eliminated).
            {' '}<b>{seatsUnlocked} student seats</b> now comfortably accommodated.
          </span>
        </div>
      )}
    </div>
  );
}
