import { useEffect, useState } from 'react';
import { fetchCoupons } from '../lib/api';

const BASE = import.meta.env.VITE_API_URL as string;
const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

interface Coupon {
  id: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  expiresAt?: string;
  claimed: boolean;
  used: boolean;
  claimId?: string;
}

export function CouponList({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = () => {
    fetchCoupons(merchantId, lineUserId)
      .then(setCoupons)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const claimCoupon = async (couponId: string) => {
    setClaiming(couponId);
    try {
      const res = await fetch(`${BASE}/public/coupons/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, lineUserId, couponId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '領取失敗' }));
        alert(err.message || '領取失敗，請重試');
      } else {
        alert('領取成功！');
      }
      load();
    } catch {
      alert('網路連線失敗，請重試');
    } finally {
      setClaiming(null);
    }
  };

  const discountLabel = (c: Coupon) =>
    c.discountType === 'PERCENTAGE'
      ? `${c.discountValue}折`
      : `NT$${c.discountValue}`;

  const availableCoupons = coupons.filter((c) => !c.claimed && !c.used);
  const myCoupons = coupons.filter((c) => c.claimed || c.used);

  const displayList = tab === 'available' ? availableCoupons : myCoupons;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
      }}>
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>優惠券</span>
        </div>

        {/* Pill tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
          {(['available', 'mine'] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '7px 20px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: active ? '#7C3AED' : '#EDE9FE',
                  color: active ? '#FFFFFF' : '#7C3AED',
                  fontFamily: FONT,
                  transition: 'all 0.2s',
                }}
              >
                {t === 'available' ? '可領取' : '我的優惠券'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 460, margin: '0 auto', padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <span style={{ color: '#94A3B8', fontSize: 14 }}>載入中...</span>
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <span style={{ color: '#94A3B8', fontSize: 14 }}>
              {tab === 'available' ? '目前沒有可領取的優惠券' : '尚無優惠券'}
            </span>
          </div>
        ) : (
          displayList.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid #EDF0F7',
                borderLeft: '4px solid #7C3AED',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
                marginBottom: 12,
                padding: '16px 16px 16px 20px',
                position: 'relative',
                opacity: c.used ? 0.6 : 1,
              }}
            >
              {/* Discount badge top-right */}
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#FEF3C7',
                color: '#92400E',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 8px',
              }}>
                {discountLabel(c)}
              </div>

              {/* Title */}
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0F172A',
                paddingRight: 60,
              }}>
                {c.title}
              </div>

              {/* Description */}
              {c.description && (
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  {c.description}
                </div>
              )}

              {/* Bottom row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
              }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  {c.expiresAt
                    ? `有效至 ${new Date(c.expiresAt).toLocaleDateString('zh-TW')}`
                    : '長期有效'}
                </span>

                <div>
                  {c.used ? (
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#F1F5F9',
                      color: '#94A3B8',
                    }}>
                      已使用
                    </span>
                  ) : c.claimed ? (
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#EDE9FE',
                      color: '#5B21B6',
                    }}>
                      已領取
                    </span>
                  ) : (
                    <button
                      onClick={() => claimCoupon(c.id)}
                      disabled={claiming === c.id}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        background: claiming === c.id ? '#A78BFA' : '#7C3AED',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        cursor: claiming === c.id ? 'not-allowed' : 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      {claiming === c.id ? '領取中...' : '立即領取'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
