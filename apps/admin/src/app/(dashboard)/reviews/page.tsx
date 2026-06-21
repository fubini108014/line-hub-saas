'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  member: { displayName?: string; lineUserId: string };
  booking?: { service: { name: string } };
}
interface Stats { count: number; average: number }

function Stars({ n }: { n: number }) {
  return <span style={{ color: '#FFC107' }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/reviews`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/reviews/stats`, { headers: h }).then((r) => r.json()),
    ]).then(([r, s]) => { setReviews(r); setStats(s); }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: '#27ACB2', marginBottom: 24 }}>⭐ 評價管理</h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={card}>
            <p style={label}>總評價數</p>
            <p style={value}>{stats.count}</p>
          </div>
          <div style={card}>
            <p style={label}>平均分數</p>
            <p style={value}>{stats.average.toFixed(1)} / 5.0</p>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : reviews.length === 0 ? <p style={{ color: '#aaa' }}>尚無評價</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r) => (
            <div key={r.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Stars n={r.rating} />
                  <span style={{ marginLeft: 8, color: '#555', fontSize: 14 }}>
                    {r.member.displayName || r.member.lineUserId}
                    {r.booking && ` · ${r.booking.service.name}`}
                  </span>
                </div>
                <span style={{ color: '#aaa', fontSize: 13 }}>
                  {new Date(r.createdAt).toLocaleDateString('zh-TW')}
                </span>
              </div>
              {r.comment && <p style={{ marginTop: 8, color: '#333' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const label: React.CSSProperties = { color: '#888', fontSize: 13, margin: 0 };
const value: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#333', margin: '4px 0 0' };
