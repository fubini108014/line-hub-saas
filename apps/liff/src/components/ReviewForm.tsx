import { useState } from 'react';
import liff from '@line/liff';

const BASE = import.meta.env.VITE_API_URL as string;
const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

const RATING_LABELS: Record<number, string> = {
  1: '非常不滿意',
  2: '不滿意',
  3: '普通',
  4: '滿意',
  5: '非常滿意',
};

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
    setError('');
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

  // ── Submitted ──
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>撰寫評價</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 36, color: '#10B981', fontWeight: 'bold' }}>✓</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>感謝您的評價！</p>
          <p style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>您的意見將幫助我們持續改善服務</p>
          
          <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('type', 'my-bookings');
                url.searchParams.delete('extra');
                window.location.href = url.toString();
              }}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 12,
                border: 'none',
                background: '#7C3AED',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              回到我的預約
            </button>
            <button
              onClick={() => liff.closeWindow()}
              style={{
                width: '100%',
                height: 46,
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 14.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              關閉視窗
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeRating = hover || rating;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>撰寫評價</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 460, margin: '0 auto', width: '100%', padding: '16px 16px 100px', boxSizing: 'border-box' }}>

        {/* Star rating */}
        <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #EDF0F7', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', padding: '28px 24px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 20 }}>請為這次的服務評分</p>

          {/* Stars row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                style={{ width: 44, height: 44, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                <span style={{ fontSize: 36, color: s <= activeRating ? '#F59E0B' : '#E2E8F0', lineHeight: 1, transition: 'color 0.1s' }}>
                  {s <= activeRating ? '★' : '☆'}
                </span>
              </button>
            ))}
          </div>

          {/* Label */}
          <p style={{ fontSize: 13, color: '#64748B', minHeight: 20, margin: 0 }}>
            {activeRating > 0 ? RATING_LABELS[activeRating] : ''}
          </p>
        </div>

        {/* Textarea */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>留言（選填）</label>
          <textarea
            style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 15, color: '#0F172A', background: '#FFFFFF', resize: 'none', boxSizing: 'border-box', fontFamily: FONT, outline: 'none', lineHeight: 1.6 }}
            placeholder="分享您的消費體驗..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          <button
            onClick={submit}
            disabled={loading || rating === 0}
            style={{
              width: '100%', height: 52, background: rating === 0 ? '#E2E8F0' : '#7C3AED',
              color: rating === 0 ? '#94A3B8' : '#FFFFFF', border: 'none', borderRadius: 14,
              fontSize: 15.5, fontWeight: 700, cursor: rating === 0 ? 'not-allowed' : 'pointer',
              fontFamily: FONT, transition: 'background 0.15s',
            }}
          >
            {loading ? '送出中...' : '送出評價'}
          </button>
        </div>
      </div>
    </div>
  );
}
