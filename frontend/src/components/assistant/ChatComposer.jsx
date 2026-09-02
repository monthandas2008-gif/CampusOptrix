import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  RefreshCw,
  Trash2,
  HelpCircle
} from 'lucide-react';

export default function ChatComposer({
  onSendMessage,
  isLoading,
  thinkingState,
  onStopGeneration,
  onClearChat,
  onRegenerate,
  hasMessages,
  currentPage = 'overview',
  selectedRoom = null,
  selectedRecommendation = null,
  currentFollowUps = []
}) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);

  // Context-Adaptive Recommended Questions
  let defaultPrompts = [
    'What should I improve first?',
    'Which rooms are underutilized?',
    'Which rooms are over capacity?',
    "What is today's overall utilization?",
    "Give me a summary of today's campus."
  ];

  if (selectedRoom) {
    defaultPrompts = [
      `How full is ${selectedRoom.room_name || 'this room'}?`,
      `Why is ${selectedRoom.room_name || 'this room'} recommended or flagged?`,
      `Show ${selectedRoom.room_name || 'this room'}'s equipment.`,
      `What classes are scheduled in ${selectedRoom.room_name || 'this room'}?`
    ];
  } else if (currentPage === 'recommendations' || selectedRecommendation) {
    defaultPrompts = [
      'Why is this the top recommendation?',
      "What's the impact if I apply this?",
      'What should I improve first?',
      'Explain the Rule Trace for this recommendation.'
    ];
  } else if (currentPage === 'whatif') {
    defaultPrompts = [
      'Is this change better than the current setup?',
      'What happens to UDS if I apply this?',
      'What conflicts exist today?',
      'Which rooms can fit 50 students at 2 PM?'
    ];
  } else if (currentPage === 'map') {
    defaultPrompts = [
      'Which rooms are free right now?',
      "Show me today's conflicts.",
      'Which room is most underutilized?',
      'Show Lab A in 3D.'
    ];
  }

  // Use dynamic follow-ups from the latest turn if available, else defaultPrompts
  const displayedPrompts = (currentFollowUps && currentFollowUps.length > 0)
    ? currentFollowUps
    : defaultPrompts;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  }

  function handleSelectPrompt(question) {
    if (isLoading) return;
    onSendMessage(question);
  }

  return (
    <div style={{
      borderTop: '1px solid var(--border-color)',
      background: 'var(--surface-white)',
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Contextual Thinking State Indicator */}
      {isLoading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--primary-blue)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span className="pulse-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary-blue)',
            display: 'inline-block'
          }} />
          <span>{thinkingState || 'Analyzing live campus data and retrieving real records...'}</span>
        </div>
      )}

      {/* Persistent Follow-Up & Suggested Inquiries Bar (NEVER Hidden) */}
      <div>
        <div style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Sparkles size={11} color="var(--primary-blue)" />
          <span>{hasMessages && currentFollowUps.length > 0 ? 'Contextual Follow-Ups' : 'Suggested Questions'}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {displayedPrompts.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(q)}
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '11.5px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-blue-light)';
                e.currentTarget.style.color = 'var(--primary-blue)';
                e.currentTarget.style.borderColor = 'var(--primary-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-muted)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea Input Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface-muted)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '6px 12px',
        gap: '8px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Ask anything about rooms, occupancy, utilization, or recommendations..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '12.5px',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            resize: 'none',
            lineHeight: '1.4',
            maxHeight: '120px'
          }}
        />

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isLoading ? (
            <button
              onClick={onStopGeneration}
              style={{
                border: '1px solid var(--status-coral)',
                background: 'var(--status-coral-bg)',
                color: 'var(--status-coral)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Square size={12} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="btn-primary"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                opacity: inputValue.trim() ? 1 : 0.45,
                cursor: inputValue.trim() ? 'pointer' : 'default'
              }}
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Utility Row */}
      {hasMessages && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            )}
            {onClearChat && (
              <button
                onClick={onClearChat}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <Trash2 size={11} /> Clear chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
