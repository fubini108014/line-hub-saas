import type React from 'react';

/* ─── Colour tokens ─── */
export const C = {
  primary:      '#7C3AED',
  primaryHover: '#6D28D9',
  primarySoft:  '#EDE9FE',
  primaryGrad:  'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)',
  sky:          '#0EA5E9',
  skySoft:      '#E0F2FE',
  success:      '#10B981',
  successSoft:  '#D1FAE5',
  warning:      '#F59E0B',
  warningSoft:  '#FEF3C7',
  danger:       '#EF4444',
  dangerSoft:   '#FEE2E2',
  ink:          '#0F172A',
  ink2:         '#334155',
  ink3:         '#64748B',
  ink4:         '#94A3B8',
  border:       '#E2E8F0',
  borderSubtle: '#EDF0F7',
  surface:      '#FFFFFF',
  bg:           '#F8FAFC',
} as const;

export const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif";

/* ─── Common style objects ─── */
export const S = {
  page: {
    fontFamily: FONT,
    minHeight: '100vh',
    background: C.bg,
    color: C.ink2,
  } as React.CSSProperties,

  container: {
    maxWidth: 460,
    margin: '0 auto',
    padding: '0 16px',
  } as React.CSSProperties,

  // Page header
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    background: C.surface,
    borderBottom: `1px solid ${C.borderSubtle}`,
    padding: '0 16px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 700,
    color: C.ink,
    textAlign: 'center' as const,
    letterSpacing: '-0.01em',
  } as React.CSSProperties,

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    background: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: C.ink3,
    flexShrink: 0,
  } as React.CSSProperties,

  // Cards
  card: {
    background: C.surface,
    borderRadius: 16,
    padding: '16px 18px',
    border: `1px solid ${C.borderSubtle}`,
    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
  } as React.CSSProperties,

  // Selection card (tappable)
  selCard: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: `1.5px solid ${C.border}`,
    background: C.surface,
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    display: 'block',
  } as React.CSSProperties,

  selCardActive: {
    borderColor: C.primary,
    background: C.primarySoft,
  } as React.CSSProperties,

  // Form
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.ink2,
    marginBottom: 6,
  } as React.CSSProperties,

  input: {
    width: '100%',
    boxSizing: 'border-box' as const,
    height: 48,
    padding: '0 14px',
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    fontSize: 15,
    color: C.ink,
    background: C.surface,
    outline: 'none',
    fontFamily: FONT,
    transition: 'border-color 0.15s',
  } as React.CSSProperties,

  // Buttons
  btnPrimary: {
    display: 'block',
    width: '100%',
    height: 52,
    borderRadius: 14,
    border: 'none',
    background: C.primary,
    color: '#fff',
    fontSize: 15.5,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: FONT,
    letterSpacing: '-0.01em',
    transition: 'background 0.15s, opacity 0.15s',
  } as React.CSSProperties,

  btnSecondary: {
    display: 'block',
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: `1.5px solid ${C.border}`,
    background: C.surface,
    color: C.ink2,
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: FONT,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  // Sticky bottom bar
  bottomBar: {
    position: 'sticky' as const,
    bottom: 0,
    background: C.surface,
    borderTop: `1px solid ${C.borderSubtle}`,
    padding: '12px 16px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  } as React.CSSProperties,

  // Section heading
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: C.ink3,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    margin: '20px 0 10px',
  } as React.CSSProperties,

  // Error message
  error: {
    fontSize: 13,
    color: C.danger,
    padding: '10px 14px',
    background: C.dangerSoft,
    borderRadius: 10,
    border: `1px solid rgba(239,68,68,0.2)`,
  } as React.CSSProperties,

  // Center empty/loading state
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    gap: 10,
    color: C.ink4,
    fontSize: 14,
    padding: 32,
    textAlign: 'center' as const,
  } as React.CSSProperties,
} as const;

/* ─── Status helpers ─── */
const STATUS_MAP: Record<string, [string, string, string]> = {
  PENDING:   [C.warningSoft, '#92400E', '待確認'],
  CONFIRMED: [C.primarySoft, '#5B21B6', '已確認'],
  COMPLETED: [C.successSoft, '#065F46', '已完成'],
  CANCELLED: [C.dangerSoft,  '#991B1B', '已取消'],
};

export function statusStyle(status: string): React.CSSProperties {
  const [bg, color] = STATUS_MAP[status] ?? ['#F1F5F9', '#475569'];
  return {
    background: bg,
    color,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11.5,
    fontWeight: 600,
    display: 'inline-block',
    letterSpacing: '0.02em',
  };
}

export function statusLabel(status: string): string {
  return STATUS_MAP[status]?.[2] ?? status;
}

/* ─── Avatar initials ─── */
export function avatarStyle(seed: string): React.CSSProperties {
  const hues = [262, 199, 142, 38, 0, 271, 280, 320];
  const h = hues[(seed.charCodeAt(0) ?? 0) % hues.length];
  return {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: `hsl(${h}, 70%, 92%)`,
    color: `hsl(${h}, 60%, 40%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  };
}
