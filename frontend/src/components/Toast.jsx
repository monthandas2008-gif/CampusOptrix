import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: 'var(--surface)',
      border: `1px solid ${isSuccess ? 'var(--status-green)' : isError ? 'var(--status-red)' : 'var(--primary-blue)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 9999,
      maxWidth: '380px',
      animation: 'slideUp 0.2s ease-out'
    }}>
      {isSuccess && <CheckCircle2 size={16} color="var(--status-green)" />}
      {isError && <AlertCircle size={16} color="var(--status-red)" />}
      {!isSuccess && !isError && <Info size={16} color="var(--primary-blue)" />}

      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>
        {message}
      </span>

      <button
        onClick={onClose}
        style={{
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
