import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  ArrowRight,
  Box,
  MapPin,
  ShieldCheck,
  Sliders,
  AlertTriangle,
  Play
} from 'lucide-react';

function renderActionIcon(type) {
  switch (type) {
    case 'OPEN_3D_ROOM':
      return <Box size={12} />;
    case 'OPEN_CAMPUS_MAP':
      return <MapPin size={12} />;
    case 'OPEN_RULE_TRACE':
      return <ShieldCheck size={12} />;
    case 'OPEN_WHATIF':
      return <Sliders size={12} />;
    case 'SHOW_CONFLICTS':
      return <AlertTriangle size={12} />;
    case 'RUN_OPTIMIZATION':
      return <Play size={12} />;
    default:
      return <ArrowRight size={12} />;
  }
}

// Simple markdown formatter for bold and code tokens
function formatMessageContent(text) {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          background: 'rgba(36, 87, 166, 0.08)',
          padding: '1px 4px',
          borderRadius: '3px',
          color: 'var(--primary-blue)'
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function RichMessageItem({
  message,
  onActionClick,
  onSelectFollowUp
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  function handleCopy() {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      padding: '14px 20px',
      background: isUser ? 'var(--surface-white)' : 'var(--surface-muted)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background 0.15s ease'
    }}>
      {/* Role Avatar */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: isUser ? 'var(--secondary-blue-light)' : 'var(--primary-blue)',
        color: isUser ? 'var(--primary-blue)' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>

      {/* Message Content & Action Row */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: isUser ? 'var(--text-primary)' : 'var(--primary-blue)' }}>
            {isUser ? 'You' : 'CampusOptrix Assistant'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {message.timestamp || ''}
            </span>
            <button
              onClick={handleCopy}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              title="Copy message"
            >
              {copied ? <Check size={12} color="var(--status-green)" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* Text Body */}
        <div style={{
          fontSize: '12.5px',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap'
        }}>
          {formatMessageContent(message.content)}
        </div>

        {/* Validated Inline Action Buttons */}
        {message.actions && message.actions.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {message.actions.map((act, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick && onActionClick(act)}
                style={{
                  background: 'var(--surface-white)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--primary-blue)',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-blue-light)';
                  e.currentTarget.style.borderColor = 'var(--primary-blue)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface-white)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                {renderActionIcon(act.type)}
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Contextual Follow-Up Suggestions directly under assistant message */}
        {!isUser && message.followUps && message.followUps.length > 0 && (
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
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
              gap: '4px'
            }}>
              <Sparkles size={11} color="var(--primary-blue)" />
              <span>Suggested Follow-Ups</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {message.followUps.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectFollowUp && onSelectFollowUp(q)}
                  style={{
                    background: 'var(--surface-white)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-blue-light)';
                    e.currentTarget.style.color = 'var(--primary-blue)';
                    e.currentTarget.style.borderColor = 'var(--primary-blue)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface-white)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
