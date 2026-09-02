import React from 'react';
import {
  LayoutDashboard,
  Map,
  Sparkles,
  Sliders,
  BarChart2,
  CalendarPlus,
  Building2,
  CheckCircle2,
  Search,
  BotMessageSquare
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'map', label: 'Campus Map', icon: Map },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles, badgeKey: 'reallocations' },
  { id: 'whatif', label: 'What-If Simulator', icon: Sliders },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'assistant', label: 'AI Assistant', icon: BotMessageSquare },
  { id: 'schedule', label: 'Schedule Event', icon: CalendarPlus }
];

export default function Sidebar({ activePage, onNavigate, reallocationsCount = 0, onOpenCommandPalette }) {
  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: 'var(--surface-white)',
      borderRight: '1px solid var(--border-color)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0
    }}>
      {/* Brand Header */}
      <div>
        <div style={{
          padding: '22px 20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-blue)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px'
            }}>
              C
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '0.2px',
                color: 'var(--text-primary)',
                lineHeight: 1.1
              }}>
                CampusOptrix
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '8.5px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.4px',
                marginTop: '3px'
              }}>
                SMART CAMPUS OPTIMIZER
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search Shortcut Button */}
        <div style={{ padding: '14px 12px 6px 12px' }}>
          <button
            onClick={onOpenCommandPalette}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.1s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={13} color="var(--text-muted)" />
              <span>Quick Search...</span>
            </div>
            <kbd style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              background: 'var(--surface-white)',
              border: '1px solid var(--border-color)',
              padding: '1px 4px',
              borderRadius: '3px',
              color: 'var(--text-muted)'
            }}>
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '10px 12px' }}>
          <div style={{
            fontSize: '9.5px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '0 8px 6px 8px'
          }}>
            Operations
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              const hasBadge = item.badgeKey === 'reallocations' && reallocationsCount > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive ? 'var(--primary-blue-light)' : 'transparent',
                    color: isActive ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12.5px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={15} color={isActive ? 'var(--primary-blue)' : 'var(--text-secondary)'} />
                    <span>{item.label}</span>
                  </div>

                  {hasBadge && (
                    <span style={{
                      background: 'var(--primary-blue)',
                      color: '#FFF',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {reallocationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Bottom Campus Status Block with Live Pulse */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--surface-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Building2 size={14} color="var(--primary-blue)" />
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Central Campus
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '10px',
          color: 'var(--status-green)',
          fontWeight: 600,
          marginTop: '4px'
        }}>
          <span className="pulse-dot" style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--status-green)',
            display: 'inline-block'
          }} />
          SYSTEM OPERATIONAL
        </div>
      </div>
    </aside>
  );
}
