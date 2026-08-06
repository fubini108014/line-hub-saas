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

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function BookingCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [countByDate, setCountByDate] = useState<Record<string, number>>({});
  const [loadingMonth, setLoadingMonth] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    setLoadingMonth(true);
    api.get<Record<string, number>>(`/bookings/calendar?year=${year}&month=${month}`)
      .then((d) => setCountByDate(d ?? {}))
      .catch(() => setCountByDate({}))
      .finally(() => setLoadingMonth(false));
  }, [year, month]);

  const loadDay = (date: string) => {
    setSelectedDate(date);
    setLoadingDay(true);
    api.get<Booking[]>(`/bookings?date=${date}`)
      .then((d) => setDayBookings(Array.isArray(d) ? d : []))
      .catch(() => setDayBookings([]))
      .finally(() => setLoadingDay(false));
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/bookings/${id}/status`, { status });
    if (selectedDate) loadDay(selectedDate);
    api.get<Record<string, number>>(`/bookings/calendar?year=${year}&month=${month}`).then((d) => setCountByDate(d ?? {}));
  };

  const goPrevMonth = () => {
    setSelectedDate(null);
    if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    setSelectedDate(null);
    if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0 = Monday
  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, dateStr: `${year}-${pad(month)}-${pad(day)}` });

  const staffBreakdown = dayBookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.staff.name] = (acc[b.staff.name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>預約日曆總覽</h1>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20, flex: '0 0 480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={goPrevMonth} style={navBtn}>‹</button>
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>{year} 年 {month} 月</span>
            <button onClick={goNextMonth} style={navBtn}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} style={{ textAlign: 'center', fontSize: 12, color: '#999', padding: '4px 0' }}>{w}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`b-${idx}`} />;
              const count = countByDate[cell.dateStr] ?? 0;
              const selected = selectedDate === cell.dateStr;
              return (
                <button
                  key={cell.dateStr}
                  onClick={() => loadDay(cell.dateStr)}
                  disabled={loadingMonth}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 8,
                    border: selected ? '1.5px solid #27ACB2' : '1.5px solid transparent',
                    background: selected ? '#E8F7F8' : count > 0 ? '#F5FBFB' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: selected ? 700 : 500,
                    color: '#333',
                  }}
                >
                  <span>{cell.day}</span>
                  {count > 0 && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: count >= 5 ? '#E74C3C' : '#27ACB2',
                      marginTop: 2,
                    }}>
                      {count} 筆
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: '1 1 400px', minWidth: 320 }}>
          {!selectedDate ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888' }}>
              點選左方日期查看當日預約明細
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{selectedDate} 預約明細（共 {dayBookings.length} 筆）</h3>
              </div>

              {Object.keys(staffBreakdown).length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {Object.entries(staffBreakdown).map(([name, count]) => (
                    <span key={name} style={{ background: '#E8F7F8', color: '#27ACB2', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>
                      {name} · {count} 筆
                    </span>
                  ))}
                </div>
              )}

              {loadingDay ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>載入中...</div>
              ) : dayBookings.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#888' }}>
                  此日期無預約紀錄
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dayBookings.map((b) => {
                    const st = STATUS_LABEL[b.status] ?? { label: b.status, color: '#888' };
                    return (
                      <div key={b.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <span style={{ fontWeight: 'bold', fontSize: 15 }}>{b.customerName}</span>
                              <span style={{ padding: '2px 10px', borderRadius: 20, background: st.color + '20', color: st.color, fontSize: 12, fontWeight: 'bold' }}>
                                {st.label}
                              </span>
                            </div>
                            <div style={{ fontSize: 13.5, color: '#555' }}>
                              {b.service.name} · {b.staff.name} · {b.startTime}–{b.endTime}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {b.status === 'PENDING' && (
                              <button onClick={() => updateStatus(b.id, 'CONFIRMED')} style={btnConfirm}>確認</button>
                            )}
                            {['PENDING', 'CONFIRMED'].includes(b.status) && (
                              <button onClick={() => updateStatus(b.id, 'CANCELLED')} style={btnCancel}>取消</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 15, color: '#555' };
const btnConfirm: React.CSSProperties = { padding: '6px 12px', borderRadius: 6, border: 'none', background: '#27ACB2', color: '#fff', cursor: 'pointer', fontSize: 12.5 };
const btnCancel: React.CSSProperties = { padding: '6px 12px', borderRadius: 6, border: '1px solid #E74C3C', background: '#fff', color: '#E74C3C', cursor: 'pointer', fontSize: 12.5 };
