import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Map,
  Sparkles,
  Sliders,
  BarChart2,
  CalendarPlus,
  RotateCcw,
  Building,
  BookOpen,
  ArrowRight,
  X
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOptimize,
  onReset,
  rooms = [],
  timetable = []
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown handler for Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build searchable items list
  const pages = [
    { id: 'overview', title: 'Campus Overview', category: 'Navigation', icon: LayoutDashboard },
    { id: 'map', title: 'Campus Map & Floor Plan', category: 'Navigation', icon: Map },
    { id: 'recommendations', title: 'Optimization Recommendations', category: 'Navigation', icon: Sparkles },
    { id: 'whatif', title: 'Scenario Planner (Test Moves)', category: 'Navigation', icon: Sliders },
    { id: 'analytics', title: 'Analytics & Utilization', category: 'Navigation', icon: BarChart2 },
    { id: 'schedule', title: 'Schedule a New Class', category: 'Navigation', icon: CalendarPlus }
  ];

  const actions = [
    { id: 'action-optimize', title: 'Run Optimization Engine', category: 'Action', icon: Sparkles, action: onOptimize },
    { id: 'action-reset', title: 'Reset Schedule to Baseline', category: 'Action', icon: RotateCcw, action: onReset }
  ];

  // Distinct rooms
  const roomItems = rooms.map((r) => ({
    id: `room-${r.room_id}`,
    title: `${r.room_name} (${r.building} • ${r.capacity} seats)`,
    category: 'Rooms',
    icon: Building,
    action: () => onNavigate('map', r)
  }));

  // Distinct courses
  const courseMap = new Map();
  for (const ev of timetable) {
    if (!courseMap.has(ev.course_code)) {
      courseMap.set(ev.course_code, ev);
    }
  }
  const courseItems = Array.from(courseMap.values()).map((c) => ({
    id: `course-${c.course_code}`,
    title: `${c.course_code}: ${c.course_name} (${c.enrolled_students} students)`,
    category: 'Courses',
    icon: BookOpen,
    action: () => onNavigate('whatif', c)
  }));

  const allItems = [...pages, ...actions, ...roomItems, ...courseItems];

  const filteredItems = query.trim() === ''
    ? allItems.slice(0, 10)
    : allItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12);

  function handleSelect(item) {
    if (item.action) {
      item.action();
    } else if (item.category === 'Navigation') {
      onNavigate(item.id);
    }
    onClose();
  }

  function handleKeyDownList(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  }

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
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '12vh',
      zIndex: 3000
    }}>
      <div style={{
        background: 'var(--surface-white)',
        width: '100%',
        maxWidth: '560px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        animation: 'scaleIn 0.15s ease-out'
      }}>
        {/* Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <Search size={18} color="var(--primary-blue)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search campus rooms, classes, or jump to page... (e.g. 'Lab', 'Overview')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownList}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              background: 'transparent'
            }}
          />
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
            <X size={16} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--primary-blue-light)' : 'transparent',
                    color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={15} color={isSelected ? 'var(--primary-blue)' : 'var(--text-secondary)'} />
                    <span style={{ fontWeight: isSelected ? 600 : 500 }}>{item.title}</span>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--primary-blue)' : 'var(--text-muted)',
                    background: isSelected ? 'rgba(36, 87, 166, 0.12)' : 'var(--surface-muted)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    {item.category}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              No campus records match "{query}"
            </div>
          )}
        </div>

        {/* Command Palette Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>Use <b>↑ ↓</b> to navigate</span>
          <span>Press <b>ENTER</b> to select</span>
          <span>Press <b>ESC</b> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
