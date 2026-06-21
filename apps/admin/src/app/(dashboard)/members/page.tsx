'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Member {
  id: string;
  displayName: string;
  phone?: string;
  createdAt: string;
  _count: { bookings: number };
  bookings: { bookingDate: string; status: string; service: { name: string } }[];
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => { api.get<Member[]>('/members').then(setMembers); }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>客戶名冊</h1>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              {['客戶名稱', '手機', '加入時間', '預約次數', '最近預約'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#888', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{m.displayName ?? '未知'}</td>
                <td style={{ padding: '12px 16px', color: '#555', fontSize: 14 }}>{m.phone ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: '#888', fontSize: 13 }}>{new Date(m.createdAt).toLocaleDateString('zh-TW')}</td>
                <td style={{ padding: '12px 16px', color: '#27ACB2', fontWeight: 'bold' }}>{m._count.bookings}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                  {m.bookings[0] ? `${m.bookings[0].service.name} · ${new Date(m.bookings[0].bookingDate).toLocaleDateString('zh-TW')}` : '—'}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#888' }}>尚無會員資料</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
