import React from 'react';
import { ShieldCheck, ShieldAlert, Award, UserCheck } from 'lucide-react';

export default function SafetyBadge({ safetyTrust, compact = false }) {
  if (!safetyTrust) return null;

  const { score, isOfficial, hostName, flags = [] } = safetyTrust;

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
        {isOfficial ? (
          <span style={{ color: '#ffd700', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
            <Award size={13} />
            <span>官方認證</span>
          </span>
        ) : (
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ShieldCheck size={13} />
            <span>信任分 {score}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOfficial ? (
            <Award size={18} color="#ffd700" />
          ) : (
            <ShieldCheck size={18} color="#10b981" />
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: isOfficial ? '#ffd700' : '#f8fafc' }}>
            {isOfficial ? '安全氣象台・官方驗證標章' : `主辦人信任度 ${score} 分`}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isOfficial ? '免驗證高信任度' : '防濫用評鑑機制'}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <UserCheck size={14} color="var(--accent-cyan)" />
        <span>主辦：{hostName || '社群認證主辦人'}</span>
      </div>

      {flags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {flags.map((flag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isOfficial ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                color: isOfficial ? '#fbbf24' : '#34d399',
                border: isOfficial ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              ✓ {flag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
