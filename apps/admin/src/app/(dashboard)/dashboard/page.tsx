'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stats {
  todayBookings: number;
  pendingBookings: number;
  totalMembers: number;
  hasLineCredentials: boolean;
  webhookUrl: string;
}

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2.5" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const STAT_CARDS = (stats: Stats) => [
  {
    label: '今日預約',
    value: stats.todayBookings,
    icon: <CalendarIcon />,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    label: '待確認',
    value: stats.pendingBookings,
    icon: <ClockIcon />,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    label: '累積會員',
    value: stats.totalMembers,
    icon: <UsersIcon />,
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<any>('/merchants/me'),
      api.get<any[]>('/bookings?status=PENDING'),
      api.get<any[]>('/members'),
      api.get<any[]>(`/bookings?date=${new Date().toISOString().slice(0, 10)}`),
    ]).then(([merchant, pending, members, todayBookings]) => {
      setStats({
        todayBookings: todayBookings.length,
        pendingBookings: pending.length,
        totalMembers: members.length,
        hasLineCredentials: merchant.hasLineCredentials,
        webhookUrl: merchant.webhookUrl,
      });
    });
  }, []);

  const copyWebhook = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dateStr = new Date().toLocaleDateString('zh-TW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!stats) {
    return (
      <div className="page">
        <div className="loading-state">
          <div className="spinner" />
          <span>資料載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">總覽</h1>
        <p className="page-subtitle">{dateStr}</p>
      </div>

      {/* LINE not connected warning */}
      {!stats.hasLineCredentials && (
        <div className="alert alert-warning">
          <span className="alert-icon"><AlertIcon /></span>
          <div>
            <div className="alert-title">尚未串接 LINE 官方帳號</div>
            <div className="alert-body">
              請前往{' '}
              <a href="/settings/line" style={{ color: '#92400E', fontWeight: 600 }}>
                LINE 串接設定
              </a>{' '}
              完成憑證填寫，才能啟用所有功能。
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="stats-grid">
        {STAT_CARDS(stats).map(({ label, value, icon, iconBg, iconColor }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-header">
              <div
                className="stat-icon"
                style={{ background: iconBg, color: iconColor }}
              >
                {icon}
              </div>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Webhook URL card */}
      {stats.hasLineCredentials && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--primary)', display: 'flex' }}><LinkIcon /></span>
                <span className="card-title" style={{ marginBottom: 0 }}>Webhook URL</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
                已連線
              </span>
            </div>
            <div className="code-row">
              <div className="code-val">{stats.webhookUrl}</div>
              <button
                onClick={copyWebhook}
                className="btn btn-outline btn-sm"
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <CopyIcon />
                {copied ? '已複製！' : '複製'}
              </button>
            </div>
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-4)' }}>
              將此 URL 貼到 LINE Developers Console → Messaging API → Webhook URL
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
