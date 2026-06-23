import { useState } from 'react';

const FEATURES = [
  {
    type: 'booking',
    label: '線上預約',
    desc: '選擇服務・選擇人員・選擇時段',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2.5" /><path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
    color: '#7C3AED',
    soft: '#EDE9FE',
  },
  {
    type: 'my-bookings',
    label: '我的預約',
    desc: '查看預約紀錄・取消或更改',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" />
      </svg>
    ),
    color: '#0EA5E9',
    soft: '#E0F2FE',
  },
  {
    type: 'loyalty',
    label: '集點卡',
    desc: '查看點數・兌換獎勵',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" rx="1" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
    color: '#F59E0B',
    soft: '#FEF3C7',
  },
  {
    type: 'coupon',
    label: '優惠券',
    desc: '領取與使用專屬優惠',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    ),
    color: '#10B981',
    soft: '#D1FAE5',
  },
  {
    type: 'queue',
    label: '候位管理',
    desc: '遠端取號・即時查看候位',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    color: '#6366F1',
    soft: '#EEF2FF',
  },
  {
    type: 'review',
    label: '評價回饋',
    desc: '為本次消費留下評分',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    color: '#F97316',
    soft: '#FFF7ED',
  },
  {
    type: 'order',
    label: '點餐',
    desc: '線上點餐・自取或外送',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    color: '#EF4444',
    soft: '#FEE2E2',
  },
  {
    type: 'form',
    label: '問卷表單',
    desc: '填寫商家問卷・提供意見',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
    color: '#8B5CF6',
    soft: '#F5F3FF',
  },
  {
    type: 'draw',
    label: '抽獎活動',
    desc: '參加限時抽獎・贏取大獎',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      </svg>
    ),
    color: '#EC4899',
    soft: '#FDF2F8',
  },
];

export function SitemapPage() {
  const [mid, setMid] = useState(() => new URLSearchParams(window.location.search).get('mid') ?? '');
  const [uid] = useState('demo-user-001');

  const buildUrl = (type: string) => {
    const p = new URLSearchParams({ mid, type, dev: '1', uid });
    return `/?${p.toString()}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif" }}>
      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '40px 24px 32px' }}>
        {/* BG glow */}
        <div style={{
          position: 'absolute', top: '-60%', left: '50%', transform: 'translateX(-50%)',
          width: 360, height: 360,
          background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>LINE Hub</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>LIFF 功能展示</div>
            </div>
          </div>

          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            全功能 Sitemap
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            輸入商家 ID 後點選功能卡片預覽各頁面
          </p>
        </div>
      </div>

      {/* MerchantID Input */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
          padding: '16px 18px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
            Merchant ID
          </div>
          <input
            type="text"
            value={mid}
            onChange={e => setMid(e.target.value)}
            placeholder="貼上商家 ID（例如：cm123abc）"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '10px 13px',
              fontSize: 13,
              color: '#fff',
              outline: 'none',
              fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
            }}
          />
          {!mid && (
            <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.3)' }}>
              ⚠ 請先填入商家 ID，否則功能頁面無法載入資料
            </p>
          )}
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ padding: '0 20px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {FEATURES.map(({ type, label, desc, icon, color, soft }) => (
          <a
            key={type}
            href={mid ? buildUrl(type) : undefined}
            onClick={!mid ? e => { e.preventDefault(); alert('請先輸入商家 ID'); } : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '16px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 14,
              textDecoration: 'none',
              transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
              cursor: mid ? 'pointer' : 'not-allowed',
              opacity: mid ? 1 : 0.55,
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
              if (!mid) return;
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}50`;
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
            }}
          >
            {/* Icon */}
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: soft + '22',
              border: `1px solid ${color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
              flexShrink: 0,
            }}>
              {icon}
            </div>
            {/* Text */}
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8 }}>
          Dev mode — 繞過 LINE LIFF 驗證<br />
          uid: <code style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' }}>{uid}</code>
        </div>
      </div>
    </div>
  );
}
