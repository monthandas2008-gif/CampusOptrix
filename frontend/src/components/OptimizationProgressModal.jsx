import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, ShieldCheck, Cpu } from 'lucide-react';

const STEPS = [
  'Loading campus timetable and physical room models...',
  'Evaluating room capacity and fire code safety constraints...',
  'Verifying laboratory equipment and hardware prerequisites...',
  'Checking teacher schedule availability and transit buffers...',
  'Formulating Google OR-Tools CP-SAT integer program...',
  'Searching globally optimal room reassignments...'
];

export default function OptimizationProgressModal({ isOpen, solveTimeMs, resultCount }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(23, 32, 51, 0.5)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3500
    }}>
      <div style={{
        background: 'var(--surface-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        width: '100%',
        maxWidth: '460px',
        animation: 'scaleIn 0.15s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-blue-light)',
            color: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={18} />
          </div>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              Optimizing Campus Schedule
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Executing Google OR-Tools CP-SAT integer program
            </p>
          </div>
        </div>

        {/* Step Progress List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '18px 0' }}>
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '11px',
                  color: isDone ? 'var(--status-green)' : isCurrent ? 'var(--primary-blue)' : 'var(--text-muted)',
                  fontWeight: isCurrent ? 600 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                {isDone ? (
                  <CheckCircle2 size={15} color="var(--status-green)" />
                ) : isCurrent ? (
                  <Loader2 size={15} color="var(--primary-blue)" className="pulse-dot" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--border-strong)',
                    marginLeft: '4px',
                    marginRight: '5px'
                  }} />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'var(--surface-muted)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '16px'
        }}>
          <div style={{
            width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
            height: '100%',
            background: 'var(--primary-blue)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
}
