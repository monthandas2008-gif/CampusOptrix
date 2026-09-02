import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  Clock,
  Sparkles
} from 'lucide-react';

export default function ConversationSidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      width: '260px',
      minWidth: '260px',
      background: 'var(--surface-muted)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Top Header & New Conversation Button */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={onNewConversation}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px 12px' }}
        >
          <Plus size={14} />
          <span>New Conversation</span>
        </button>

        {/* Search Conversations Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface-white)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          marginTop: '10px'
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '11px',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: '4px 8px',
          marginBottom: '4px'
        }}>
          Recent Discussions
        </div>

        {filteredConversations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--surface-white)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--border-color)' : 'transparent'}`,
                    cursor: 'pointer',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <MessageSquare size={13} color={isActive ? 'var(--primary-blue)' : 'var(--text-muted)'} />
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.title || 'Campus Consultation'}
                    </span>
                  </div>

                  {onDeleteConversation && conversations.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                      title="Delete discussion"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
            No matching discussions.
          </div>
        )}
      </div>
    </div>
  );
}
