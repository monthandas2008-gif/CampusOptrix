import React from 'react';
import { Calendar, Play, RotateCcw, Building, Sparkles, Search, LogOut, User } from 'lucide-react';

const PAGE_META = {
  overview: {
    title: 'Campus Overview',
    subtitle: 'A clear view of campus room utilization, conflicts, and optimization opportunities.'
  },
  map: {
    title: 'Campus Floor Plan & Rooms',
    subtitle: 'Inspect physical space, room capacities, equipment, and live scheduled classes.'
  },
  recommendations: {
    title: 'Optimization Recommendations',
    subtitle: 'Verified room changes that eliminate bottlenecks and improve capacity.'
  },
  whatif: {
    title: 'Scenario Planner & Sandbox',
    subtitle: 'Drag & drop classes between rooms and time slots to test schedule changes before applying them.'
  },
  analytics: {
    title: 'Impact & Utilization Analytics',
    subtitle: 'Measurable before-and-after improvements in seat capacity, transit, and schedule efficiency.'
  },
  assistant: {
    title: 'AI Operations Assistant',
    subtitle: 'Context-aware intelligence answering questions and executing verified actions.'
  },
  schedule: {
    title: 'Schedule a New Class or Event',
    subtitle: 'Find optimal, conflict-free candidate rooms matching your student strength and equipment.'
  }
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function Header({
  activePage,
  activeDay,
  onDayChange,
  onOptimize,
  onReset,
  isOptimizing,
  onOpenCommandPalette,
  currentUser,
  onLogout
}) {
  const meta = PAGE_META[activePage] || PAGE_META.overview;

  return (
    <header style={{
      background: 'var(--surface-white)',
      borderBottom: '1px solid var(--border-color)',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      {/* Page Title & Plain-Language Subtitle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '0.2px'
          }}>
            {meta.title}
          </h1>
          <span style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '1px 6px',
            color: 'var(--primary-blue)',
            fontWeight: 600
          }}>
            MAIN CAMPUS // SCIENCE & TECH
          </span>
        </div>
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          marginTop: '2px'
        }}>
          {meta.subtitle}
        </p>
      </div>

      {/* Controls & Primary Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Day Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px'
        }}>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => onDayChange(day)}
              style={{
                border: 'none',
                background: activeDay === day ? 'var(--surface-white)' : 'transparent',
                color: activeDay === day ? 'var(--primary-blue)' : 'var(--text-secondary)',
                fontWeight: activeDay === day ? 600 : 500,
                fontSize: '11px',
                padding: '4px 9px',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: activeDay === day ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.1s ease'
              }}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Reset Action */}
        <button
          onClick={onReset}
          className="btn-secondary"
          title="Reset to default campus timetable"
          style={{ padding: '6px 12px', fontSize: '11px' }}
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOptimize}
          disabled={isOptimizing}
          className="btn-primary"
          style={{ padding: '7px 16px', fontSize: '12px' }}
        >
          <Sparkles size={13} />
          <span>{isOptimizing ? 'Optimizing...' : 'Find Better Allocation'}</span>
        </button>

        {/* User Profile & Logout */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '10px',
            borderLeft: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--primary-blue-light)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11px'
            }}>
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>

            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: '10.5px', color: 'var(--status-coral)' }}
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
