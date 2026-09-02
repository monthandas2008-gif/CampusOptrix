import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  X,
  Maximize2,
  Send,
  MessageSquare
} from 'lucide-react';
import RichMessageItem from './RichMessageItem';

export default function FloatingAssistantOverlay({
  isOpen,
  onClose,
  onExpandToFullPage,
  assistantContext = {},
  onActionClick
}) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Hello! I am your CampusOptrix Assistant. Ask me anything about room capacity, conflicts, recommendations, or 3D spatial models.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { type: 'SHOW_CONFLICTS', label: 'Check Conflicts' },
        { type: 'OPEN_RECOMMENDATION', label: 'Review Recommendations' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  async function handleSend(textOverride) {
    const textToSend = (typeof textOverride === 'string' ? textOverride : inputValue).trim();
    if (!textToSend || isLoading) return;

    setInputValue('');

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await axios.post('/api/assistant/message', {
        message: textToSend,
        assistantContext,
        conversationId: 'overlay-session',
        history: messages.map((m) => ({ role: m.role, content: m.content }))
      });

      const assistantMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.data.message || 'I have analyzed the campus data.',
        entities: res.data.entities || [],
        actions: res.data.actions || [],
        followUps: res.data.followUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed to get overlay response:', err);
      const errorMsg = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'CampusOptrix Assistant is temporarily unavailable. Core CampusOptrix tools are still active.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const currentFollowUps = [...messages].reverse().find((m) => m.role === 'assistant')?.followUps || [];

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '380px',
      height: '540px',
      background: 'var(--surface-white)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-modal)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      overflow: 'hidden',
      animation: 'slideUp 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--primary-blue)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#FFFFFF" />
          <strong style={{ fontSize: '13px' }}>Ask CampusOptrix</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onExpandToFullPage && (
            <button
              onClick={onExpandToFullPage}
              style={{ border: 'none', background: 'transparent', color: '#FFFFFF', cursor: 'pointer', padding: '3px' }}
              title="Expand to Full Page"
            >
              <Maximize2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: '#FFFFFF', cursor: 'pointer', padding: '3px' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-canvas)' }}>
        {messages.map((msg) => (
          <RichMessageItem
            key={msg.id}
            message={msg}
            onActionClick={onActionClick}
            onSelectFollowUp={handleSend}
          />
        ))}
        {isLoading && (
          <div style={{ padding: '12px 16px', fontSize: '11px', color: 'var(--primary-blue)', fontFamily: 'var(--font-mono)' }}>
            <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-blue)', display: 'inline-block', marginRight: '6px' }} />
            Analyzing campus models...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Follow-Up Chips */}
      {currentFollowUps.length > 0 && (
        <div style={{
          padding: '6px 12px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-muted)',
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {currentFollowUps.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              style={{
                background: 'var(--surface-white)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '3px 8px',
                fontSize: '10.5px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Composer Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--surface-white)',
        display: 'flex',
        gap: '6px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Ask a question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={isLoading}
          style={{
            flex: 1,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '11.5px',
            outline: 'none',
            background: 'var(--surface-muted)'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isLoading}
          className="btn-primary"
          style={{ padding: '6px 10px', fontSize: '11px' }}
        >
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
