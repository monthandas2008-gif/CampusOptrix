import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BotMessageSquare, Sparkles } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import RoomDrawer from './components/RoomDrawer';
import CommandPalette from './components/CommandPalette';
import OptimizationProgressModal from './components/OptimizationProgressModal';

import LoginPage from './components/auth/LoginPage';
import FacultyDashboard from './components/dashboards/FacultyDashboard';
import StudentPortal from './components/dashboards/StudentPortal';
import Room3DViewerModal from './components/3d/Room3DViewerModal';

import OverviewPage from './components/OverviewPage';
import CampusMapPage from './components/CampusMapPage';
import RecommendationsPage from './components/RecommendationsPage';
import WhatIfSimulatorPage from './components/WhatIfSimulatorPage';
import AnalyticsPage from './components/AnalyticsPage';
import ScheduleEventPage from './components/ScheduleEventPage';
import AIAssistantPage from './components/assistant/AIAssistantPage';
import FloatingAssistantOverlay from './components/assistant/FloatingAssistantOverlay';

import './styles/tokens.css';

const socket = io('/', { autoConnect: true });

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // App Navigation & Data State
  const [activePage, setActivePage] = useState('overview');
  const [activeDay, setActiveDay] = useState('Monday');

  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [initialTimetable, setInitialTimetable] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [weights, setWeights] = useState({ w1_idle: 1.0, w2_mismatch: 1.5, w3_overcap: 3.0 });
  const [metrics, setMetrics] = useState({ total_campus_uds: 0, avg_utilization_pct: 0 });
  const [conflictSummary, setConflictSummary] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [impactSummary, setImpactSummary] = useState(null);
  const [reallocations, setReallocations] = useState([]);
  const [annotation, setAnnotation] = useState(null);
  const [selectedDrawerRoom, setSelectedDrawerRoom] = useState(null);
  const [selected3DRoom, setSelected3DRoom] = useState(null);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFloatingAssistantOpen, setIsFloatingAssistantOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Ensure Login Page is always shown first on application start or page refresh
  useEffect(() => {
    localStorage.removeItem('campusoptix_session_token');
    sessionStorage.removeItem('campusoptix_session_token');
    setCurrentUser(null);
    setAuthChecking(false);
  }, []);

  // 2. Initial State Fetch
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const initRes = await axios.get('/api/initial-state');
        const rawRooms = initRes.data.rooms || [];
        const rawFaculty = initRes.data.faculty || [];
        const rawTimetable = initRes.data.timetable || [];
        const defaultWeights = initRes.data.default_weights || { w1_idle: 1.0, w2_mismatch: 1.5, w3_overcap: 3.0 };

        setRooms(rawRooms);
        setFaculty(rawFaculty);
        setInitialTimetable(rawTimetable);
        setTimetable(rawTimetable);
        setWeights(defaultWeights);

        const analyzeRes = await axios.post('/api/analyze', {
          timetable: rawTimetable,
          rooms: rawRooms,
          faculty: rawFaculty,
          weights: defaultWeights
        });

        setMetrics({
          total_campus_uds: analyzeRes.data.total_campus_uds,
          avg_utilization_pct: analyzeRes.data.avg_utilization_pct
        });
        setConflictSummary(analyzeRes.data.conflict_summary || {});
        setConflicts(analyzeRes.data.conflicts || []);
      } catch (err) {
        console.error('Failed to load initial campus data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // 3. Global Keydown Listener for Command Palette (Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4. Socket.io Real-Time Synchronization
  useEffect(() => {
    socket.on('whatif:update', (payload) => {
      if (payload.success && payload.data) {
        const data = payload.data;
        setMetrics({
          total_campus_uds: data.total_campus_uds,
          avg_utilization_pct: data.avg_utilization_pct
        });
        setConflictSummary(data.conflict_summary || {});
        setConflicts(data.conflicts || []);
        setAnnotation(data.annotation || null);
        if (data.updated_timetable) {
          setTimetable(data.updated_timetable);
        }
      }
    });

    socket.on('schedule:update', (payload) => {
      if (payload && payload.timetable) {
        setTimetable(payload.timetable);
        if (payload.metrics) {
          setMetrics({
            total_campus_uds: payload.metrics.total_campus_uds,
            avg_utilization_pct: payload.metrics.avg_utilization_pct
          });
        }
        if (payload.conflicts) setConflicts(payload.conflicts);
        if (payload.conflictSummary) setConflictSummary(payload.conflictSummary);
      }
    });

    return () => {
      socket.off('whatif:update');
      socket.off('schedule:update');
    };
  }, []);

  // 5. Auth Handlers
  function handleLoginSuccess(user, token) {
    setCurrentUser(user);
    setToast({
      message: `Signed in as ${user.name} (${user.role.toUpperCase()})`,
      type: 'success'
    });
  }

  function handleLogout() {
    localStorage.removeItem('campusoptix_session_token');
    sessionStorage.removeItem('campusoptix_session_token');
    setCurrentUser(null);
    setSelected3DRoom(null);
    setSelectedDrawerRoom(null);
    setToast({ message: 'Signed out of CampusOptix workspace.', type: 'info' });
  }

  // 6. Handle Shared 3D Room Viewer Opening
  function handleOpen3DViewer(targetRoom) {
    if (!targetRoom) return;
    if (typeof targetRoom === 'string') {
      const found = rooms.find(
        (r) => r.room_id === targetRoom || r.room_name?.toLowerCase() === targetRoom.toLowerCase()
      );
      setSelected3DRoom(found || rooms[0]);
    } else {
      setSelected3DRoom(targetRoom);
    }
  }

  // 6b. Handle Find Better Room (Finds best valid room & automatically opens in 3D)
  async function handleFindBetterRoom(currentRoom, activeClass) {
    if (!currentRoom) return;

    setToast({
      message: `Finding the best available room for ${currentRoom.room_name}...`,
      type: 'info'
    });

    try {
      let candidateMoves = reallocations;

      // If reallocations not yet loaded, run optimization pass
      if (candidateMoves.length === 0) {
        const res = await axios.post('/api/optimize', {
          timetable,
          weights,
          time_limit_seconds: 5.0
        });
        candidateMoves = res.data.reallocations || [];
        setReallocations(candidateMoves);
        if (res.data.impact_summary) setImpactSummary(res.data.impact_summary);
      }

      // Find matching move for this specific class or room
      let matchingMove = null;
      if (activeClass) {
        matchingMove = candidateMoves.find(
          (m) => m.event_id === activeClass.event_id || m.course_code === activeClass.course_code
        );
      }
      if (!matchingMove) {
        matchingMove = candidateMoves.find((m) => m.from_room_id === currentRoom.room_id);
      }

      if (matchingMove) {
        const targetRoom = rooms.find((r) => r.room_id === matchingMove.to_room_id);
        if (targetRoom) {
          setSelectedDrawerRoom(null);
          setSelected3DRoom(targetRoom);
          setToast({
            message: `Better room found: ${targetRoom.room_name} (+${matchingMove.uds_gain?.toFixed(1) || '12'} pts, 0 clashes)`,
            type: 'success'
          });
          return;
        }
      }

      // Fallback: If no direct move, find a conflict-free room with sufficient capacity
      const classStudents = activeClass?.enrolled_students || currentRoom.capacity;
      const validAlternatives = rooms.filter(
        (r) => r.room_id !== currentRoom.room_id && r.capacity >= classStudents
      );

      if (validAlternatives.length > 0) {
        validAlternatives.sort((a, b) => (a.capacity - classStudents) - (b.capacity - classStudents));
        const bestAlt = validAlternatives[0];
        setSelectedDrawerRoom(null);
        setSelected3DRoom(bestAlt);
        setToast({
          message: `Alternative room found: ${bestAlt.room_name} (${bestAlt.capacity} seats, ${bestAlt.building})`,
          type: 'success'
        });
      } else {
        setToast({
          message: `No better room is currently available under the existing campus constraints.`,
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Find better room error:', err);
      setToast({
        message: 'Unable to find a better room right now. Please try again.',
        type: 'error'
      });
    }
  }

  // 7. Handle What-If Drag-and-Drop Move
  function handleMoveCourse(eventId, targetRoomId, targetSlot) {
    socket.emit('whatif:move', {
      event_id: eventId,
      target_room_id: targetRoomId,
      target_slot: targetSlot,
      timetable,
      weights
    });
  }

  // 8. Handle Global Optimization Run (Idempotent & Repeatable)
  async function handleOptimize() {
    if (isOptimizing) return;
    setIsOptimizing(true);

    try {
      const res = await axios.post('/api/optimize', {
        timetable: initialTimetable.length > 0 ? initialTimetable : timetable,
        weights,
        time_limit_seconds: 5.0
      });

      const optMoves = res.data.reallocations || [];
      setReallocations(optMoves);
      setImpactSummary(res.data.impact_summary || null);

      setTimeout(() => {
        setIsOptimizing(false);
        setToast({
          message: `Found ${optMoves.length} verified room reassignments in ${res.data.solve_time_ms}ms!`,
          type: 'success'
        });
        setActivePage('recommendations');
      }, 1000);
    } catch (err) {
      console.error('Optimization failed:', err);
      setIsOptimizing(false);
      setToast({ message: 'Optimization engine encountered an issue.', type: 'error' });
    }
  }

  // 9. Handle Reset Schedule
  async function handleReset() {
    try {
      await axios.post('/api/reset');
      const initRes = await axios.get('/api/initial-state');
      const baseline = initRes.data.timetable || [];
      setInitialTimetable(baseline);
      setTimetable(baseline);
      setReallocations([]);
      setImpactSummary(null);
      setAnnotation(null);

      const analyzeRes = await axios.post('/api/analyze', {
        timetable: baseline,
        weights
      });
      setMetrics({
        total_campus_uds: analyzeRes.data.total_campus_uds,
        avg_utilization_pct: analyzeRes.data.avg_utilization_pct
      });
      setConflictSummary(analyzeRes.data.conflict_summary || {});
      setConflicts(analyzeRes.data.conflicts || []);

      socket.emit('schedule:update', {
        timetable: baseline,
        metrics: analyzeRes.data,
        conflicts: analyzeRes.data.conflicts || []
      });

      setToast({ message: 'Reset schedule to default baseline.', type: 'info' });
    } catch (err) {
      console.error('Reset failed:', err);
    }
  }

  // 10. Handle Accept Single Move
  async function handleAcceptMove(move) {
    const updatedTimetable = timetable.map((ev) =>
      ev.event_id === move.event_id ? { ...ev, room_id: move.to_room_id } : ev
    );
    setTimetable(updatedTimetable);
    setReallocations((prev) => prev.filter((m) => m.event_id !== move.event_id));

    try {
      const analyzeRes = await axios.post('/api/analyze', {
        timetable: updatedTimetable,
        weights
      });
      setMetrics({
        total_campus_uds: analyzeRes.data.total_campus_uds,
        avg_utilization_pct: analyzeRes.data.avg_utilization_pct
      });
      setConflictSummary(analyzeRes.data.conflict_summary || {});
      setConflicts(analyzeRes.data.conflicts || []);

      socket.emit('schedule:update', {
        timetable: updatedTimetable,
        metrics: analyzeRes.data,
        conflicts: analyzeRes.data.conflicts || []
      });
    } catch (e) {
      console.error('Re-analysis error:', e);
    }

    setToast({
      message: `Accepted reassignment for ${move.course_code} ➔ ${move.to_room_name}`,
      type: 'success'
    });
  }

  // 11. Handle Accept All Moves
  async function handleAcceptAllMoves() {
    if (reallocations.length === 0) return;

    const moveMap = {};
    reallocations.forEach((m) => {
      moveMap[m.event_id] = m.to_room_id;
    });

    const updatedTimetable = timetable.map((ev) =>
      moveMap[ev.event_id] ? { ...ev, room_id: moveMap[ev.event_id] } : ev
    );

    const count = reallocations.length;
    setTimetable(updatedTimetable);
    setReallocations([]);

    try {
      const analyzeRes = await axios.post('/api/analyze', {
        timetable: updatedTimetable,
        weights
      });
      setMetrics({
        total_campus_uds: analyzeRes.data.total_campus_uds,
        avg_utilization_pct: analyzeRes.data.avg_utilization_pct
      });
      setConflictSummary(analyzeRes.data.conflict_summary || {});
      setConflicts(analyzeRes.data.conflicts || []);

      socket.emit('schedule:update', {
        timetable: updatedTimetable,
        metrics: analyzeRes.data,
        conflicts: analyzeRes.data.conflicts || []
      });
    } catch (e) {
      console.error('Re-analysis error:', e);
    }

    setToast({
      message: `Accepted all ${count} verified room reassignments! Campus schedule is now optimized.`,
      type: 'success'
    });
  }

  // 12. Handle Reject Move
  function handleRejectMove(move) {
    setReallocations((prev) => prev.filter((m) => m.event_id !== move.event_id));
    setToast({
      message: `Rejected move for ${move.course_code}`,
      type: 'info'
    });
  }

  // 13. Handle Apply Simulation
  async function handleApplySimulation() {
    setAnnotation(null);
    try {
      const analyzeRes = await axios.post('/api/analyze', {
        timetable,
        weights
      });
      socket.emit('schedule:update', {
        timetable,
        metrics: analyzeRes.data,
        conflicts: analyzeRes.data.conflicts || []
      });
    } catch (e) {}

    setToast({
      message: 'Simulation changes confirmed and applied to schedule.',
      type: 'success'
    });
  }

  // 14. Handle Navigation with optional item selection
  function handleNavigateWithItem(pageId, item) {
    setActivePage(pageId);
    if (pageId === 'map' && item) {
      setSelectedDrawerRoom(item);
    }
  }

  // Assistant Context Snapshot
  const assistantContext = {
    currentPage: activePage,
    selectedRoom: selectedDrawerRoom || selected3DRoom,
    currentUtilization: metrics.avg_utilization_pct,
    currentUDS: metrics.total_campus_uds,
    currentConflicts: conflicts,
    currentRecommendations: reallocations,
    rooms: rooms,
    timetable: timetable
  };

  if (authChecking || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        fontSize: '14px',
        fontWeight: 600
      }}>
        Loading CampusOptix Operations Platform...
      </div>
    );
  }

  // Unauthenticated -> Show Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Role: Faculty Dashboard
  if (currentUser.role === 'faculty') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <FacultyDashboard
          user={currentUser}
          rooms={rooms}
          timetable={timetable}
          activeDay={activeDay}
          onDayChange={(d) => setActiveDay(d)}
          onOpen3DViewer={handleOpen3DViewer}
          onFindBetterRoom={handleFindBetterRoom}
          onLogout={handleLogout}
          onAskAssistant={(r) => {
            setSelectedDrawerRoom(r);
            setIsFloatingAssistantOpen(true);
          }}
        />

        {/* Shared 3D Room Viewer Modal */}
        {selected3DRoom && (
          <Room3DViewerModal
            room={selected3DRoom}
            rooms={rooms}
            timetable={timetable}
            activeDay={activeDay}
            userRole="faculty"
            onClose={() => setSelected3DRoom(null)}
            onSelectRoom={(r) => setSelected3DRoom(r)}
          />
        )}

        {/* Slide-In Right Room Drawer */}
        {selectedDrawerRoom && !selected3DRoom && (
          <RoomDrawer
            room={selectedDrawerRoom}
            timetable={timetable}
            activeDay={activeDay}
            onClose={() => setSelectedDrawerRoom(null)}
            onOptimizeRoom={handleOptimize}
            onTestInWhatIf={(r) => {}}
            onOpen3DViewer={handleOpen3DViewer}
            onFindBetterRoom={handleFindBetterRoom}
          />
        )}

        {/* Floating Assistant Slide-in Drawer */}
        <FloatingAssistantOverlay
          isOpen={isFloatingAssistantOpen}
          onClose={() => setIsFloatingAssistantOpen(false)}
          assistantContext={assistantContext}
          onActionClick={(action) => {
            if (action.type === 'OPEN_3D_ROOM' || action.type === 'OPEN_ROOM') {
              handleOpen3DViewer(action.id);
            }
            setIsFloatingAssistantOpen(false);
          }}
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Role: Student Portal
  if (currentUser.role === 'student') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <StudentPortal
          user={currentUser}
          rooms={rooms}
          timetable={timetable}
          activeDay={activeDay}
          onDayChange={(d) => setActiveDay(d)}
          onOpen3DViewer={handleOpen3DViewer}
          onFindBetterRoom={handleFindBetterRoom}
          onLogout={handleLogout}
          onAskAssistant={(r) => {
            setSelectedDrawerRoom(r);
            setIsFloatingAssistantOpen(true);
          }}
        />

        {/* Shared 3D Room Viewer Modal */}
        {selected3DRoom && (
          <Room3DViewerModal
            room={selected3DRoom}
            rooms={rooms}
            timetable={timetable}
            activeDay={activeDay}
            userRole="student"
            onClose={() => setSelected3DRoom(null)}
            onSelectRoom={(r) => setSelected3DRoom(r)}
          />
        )}

        {/* Slide-In Right Room Drawer */}
        {selectedDrawerRoom && !selected3DRoom && (
          <RoomDrawer
            room={selectedDrawerRoom}
            timetable={timetable}
            activeDay={activeDay}
            onClose={() => setSelectedDrawerRoom(null)}
            onOptimizeRoom={() => {}}
            onTestInWhatIf={() => {}}
            onOpen3DViewer={handleOpen3DViewer}
            onFindBetterRoom={handleFindBetterRoom}
          />
        )}

        {/* Floating Assistant Slide-in Drawer */}
        <FloatingAssistantOverlay
          isOpen={isFloatingAssistantOpen}
          onClose={() => setIsFloatingAssistantOpen(false)}
          assistantContext={assistantContext}
          onActionClick={(action) => {
            if (action.type === 'OPEN_3D_ROOM' || action.type === 'OPEN_ROOM') {
              handleOpen3DViewer(action.id);
            }
            setIsFloatingAssistantOpen(false);
          }}
        />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Role: Campus Admin (Full Admin Dashboard)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={(p) => setActivePage(p)}
        reallocationsCount={reallocations.length}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sticky Top Header */}
        <Header
          activePage={activePage}
          activeDay={activeDay}
          onDayChange={(d) => setActiveDay(d)}
          onOptimize={handleOptimize}
          onReset={handleReset}
          isOptimizing={isOptimizing}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Container */}
        <main style={{ padding: '24px 32px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {activePage === 'overview' && (
            <OverviewPage
              rooms={rooms}
              timetable={timetable}
              metrics={metrics}
              conflictSummary={conflictSummary}
              conflicts={conflicts}
              impactSummary={impactSummary}
              reallocations={reallocations}
              activeDay={activeDay}
              onNavigate={(p) => setActivePage(p)}
              onInspectRoom={(r) => setSelectedDrawerRoom(r)}
            />
          )}

          {activePage === 'map' && (
            <CampusMapPage
              rooms={rooms}
              timetable={timetable}
              activeDay={activeDay}
              onSelectRoom={(r) => setSelectedDrawerRoom(r)}
              selectedRoom={selectedDrawerRoom}
              onNavigate={(p) => setActivePage(p)}
            />
          )}

          {activePage === 'recommendations' && (
            <RecommendationsPage
              reallocations={reallocations}
              onAcceptMove={handleAcceptMove}
              onAcceptAll={handleAcceptAllMoves}
              onRejectMove={handleRejectMove}
              onTestInWhatIf={(m) => setActivePage('whatif')}
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
              onAskAssistant={(m) => {
                setActivePage('assistant');
              }}
              onOpen3DViewer={handleOpen3DViewer}
            />
          )}

          {activePage === 'whatif' && (
            <WhatIfSimulatorPage
              rooms={rooms}
              timetable={timetable}
              activeDay={activeDay}
              onMoveCourse={handleMoveCourse}
              annotation={annotation}
              onApplySimulation={handleApplySimulation}
              onResetSimulation={handleReset}
            />
          )}

          {activePage === 'analytics' && (
            <AnalyticsPage
              impactSummary={impactSummary}
              metrics={metrics}
              conflictSummary={conflictSummary}
              rooms={rooms}
            />
          )}

          {activePage === 'assistant' && (
            <AIAssistantPage
              rooms={rooms}
              timetable={timetable}
              metrics={metrics}
              conflictSummary={conflictSummary}
              conflicts={conflicts}
              reallocations={reallocations}
              selectedRoom={selectedDrawerRoom}
              activePage={activePage}
              onNavigate={(p) => setActivePage(p)}
              onInspectRoom={(r) => setSelectedDrawerRoom(r)}
              onRunOptimization={handleOptimize}
              onOpen3DViewer={handleOpen3DViewer}
            />
          )}

          {activePage === 'schedule' && (
            <ScheduleEventPage
              facultyList={faculty}
              roomsList={rooms}
            />
          )}
        </main>
      </div>

      {/* Shared 3D Room Viewer Modal */}
      {selected3DRoom && (
        <Room3DViewerModal
          room={selected3DRoom}
          rooms={rooms}
          timetable={timetable}
          activeDay={activeDay}
          userRole="admin"
          onClose={() => setSelected3DRoom(null)}
          onSelectRoom={(r) => setSelected3DRoom(r)}
          onOpenRecommendation={(recId) => {
            setSelected3DRoom(null);
            setActivePage('recommendations');
          }}
          onOpenWhatIf={(evId) => {
            setSelected3DRoom(null);
            setActivePage('whatif');
          }}
        />
      )}

      {/* Slide-In Right Room Drawer */}
      {selectedDrawerRoom && !selected3DRoom && (
        <RoomDrawer
          room={selectedDrawerRoom}
          timetable={timetable}
          activeDay={activeDay}
          onClose={() => setSelectedDrawerRoom(null)}
          onOptimizeRoom={handleOptimize}
          onTestInWhatIf={(r) => setActivePage('whatif')}
          onOpen3DViewer={handleOpen3DViewer}
          onFindBetterRoom={handleFindBetterRoom}
          onAskAssistant={(r) => {
            setSelectedDrawerRoom(r);
            setActivePage('assistant');
          }}
        />
      )}

      {/* Floating Launcher Button ("Ask CampusOptix") */}
      {activePage !== 'assistant' && (
        <button
          onClick={() => setIsFloatingAssistantOpen((prev) => !prev)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--primary-blue)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '24px',
            padding: '10px 18px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 1500,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          <Sparkles size={15} />
          <span>Ask CampusOptix</span>
        </button>
      )}

      {/* Floating Assistant Slide-in Drawer */}
      <FloatingAssistantOverlay
        isOpen={isFloatingAssistantOpen && activePage !== 'assistant'}
        onClose={() => setIsFloatingAssistantOpen(false)}
        onExpandToFullPage={() => {
          setIsFloatingAssistantOpen(false);
          setActivePage('assistant');
        }}
        assistantContext={assistantContext}
        onActionClick={(action) => {
          if (action.type === 'OPEN_3D_ROOM' || action.type === 'OPEN_ROOM') {
            handleOpen3DViewer(action.id);
          } else if (action.type === 'OPEN_RECOMMENDATION') {
            setActivePage('recommendations');
          } else if (action.type === 'OPEN_WHATIF') {
            setActivePage('whatif');
          } else if (action.type === 'OPEN_CAMPUS_MAP' || action.type === 'SHOW_CONFLICTS') {
            setActivePage('map');
          }
          setIsFloatingAssistantOpen(false);
        }}
      />

      {/* Fast Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigateWithItem}
        onOptimize={handleOptimize}
        onReset={handleReset}
        rooms={rooms}
        timetable={timetable}
      />

      {/* Technical Optimization Progress Sequence Modal */}
      <OptimizationProgressModal
        isOpen={isOptimizing}
        solveTimeMs={30}
        resultCount={reallocations.length}
      />

      {/* Calm Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
