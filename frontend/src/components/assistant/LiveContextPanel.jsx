import React from 'react';
import {
  Layers,
  Users,
  Wrench,
  Building,
  Sparkles,
  Sliders,
  Box,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function LiveContextPanel({
  context = {},
  onAction
}) {
  const selectedRoom = context.selectedRoom;
  const currentPage = context.currentPage || 'overview';
  const utilization = context.currentUtilization || 0;
  const uds = context.currentUDS || 0;
  const conflictsCount = context.currentConflicts?.length || 0;
  const recommendationsCount = context.currentRecommendations?.length || 0;

  return (
    <div style={{
      width: '320px',
      minWidth: '320px',
      background: 'var(--surface-white)',
      borderLeft: '1px solid var(--border-color)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflowY: 'auto',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div>
        {/* Header */}
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>LIVE CONTEXT SNAPSHOT</span>
          <span style={{
            fontSize: '9.5px',
            color: 'var(--primary-blue)',
            fontFamily: 'var(--font-mono)',
            background: 'var(--primary-blue-light)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {currentPage.toUpperCase()}
          </span>
        </div>

        {/* Selected Room Details */}
        {selectedRoom ? (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {selectedRoom.room_name}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--primary-blue)',
                fontWeight: 600,
                marginTop: '1px'
              }}>
                {selectedRoom.room_id} // {selectedRoom.building}
              </div>
            </div>

            {/* Room Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Capacity</div>
                <div className="mono-num" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedRoom.capacity} seats
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Tools</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedRoom.equipment_list?.length || 0} installed
                </div>
              </div>
            </div>

            {/* Equipment Tag List */}
            {selectedRoom.equipment_list?.length > 0 && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Installed Equipment
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedRoom.equipment_list.map((eq) => (
                    <span
                      key={eq}
                      style={{
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border-color)',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        fontSize: '10px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      ✓ {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            margin: '16px 0',
            padding: '14px 12px',
            background: 'var(--surface-muted)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
            fontSize: '11.5px',
            color: 'var(--text-secondary)'
          }}>
            No specific room currently focused. The assistant answers with whole-campus context.
          </div>
        )}

        {/* Global Campus Metrics Summary */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Campus Metrics
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Overall Room Usage</span>
              <strong className="mono-num" style={{ color: 'var(--primary-blue)' }}>{utilization.toFixed(1)}%</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Optimization Debt (UDS)</span>
              <strong className="mono-num">{uds.toFixed(1)} pts</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Active Bottlenecks</span>
              <span className="mono-num" style={{ color: conflictsCount > 0 ? 'var(--status-coral)' : 'var(--status-green)', fontWeight: 700 }}>
                {conflictsCount} issues
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Verified Decisions</span>
              <span className="mono-num" style={{ color: 'var(--teal)', fontWeight: 700 }}>
                {recommendationsCount} ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Context Actions wired to existing handlers */}
      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {selectedRoom && (
          <>
            <button
              onClick={() => onAction?.({ type: 'OPEN_3D_ROOM', id: selectedRoom.room_id })}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
            >
              <Box size={13} />
              <span>View {selectedRoom.room_name} in 3D</span>
            </button>

            <button
              onClick={() => onAction?.({ type: 'OPEN_CAMPUS_MAP', id: selectedRoom.room_id })}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
            >
              <MapPin size={13} />
              <span>Locate on 2D Floor Plan</span>
            </button>
          </>
        )}

        <button
          onClick={() => onAction?.({ type: 'OPEN_RECOMMENDATION' })}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
        >
          <Sparkles size={13} />
          <span>Find Better Allocations</span>
        </button>

        <button
          onClick={() => onAction?.({ type: 'OPEN_WHATIF' })}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
        >
          <Sliders size={13} />
          <span>Open Simulator</span>
        </button>
      </div>
    </div>
  );
}
