import React, { useState } from 'react';
import axios from 'axios';
import {
  Shield,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Cpu
} from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import RequestAccessModal from './RequestAccessModal';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRoleTab, setSelectedRoleTab] = useState('admin');
  const [emailOrId, setEmailOrId] = useState('admin@campusoptix.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // Switch role tab and prefill demo credentials for smooth evaluation
  function handleRoleTabChange(role) {
    setSelectedRoleTab(role);
    setError(null);
    if (role === 'admin') {
      setEmailOrId('admin@campusoptix.edu');
      setPassword('admin123');
    } else if (role === 'faculty') {
      setEmailOrId('faculty@campusoptix.edu');
      setPassword('faculty123');
    } else if (role === 'student') {
      setEmailOrId('student@campusoptix.edu');
      setPassword('student123');
    }
  }

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', {
        emailOrId: emailOrId.trim(),
        password,
        selectedTabRole: selectedRoleTab
      });

      if (res.data.success && res.data.user) {
        if (rememberMe) {
          localStorage.setItem('campusoptix_session_token', res.data.token);
        } else {
          sessionStorage.setItem('campusoptix_session_token', res.data.token);
        }
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      console.error('Login error:', err);
      const errMsg = err.response?.data?.error || 'Authentication service is unavailable. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-canvas)',
      color: 'var(--text-primary)'
    }}>
      {/* Container with responsive split */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        minHeight: '100vh',
        flexWrap: 'wrap'
      }}>
        {/* LEFT: Branding & Capabilities Panel */}
        <div style={{
          flex: '1 1 480px',
          background: 'linear-gradient(145deg, #1B3B6F 0%, #2457A6 60%, #1E4482 100%)',
          color: '#FFFFFF',
          padding: '48px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle architectural grid decoration */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            pointerEvents: 'none'
          }} />

          {/* Top Brand Header */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: '#FFFFFF',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '20px',
                boxShadow: 'var(--shadow-md)'
              }}>
                C
              </div>
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                  color: '#FFFFFF',
                  lineHeight: 1.1
                }}>
                  CampusOptix
                </h1>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  color: 'var(--sky-blue)',
                  letterSpacing: '0.6px',
                  marginTop: '2px'
                }}>
                  SMART CAMPUS RESOURCE OPTIMIZER
                </div>
              </div>
            </div>

            <div style={{ marginTop: '48px' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '28px',
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#FFFFFF',
                maxWidth: '460px'
              }}>
                Intelligent Spatial Scheduling & Operations Optimization
              </h2>
              <p style={{
                fontSize: '13.5px',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.6,
                marginTop: '14px',
                maxWidth: '460px'
              }}>
                Deterministic constraint satisfaction, real-time room capacity telemetry, and explainable operations for universities and research institutions.
              </p>
            </div>
          </div>

          {/* 3 Core Capability Highlight Cards */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '12px', margin: '36px 0' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(69, 169, 112, 0.25)',
                color: '#6EE7B7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>Live Occupancy & 3D Viewer</strong>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '1px' }}>
                  Real-time seat telemetry, density heatmaps, and spatial room views.
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(91, 141, 239, 0.25)',
                color: '#93C5FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>OR-Tools CP-SAT Solver</strong>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '1px' }}>
                  Mathematical optimization minimizing utilization debt and travel.
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(213, 161, 58, 0.25)',
                color: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>Context-Aware AI Assistant</strong>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.75)', marginTop: '1px' }}>
                  Grounded operations intelligence answering questions and explaining Rule Traces.
                </div>
              </div>
            </div>
          </div>

          {/* Footer Badge */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
            <Building2 size={14} />
            <span>Central Campus Operational System v1.0 • Enterprise Edition</span>
          </div>
        </div>

        {/* RIGHT: Login Card Panel */}
        <div style={{
          flex: '1 1 480px',
          background: 'var(--surface-white)',
          padding: '48px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--primary-blue)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}>
                Institutional Gateway
              </span>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '4px'
              }}>
                Sign in to your workspace
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Select your institutional role and enter authorized credentials.
              </p>
            </div>

            {/* Role Tab Selector (Cosmetic hint only per §0) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              gap: '4px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => handleRoleTabChange('admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: selectedRoleTab === 'admin' ? 'var(--surface-white)' : 'transparent',
                  color: selectedRoleTab === 'admin' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  fontWeight: selectedRoleTab === 'admin' ? 700 : 500,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  boxShadow: selectedRoleTab === 'admin' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('faculty')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: selectedRoleTab === 'faculty' ? 'var(--surface-white)' : 'transparent',
                  color: selectedRoleTab === 'faculty' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  fontWeight: selectedRoleTab === 'faculty' ? 700 : 500,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  boxShadow: selectedRoleTab === 'faculty' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <GraduationCap size={13} />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabChange('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: selectedRoleTab === 'student' ? 'var(--surface-white)' : 'transparent',
                  color: selectedRoleTab === 'student' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  fontWeight: selectedRoleTab === 'student' ? 700 : 500,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  boxShadow: selectedRoleTab === 'student' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <Users size={13} />
                <span>Student</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div style={{
                background: 'var(--status-coral-bg)',
                border: '1px solid var(--status-coral-border)',
                color: 'var(--status-coral)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '16px',
                lineHeight: 1.4
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                  {selectedRoleTab === 'admin' ? 'Administrator Email or ID' : selectedRoleTab === 'faculty' ? 'Faculty Email or ID' : 'Student Email or ID'}
                </label>
                <input
                  type="text"
                  autoComplete="email"
                  placeholder={selectedRoleTab === 'admin' ? 'admin@campusoptix.edu' : selectedRoleTab === 'faculty' ? 'faculty@campusoptix.edu' : 'student@campusoptix.edu'}
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
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--primary-blue)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 12px',
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-blue)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '11.5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Keep me signed in on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '9px 16px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  marginTop: '4px'
                }}
              >
                {loading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span>Sign In to {selectedRoleTab === 'admin' ? 'Campus Admin' : selectedRoleTab === 'faculty' ? 'Faculty Portal' : 'Student Portal'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Request Access & Help Row */}
            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11.5px',
              color: 'var(--text-secondary)'
            }}>
              <span>New to CampusOptix?</span>
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(true)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--primary-blue)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Request Access
              </button>
            </div>

            {/* Judge / Quick Demo Credentials Helper */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: 'var(--surface-muted)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                ⚡ Quick Demo Credentials
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('admin')}
                  style={{
                    background: selectedRoleTab === 'admin' ? 'var(--primary-blue-light)' : 'var(--surface-white)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary-blue)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Admin (Dr. Vance)
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange('faculty')}
                  style={{
                    background: selectedRoleTab === 'faculty' ? 'var(--primary-blue-light)' : 'var(--surface-white)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary-blue)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Faculty (Prof. Chen)
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange('student')}
                  style={{
                    background: selectedRoleTab === 'student' ? 'var(--primary-blue-light)' : 'var(--surface-white)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--primary-blue)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Student (Alex Rivera)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
      <RequestAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />
    </div>
  );
}
