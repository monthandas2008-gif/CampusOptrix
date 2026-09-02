import React, { useState } from 'react';
import axios from 'axios';
import { X, KeyRound, CheckCircle2, Send, AlertCircle } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [emailOrId, setEmailOrId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!emailOrId.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { emailOrId });
      setMessage(res.data.message || 'Reset link dispatched.');
      setIsSubmitted(true);
    } catch (err) {
      setMessage('If an active account exists with that identifier, a secure reset confirmation link has been dispatched to your institutional email.');
      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

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
      zIndex: 4000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-white)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-modal)',
        width: '100%',
        maxWidth: '440px',
        padding: '24px',
        animation: 'scaleIn 0.15s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)' }}>
            <KeyRound size={18} />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Reset Password
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--status-green-bg)',
              color: 'var(--status-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Check Your Inbox
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              {message}
            </p>
            <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Enter your institutional email address or Employee/Student ID to receive password recovery instructions.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Institutional Email or ID
              </label>
              <input
                type="text"
                placeholder="e.g. admin@campusoptix.edu or FAC-01"
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} className="btn-secondary" style={{ fontSize: '12px' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading || !emailOrId.trim()} className="btn-primary" style={{ fontSize: '12px' }}>
                <Send size={13} />
                <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
