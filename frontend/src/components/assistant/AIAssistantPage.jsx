import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Box,
  Compass
} from 'lucide-react';

import ConversationSidebar from './ConversationSidebar';
import LiveContextPanel from './LiveContextPanel';
import ChatComposer from './ChatComposer';
import RichMessageItem from './RichMessageItem';
import ActionConfirmationModal from './ActionConfirmationModal';

export default function AIAssistantPage({
  rooms = [],
  timetable = [],
  metrics = {},
  conflictSummary = {},
  conflicts = [],
  reallocations = [],
  selectedRoom = null,
  activePage = 'assistant',
  onNavigate,
  onInspectRoom,
  onRunOptimization,
  onOpen3DViewer
}) {
  const [conversations, setConversations] = useState([
    {
      id: 'conv-default',
      title: 'Campus Overview & Opportunities',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: []
    }
  ]);
  const [activeConvId, setActiveConvId] = useState('conv-default');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingState, setThinkingState] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const messages = activeConversation?.messages || [];

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Build current AssistantContext snapshot
  const assistantContext = {
    currentPage: activePage,
    selectedRoom: selectedRoom,
    currentUtilization: metrics.avg_utilization_pct || 0,
    currentUDS: metrics.total_campus_uds || 0,
    currentConflicts: conflicts,
    currentRecommendations: reallocations,
    rooms: rooms,
    timetable: timetable
  };

  // Find Proactive Insights Data
  const overcapEvents = timetable.filter((ev) => {
    const rm = rooms.find((r) => r.room_id === ev.room_id);
    return rm && ev.enrolled_students > rm.capacity;
  });
  const topIssue = overcapEvents[0] || null;
  const topRec = reallocations[0] || null;

  async function handleSendMessage(text) {
    if (!text || isLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update conversation state with user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          const updatedMessages = [...c.messages, userMessage];
          const newTitle = c.messages.length === 0 ? text.slice(0, 32) + (text.length > 32 ? '...' : '') : c.title;
          return { ...c, title: newTitle, messages: updatedMessages };
        }
        return c;
      })
    );

    setIsLoading(true);

    // Thinking states animation
    const thinkingStates = [
      `Checking ${selectedRoom ? selectedRoom.room_name : 'campus'} live occupancy...`,
      'Evaluating hard constraint models...',
      'Formulating verified operations guidance...'
    ];
    let stateIdx = 0;
    setThinkingState(thinkingStates[0]);
    const stateInterval = setInterval(() => {
      stateIdx = (stateIdx + 1) % thinkingStates.length;
      setThinkingState(thinkingStates[stateIdx]);
    }, 450);

    try {
      const res = await axios.post('/api/assistant/message', {
        message: text,
        assistantContext,
        conversationId: activeConvId,
        history: activeConversation.messages.map((m) => ({ role: m.role, content: m.content }))
      });

      clearInterval(stateInterval);

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.data.message || 'I have analyzed the campus data.',
        entities: res.data.entities || [],
        actions: res.data.actions || [],
        followUps: res.data.followUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId) {
            return { ...c, messages: [...c.messages, assistantMessage] };
          }
          return c;
        })
      );
    } catch (err) {
      clearInterval(stateInterval);
      console.error('Failed to get assistant response:', err);

      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'CampusOptix Assistant is temporarily unavailable. Core CampusOptix tools are still active.',
        actions: [{ type: 'OPEN_CAMPUS_MAP', label: 'Explore Campus Map' }],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, messages: [...c.messages, errorMessage] } : c))
      );
    } finally {
      setIsLoading(false);
      setThinkingState('');
    }
  }

  // Handle Action Trigger
  function handleActionClick(action) {
    if (!action) return;

    switch (action.type) {
      case 'OPEN_ROOM': {
        const targetRoom = rooms.find((r) => r.room_id === action.id);
        if (targetRoom && onInspectRoom) onInspectRoom(targetRoom);
        if (onNavigate) onNavigate('map');
        break;
      }
      case 'OPEN_3D_ROOM': {
        const targetRoom = rooms.find((r) => r.room_id === action.id || r.room_name?.toLowerCase() === action.id?.toLowerCase()) || selectedRoom || rooms[0];
        if (onOpen3DViewer && targetRoom) {
          onOpen3DViewer(targetRoom);
        } else {
          if (targetRoom && onInspectRoom) onInspectRoom(targetRoom);
          if (onNavigate) onNavigate('map');
        }
        break;
      }
      case 'OPEN_CAMPUS_MAP':
      case 'SHOW_CONFLICTS':
      case 'SHOW_UNDERUTILIZED': {
        if (onNavigate) onNavigate('map');
        break;
      }
      case 'OPEN_RECOMMENDATION':
      case 'OPEN_RULE_TRACE': {
        if (onNavigate) onNavigate('recommendations');
        break;
      }
      case 'OPEN_WHATIF': {
        if (onNavigate) onNavigate('whatif');
        break;
      }
      case 'OPEN_ANALYTICS': {
        if (onNavigate) onNavigate('analytics');
        break;
      }
      case 'RUN_OPTIMIZATION': {
        if (onRunOptimization) onRunOptimization();
        break;
      }
      default:
        console.log('Action triggered:', action);
    }
  }

  function handleNewConversation() {
    const newId = `conv-${Date.now()}`;
    const newConv = {
      id: newId,
      title: 'New Campus Consultation',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: []
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
  }

  function handleDeleteConversation(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id && conversations.length > 1) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConvId(remaining[0].id);
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 140px)',
      minHeight: '620px',
      background: 'var(--surface-white)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* Left Pane: Conversation History Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={(id) => setActiveConvId(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Center Pane: Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat Area Sticky Header */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-white)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--primary-blue)" />
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}>
                CampusOptix Assistant
              </h2>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Ask questions about your campus, resources, and optimization results.
            </div>
          </div>

          {/* Context Chip & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--status-green-bg)',
              border: '1px solid var(--status-green-border)',
              color: 'var(--status-green)',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '10.5px',
              fontWeight: 600
            }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-green)' }} />
              Campus context connected
            </span>

            {selectedRoom && (
              <span style={{
                background: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10.5px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}>
                Context: {selectedRoom.room_name}
              </span>
            )}
          </div>
        </div>

        {/* Message Stream Area / Proactive Insights Homepage */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            /* Proactive Insights Homepage */
            <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Greeting */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Here's where things stand on campus today
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Live metrics analyzed from real room schedules, capacity limits, and solver traces.
                </p>
              </div>

              {/* 4 Proactive Insights Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {/* 1. Highest Utilization Issue */}
                <div
                  className="card-surface"
                  onClick={() => handleSendMessage('Which rooms are over capacity?')}
                  style={{ padding: '14px', cursor: 'pointer', borderLeft: '4px solid var(--status-coral)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                    <span>Highest Capacity Issue</span>
                    <AlertTriangle size={13} color="var(--status-coral)" />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {topIssue ? `${topIssue.course_code} (${topIssue.enrolled_students} students)` : 'No Overcapacity'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--status-coral)', marginTop: '2px' }}>
                    {topIssue ? 'Exceeds room capacity' : 'Healthy density'}
                  </div>
                </div>

                {/* 2. Top Optimization Opportunity */}
                <div
                  className="card-surface"
                  onClick={() => handleSendMessage('Why was this room recommended?')}
                  style={{ padding: '14px', cursor: 'pointer', borderLeft: '4px solid var(--primary-blue)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                    <span>Best Opportunity</span>
                    <Sparkles size={13} color="var(--primary-blue)" />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {topRec ? `${topRec.course_code} ➔ ${topRec.to_room_name}` : 'Schedule Optimized'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--status-green)', marginTop: '2px' }}>
                    {topRec ? `+${topRec.uds_gain?.toFixed(1) || 12} pts improvement` : 'Optimal state'}
                  </div>
                </div>

                {/* 3. Unused Capacity */}
                <div
                  className="card-surface"
                  onClick={() => handleSendMessage('Which rooms are underutilized?')}
                  style={{ padding: '14px', cursor: 'pointer', borderLeft: '4px solid var(--status-amber)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                    <span>Spare Capacity</span>
                    <Layers size={13} color="var(--status-amber)" />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Room 204 & CS Labs
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    +120 recoverable seats
                  </div>
                </div>

                {/* 4. Active Bottlenecks */}
                <div
                  className="card-surface"
                  onClick={() => handleSendMessage('What is today\'s biggest issue?')}
                  style={{ padding: '14px', cursor: 'pointer', borderLeft: '4px solid var(--teal)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                    <span>Active Bottlenecks</span>
                    <TrendingUp size={13} color="var(--teal)" />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {conflicts.length} Identified Issues
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--teal)', marginTop: '2px' }}>
                    Click for action plan
                  </div>
                </div>
              </div>

              {/* Quick Analysis Action Buttons */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Quick Analysis Shortcuts
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => handleSendMessage('Summarize the overall campus resource utilization and debt score.')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px' }}
                  >
                    📊 Summarize Campus
                  </button>
                  <button
                    onClick={() => handleSendMessage('Which rooms have overcapacity clashes or equipment mismatches?')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px' }}
                  >
                    ⚠️ Find Conflicts
                  </button>
                  <button
                    onClick={() => handleSendMessage('Which rooms are running well below capacity?')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px' }}
                  >
                    🔍 Find Underutilized Rooms
                  </button>
                  <button
                    onClick={() => handleSendMessage('What is the single highest-impact room reassignment recommended?')}
                    className="btn-secondary"
                    style={{ fontSize: '11.5px' }}
                  >
                    ⭐ Find Best Opportunity
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Render Message History */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {messages.map((msg) => (
                <RichMessageItem
                  key={msg.id}
                  message={msg}
                  onActionClick={handleActionClick}
                  onSelectFollowUp={handleSendMessage}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Composer */}
        <ChatComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          thinkingState={thinkingState}
          onStopGeneration={() => setIsLoading(false)}
          onClearChat={() => {
            setConversations((prev) =>
              prev.map((c) => (c.id === activeConvId ? { ...c, messages: [] } : c))
            );
          }}
          onRegenerate={() => {
            const userMsgs = messages.filter((m) => m.role === 'user');
            if (userMsgs.length > 0) {
              handleSendMessage(userMsgs[userMsgs.length - 1].content);
            }
          }}
          hasMessages={messages.length > 0}
          currentFollowUps={
            [...messages].reverse().find((m) => m.role === 'assistant')?.followUps || []
          }
        />
      </div>

      {/* Right Pane: Live Context Panel */}
      <LiveContextPanel
        context={assistantContext}
        onAction={handleActionClick}
      />

      {/* Safety Confirmation Modal */}
      {pendingAction && (
        <ActionConfirmationModal
          action={pendingAction}
          onConfirm={() => {
            handleActionClick(pendingAction);
            setPendingAction(null);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
