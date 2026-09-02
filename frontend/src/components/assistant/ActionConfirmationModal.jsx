import React from 'react';
import { ShieldAlert, ArrowRight, Check, X } from 'lucide-react';

export default function ActionConfirmationModal({
  action,
  onConfirm,
  onCancel
}) {
  if (!action) return null;

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
      zIndex: 3000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-white)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-modal)',
        width: '100%',
        maxWidth: '460px',
        padding: '24px',
        border: '1px solid var(--border-color)',
        animation: 'scaleIn 0.15s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '8px' }}>
          <ShieldAlert size={18} />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Confirmation Required
          </span>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '16px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>
          Apply Schedule Allocation Change?
        </h3>

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
          The assistant is requesting to apply a verified room reassignment to the live timetable.
        </p>

        {action.payload && (
          <div style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            marginBottom: '18px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {action.payload.course_code || 'Target Class'}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              marginTop: '4px'
            }}>
              <span>{action.payload.from_room || 'Current Room'}</span>
              <ArrowRight size={12} color="var(--primary-blue)" />
              <strong style={{ color: 'var(--status-green)' }}>{action.payload.to_room || 'Target Room'}</strong>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancel} className="btn-secondary" style={{ fontSize: '11.5px' }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary" style={{ fontSize: '11.5px' }}>
            <Check size={13} />
            <span>Apply Change</span>
          </button>
        </div>
      </div>
    </div>
  );
}
