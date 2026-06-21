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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

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

  if (!stats) return <div style={{ padding: 32, color: '#888' }}>載入中...</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>總覽</h1>
      <p style={{ margin: '0 0 28px', color: '#888' }}>{new Date().toLocaleDateString('zh-TW', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      {!stats.hasLineCredentials && (
        <div style={{ background: '#FFF3CD', border: '1px solid #FFC107', borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <strong>尚未串接 LINE 官方帳號</strong>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#856404' }}>
              請前往 <a href="/settings/line" style={{ color: '#856404' }}>LINE 串接設定</a> 完成憑證填寫，才能啟用所有功能。
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '今日預約', value: stats.todayBookings, icon: '📅', color: '#27ACB2' },
          { label: '待確認', value: stats.pendingBookings, icon: '⏳', color: '#FFC107' },
          { label: '總會員數', value: stats.totalMembers, icon: '👥', color: '#8E44AD' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `4px solid ${color}` }}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', margin: '8px 0 4px', color }}>{value}</div>
            <div style={{ fontSize: 14, color: '#888' }}>{label}</div>
          </div>
        ))}
      </div>

      {stats.hasLineCredentials && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#555' }}>Webhook URL</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code style={{ flex: 1, background: '#f5f5f5', padding: '8px 12px', borderRadius: 6, fontSize: 13, overflow: 'auto' }}>
              {stats.webhookUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(stats.webhookUrl)}
              style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 }}
            >
              複製
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
