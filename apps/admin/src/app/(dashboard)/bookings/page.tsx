'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Booking {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  status: string;
  service: { name: string; price: number };
  staff: { name: string };
  member: { displayName: string };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待確認', color: '#FFC107' },
  CONFIRMED: { label: '已確認', color: '#27ACB2' },
  CANCELLED: { label: '已取消', color: '#E74C3C' },
  COMPLETED: { label: '已完成', color: '#8E44AD' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => api.get<Booking[]>(`/bookings?date=${date}`).then(setBookings);
  useEffect(() => { load(); }, [date]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/bookings/${id}/status`, { status });
    load();
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>預約管理</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
      </div>

      {bookings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888' }}>
          此日期無預約紀錄
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bookings.map(b => {
            const st = STATUS_LABEL[b.status] ?? { label: b.status, color: '#888' };
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 16 }}>{b.customerName}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, background: st.color + '20', color: st.color, fontSize: 12, fontWeight: 'bold' }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#555' }}>
                      {b.service.name} · {b.staff.name} · {b.startTime}–{b.endTime}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{b.customerPhone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.status === 'PENDING' && (
                      <button onClick={() => updateStatus(b.id, 'CONFIRMED')}
                        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#27ACB2', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                        確認
                      </button>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(b.status) && (
                      <button onClick={() => updateStatus(b.id, 'CANCELLED')}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E74C3C', background: '#fff', color: '#E74C3C', cursor: 'pointer', fontSize: 13 }}>
                        取消
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
