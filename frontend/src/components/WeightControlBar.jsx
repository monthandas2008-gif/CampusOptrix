import React from 'react';
import { Sliders, Play, RotateCcw } from 'lucide-react';

export default function WeightControlBar({
  weights,
  onWeightChange,
  onOptimize,
  onReset,
  isOptimizing,
  solveTime
}) {
  return (
    <div style={{
      border: '1.5px solid var(--ink)',
      background: '#FAF8F2',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '13px',
          color: 'var(--ink)'
        }}>
          <Sliders size={16} color="var(--blueprint)" />
          ROOM IMPORTANCE SETTINGS:
        </div>

        {/* w1: Avoid Empty Space */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            Avoid Empty Space: <span style={{ color: 'var(--blueprint)', fontWeight: 700 }}>{weights.w1_idle.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={weights.w1_idle}
            onChange={(e) => onWeightChange('w1_idle', parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--blueprint)' }}
          />
        </div>

        {/* w2: Match Equipment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            Match Lab Equipment: <span style={{ color: 'var(--blueprint)', fontWeight: 700 }}>{weights.w2_mismatch.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={weights.w2_mismatch}
            onChange={(e) => onWeightChange('w2_mismatch', parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--blueprint)' }}
          />
        </div>

        {/* w3: Prevent Overcrowding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
            Prevent Overcrowding (Strict): <span style={{ color: 'var(--signal-amber)', fontWeight: 700 }}>{weights.w3_overcap.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="8"
            step="0.1"
            value={weights.w3_overcap}
            onChange={(e) => onWeightChange('w3_overcap', parseFloat(e.target.value))}
            style={{ width: '70px', accentColor: 'var(--signal-amber)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {solveTime !== null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--blueprint)', fontWeight: 600 }}>
            Checked in: <strong>{solveTime} ms</strong>
          </span>
        )}

        <button
          onClick={onReset}
          style={{
            border: '1px solid var(--ink)',
            background: '#FFF',
            color: 'var(--ink)',
            padding: '7px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <RotateCcw size={13} /> Reset Schedule
        </button>

        <button
          onClick={onOptimize}
          disabled={isOptimizing}
          style={{
            border: '2px solid var(--ink)',
            background: isOptimizing ? 'var(--ink-muted)' : 'var(--blueprint)',
            color: '#FFF',
            padding: '7px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isOptimizing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Play size={14} fill="#FFF" />
          {isOptimizing ? 'Finding best room arrangement...' : '🚀 Find Better Room Arrangement'}
        </button>
      </div>
    </div>
  );
}
