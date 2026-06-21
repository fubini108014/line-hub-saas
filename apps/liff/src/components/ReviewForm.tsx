import { useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

export function ReviewForm({
  merchantId,
  lineUserId,
  bookingId,
}: {
  merchantId: string;
  lineUserId: string;
  bookingId?: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) { setError('請選擇星級'); return; }
    setLoading(true);
    try {
      await fetch(`${BASE}/public/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, lineUserId, bookingId, rating, comment }),
      });
      setSubmitted(true);
    } catch {
      setError('提交失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 60 }}>⭐</div>
        <h2 style={{ color: '#27ACB2' }}>感謝您的評價！</h2>
        <p style={{ color: '#888' }}>您的意見對我們非常重要</p>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>服務評價</h2>
      <p style={styles.sub}>請為這次的服務評分</p>

      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            style={{ ...styles.star, color: s <= (hover || rating) ? '#FFC107' : '#ddd' }}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
          >
            ★
          </span>
        ))}
      </div>

      <div style={styles.labels}>
        {['非常差', '差', '普通', '好', '非常好'].map((l, i) => (
          <span key={i} style={{ ...styles.label, opacity: i + 1 === rating ? 1 : 0.3 }}>{l}</span>
        ))}
      </div>

      <textarea
        style={styles.textarea}
        placeholder="留下您的評語（選填）"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />

      {error && <p style={{ color: '#E74C3C', fontSize: 14 }}>{error}</p>}

      <button onClick={submit} disabled={loading} style={styles.btn}>
        {loading ? '提交中...' : '送出評價'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 24, maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif' },
  center: { padding: 60, textAlign: 'center', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', color: '#27ACB2', marginBottom: 8 },
  sub: { textAlign: 'center', color: '#888', marginBottom: 24 },
  stars: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 },
  star: { fontSize: 48, cursor: 'pointer', transition: 'color 0.1s' },
  labels: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' },
  label: { fontSize: 12, color: '#555' },
  textarea: { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', fontSize: 15, resize: 'none', boxSizing: 'border-box', marginBottom: 16 },
  btn: { width: '100%', padding: 14, background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 700 },
};
