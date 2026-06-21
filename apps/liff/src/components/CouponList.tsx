import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface Coupon {
  id: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  validUntil: string;
  claimed: boolean;
  canClaim: boolean;
}

interface Claim {
  id: string;
  status: string;
  claimedAt: string;
  coupon: Coupon;
}

export function CouponList({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Record<string, string>>({});

  const loadAll = () => {
    Promise.all([
      fetch(`${BASE}/public/coupons?merchantId=${merchantId}&lineUserId=${lineUserId}`).then((r) => r.json()),
      fetch(`${BASE}/public/coupons/my-claims?merchantId=${merchantId}&lineUserId=${lineUserId}`).then((r) => r.json()),
    ]).then(([c, cl]) => {
      setCoupons(c);
      setClaims(cl);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const claim = async (couponId: string) => {
    const res = await fetch(`${BASE}/public/coupons/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, lineUserId, couponId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: '領取失敗' }));
      setMsg((m) => ({ ...m, [couponId]: err.message }));
      return;
    }
    setMsg((m) => ({ ...m, [couponId]: '領取成功！' }));
    loadAll();
  };

  const discountText = (c: Coupon) =>
    c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `折 NT$${c.discountValue}`;

  if (loading) return <div style={styles.center}>載入中...</div>;

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>優惠券</h2>
      <div style={styles.tabs}>
        <button onClick={() => setTab('available')} style={{ ...styles.tab, ...(tab === 'available' ? styles.tabActive : {}) }}>可用優惠</button>
        <button onClick={() => setTab('mine')} style={{ ...styles.tab, ...(tab === 'mine' ? styles.tabActive : {}) }}>我的優惠券</button>
      </div>

      {tab === 'available' && (
        coupons.length === 0 ? <p style={styles.empty}>目前無優惠活動</p> :
        coupons.map((c) => (
          <div key={c.id} style={styles.card}>
            <div style={styles.left}>
              <p style={styles.discount}>{discountText(c)}</p>
              <p style={styles.couponTitle}>{c.title}</p>
              {c.description && <p style={styles.desc}>{c.description}</p>}
              <p style={styles.expire}>有效至 {new Date(c.validUntil).toLocaleDateString('zh-TW')}</p>
            </div>
            <div style={styles.right}>
              {c.claimed ? (
                <span style={styles.claimedBadge}>已領取</span>
              ) : (
                <button onClick={() => claim(c.id)} style={styles.claimBtn} disabled={!c.canClaim}>
                  {c.canClaim ? '領取' : '已達上限'}
                </button>
              )}
            </div>
            {msg[c.id] && <p style={{ gridColumn: '1/-1', color: '#27ACB2', fontSize: 13, marginTop: 4 }}>{msg[c.id]}</p>}
          </div>
        ))
      )}

      {tab === 'mine' && (
        claims.length === 0 ? <p style={styles.empty}>尚無優惠券</p> :
        claims.map((cl) => (
          <div key={cl.id} style={{ ...styles.card, opacity: cl.status === 'REDEEMED' ? 0.5 : 1 }}>
            <div style={styles.left}>
              <p style={styles.discount}>{discountText(cl.coupon)}</p>
              <p style={styles.couponTitle}>{cl.coupon.title}</p>
              <p style={styles.expire}>有效至 {new Date(cl.coupon.validUntil).toLocaleDateString('zh-TW')}</p>
            </div>
            <div style={styles.right}>
              <span style={{ ...styles.claimedBadge, background: cl.status === 'REDEEMED' ? '#aaa' : '#27ACB2' }}>
                {cl.status === 'REDEEMED' ? '已使用' : '未使用'}
              </span>
            </div>
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
  tabs: { display: 'flex', marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid #ddd' },
  tab: { flex: 1, padding: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 14 },
  tabActive: { background: '#27ACB2', color: '#fff' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  card: { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' },
  left: {},
  right: { display: 'flex', alignItems: 'center' },
  discount: { fontSize: 22, fontWeight: 900, color: '#E74C3C', margin: 0 },
  couponTitle: { fontWeight: 700, fontSize: 15, margin: '4px 0' },
  desc: { color: '#888', fontSize: 13, margin: '2px 0' },
  expire: { color: '#aaa', fontSize: 12 },
  claimedBadge: { background: '#27ACB2', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 12 },
  claimBtn: { background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
};
