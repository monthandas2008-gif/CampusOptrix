import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';

export default function RejectionModal({ timetable, rooms }) {
  const [selectedEventId, setSelectedEventId] = useState(timetable[0]?.event_id || '');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.room_id || '');
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAudit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/rejection-audit', {
        event_id: selectedEventId,
        candidate_room_id: selectedRoomId
      });
      setAuditResult(response.data);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      border: '2px solid var(--ink)',
      background: '#FFF',
      padding: '18px 22px',
      marginBottom: '25px'
    }}>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '16px',
        fontWeight: 800,
        color: 'var(--ink)',
        textTransform: 'uppercase',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <HelpCircle size={18} color="var(--blueprint)" />
        ROOM CHECKER ("WHY CAN'T I USE THIS ROOM?")
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-muted)', marginBottom: '16px' }}>
        Wondering why a specific room was not chosen for a class? Select the class and room below to instantly see which safety or equipment rules prevented the move.
      </div>

      <form onSubmit={handleAudit} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Select Class:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          >
            {timetable.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.course_code}: {ev.course_name} ({ev.day} {ev.slot} • {ev.enrolled_students} students)
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            Select Room to Check:
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1.5px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          >
            {rooms.map((r) => (
              <option key={r.room_id} value={r.room_id}>
                {r.room_name} ({r.building} • Capacity: {r.capacity} seats)
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--blueprint)',
            color: '#FFF',
            border: '2px solid var(--ink)',
            padding: '7px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Checking...' : 'Check Room Suitability'}
        </button>
      </form>

      {auditResult && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          border: '1.5px solid var(--ink)',
          background: auditResult.is_valid ? 'var(--signal-green-bg)' : 'var(--signal-amber-bg)',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px'
        }}>
          {auditResult.is_valid ? (
            <div style={{ color: 'var(--signal-green)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span><strong>✓ ROOM IS SUITABLE:</strong> {auditResult.candidate_room} has enough space, all required equipment, and is completely free at this time.</span>
            </div>
          ) : (
            <div>
              <div style={{ color: 'var(--signal-red)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontWeight: 700 }}>
                <XCircle size={18} />
                <span>✕ CANNOT USE {auditResult.candidate_room} DUE TO THE FOLLOWING REASONS:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '24px', color: 'var(--ink)' }}>
                {auditResult.reasons?.map((reason, rIdx) => (
                  <li key={rIdx} style={{ marginTop: '3px' }}><strong>{reason}</strong></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
