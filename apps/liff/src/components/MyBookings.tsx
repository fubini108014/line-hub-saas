import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface Booking {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  service: { name: string };
  staff: { name: string };
  review: { rating: number } | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待確認',
  CONFIRMED: '已確認',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#FFC107',
  CONFIRMED: '#27ACB2',
  COMPLETED: '#8E44AD',
  CANCELLED: '#E74C3C',
};

export function MyBookings({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/public/my-bookings?merchantId=${merchantId}&lineUserId=${lineUserId}`)
      .then((r) => r.json())
      .then(setBookings)
      .finally(() => setLoading(false));
  }, []);

  const goReview = (bookingId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('type', 'review');
    url.searchParams.set('extra', bookingId);
    window.location.href = url.toString();
  };

  if (loading) return <div style={styles.center}>載入中...</div>;

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>我的預約</h2>
      {bookings.length === 0 ? (
        <p style={styles.empty}>尚無預約紀錄</p>
      ) : (
        bookings.map((b) => (
          <div key={b.id} style={styles.card}>
            <div style={styles.row}>
              <span style={styles.service}>{b.service.name}</span>
              <span style={{ ...styles.badge, background: STATUS_COLOR[b.status] }}>
                {STATUS_LABEL[b.status]}
              </span>
            </div>
            <p style={styles.sub}>
              {new Date(b.bookingDate).toLocaleDateString('zh-TW')} {b.startTime}–{b.endTime}
            </p>
            <p style={styles.sub}>服務人員：{b.staff.name}</p>
            {b.status === 'COMPLETED' && !b.review && (
              <button style={styles.reviewBtn} onClick={() => goReview(b.id)}>
                評價此次服務
              </button>
            )}
            {b.review && (
              <p style={styles.rated}>{'★'.repeat(b.review.rating)}{'☆'.repeat(5 - b.review.rating)}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 20, maxWidth: 420, margin: '0 auto', fontFamily: 'sans-serif' },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  title: { textAlign: 'center', color: '#27ACB2', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  card: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  service: { fontWeight: 700, fontSize: 16 },
  badge: { padding: '2px 10px', borderRadius: 20, color: '#fff', fontSize: 12 },
  sub: { color: '#666', fontSize: 14, margin: '2px 0' },
  reviewBtn: { marginTop: 10, padding: '8px 16px', background: '#8E44AD', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  rated: { marginTop: 8, color: '#FFC107', fontSize: 18 },
};
