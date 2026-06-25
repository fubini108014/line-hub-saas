import { useEffect, useState } from 'react';
import { fetchMyBookings } from '../lib/api';

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

interface Booking {
  id: string;
  serviceName: string;
  staffName: string;
  bookingDate: string;
  startTime: string;
  status: string;
  reviewId?: string;
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: '#FEF3C7', color: '#92400E', label: '待確認' },
  CONFIRMED: { bg: '#EDE9FE', color: '#5B21B6', label: '已確認' },
  COMPLETED: { bg: '#D1FAE5', color: '#065F46', label: '已完成' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B', label: '已取消' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { bg: '#F1F5F9', color: '#64748B', label: status };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="1" y="2.5" width="12" height="10.5" rx="2" stroke="#94A3B8" strokeWidth="1.2" />
      <path d="M1 5.5h12" stroke="#94A3B8" strokeWidth="1.2" />
      <path d="M4.5 1v3M9.5 1v3" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 64, gap: 12 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="48" height="44" rx="6" stroke="#E2E8F0" strokeWidth="2.5" />
        <path d="M8 24h48" stroke="#E2E8F0" strokeWidth="2.5" />
        <path d="M22 6v12M42 6v12" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 36h24M20 44h16" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 14, color: '#94A3B8' }}>目前沒有預約紀錄</span>
    </div>
  );
}

export function MyBookings({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings(merchantId, lineUserId)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  const goReview = (bookingId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('type', 'review');
    url.searchParams.set('extra', bookingId);
    window.location.href = url.toString();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>我的預約</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 460, margin: '0 auto', padding: 16, paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <span style={{ color: '#94A3B8', fontSize: 14 }}>載入中...</span>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          bookings.map((b) => (
            <div
              key={b.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #EDF0F7',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                marginBottom: 12,
                padding: 16,
              }}
            >
              {/* Top row: service name + status badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                  {b.serviceName}
                </span>
                <StatusBadge status={b.status} />
              </div>

              {/* Staff name */}
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>
                {b.staffName}
              </div>

              {/* Date row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', marginBottom: b.status === 'COMPLETED' && !b.reviewId ? 10 : 0 }}>
                <CalendarIcon />
                <span>{b.bookingDate.replace(/-/g, '/')}</span>
                <span>{b.startTime}</span>
              </div>

              {/* Write review button */}
              {b.status === 'COMPLETED' && !b.reviewId && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    onClick={() => goReview(b.id)}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#7C3AED',
                      background: 'transparent',
                      border: '1.5px solid #7C3AED',
                      borderRadius: 8,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    撰寫評價
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
