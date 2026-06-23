import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

interface ProductVariant { id: string; name: string; options: string[] }
interface Product { id: string; name: string; description?: string; price: number; variants: ProductVariant[] }
interface Category { id: string; name: string; products: Product[] }
interface CartItem { product: Product; quantity: number; options?: Record<string, string> }

export function OrderWizard({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [menu, setMenu] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'menu' | 'cart' | 'confirm' | 'done'>('menu');
  const [note, setNote] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');

  useEffect(() => {
    fetch(`${BASE}/public/menu?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then((data) => {
        setMenu(data);
        if (data.length > 0) setActiveCategory(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: Product) => {
    setCart((c) => {
      const existing = c.find((i) => i.product.id === product.id);
      if (existing) return c.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { product, quantity: 1 }];
    });
  };

  const adjustQty = (productId: string, delta: number) => {
    setCart((c) =>
      c.map((i) => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const total = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const totalItems = cart.reduce((n, i) => n + i.quantity, 0);

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          lineUserId,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, options: i.options })),
          note,
          pickupTime,
        }),
      });
      const data = await res.json();
      setOrderNum(data.orderNumber);
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748B', fontSize: 14, fontFamily: FONT, margin: 0 }}>載入中...</p>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M9 18L15 24L27 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>訂單已送出！</h2>
          <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>感謝您的訂購，請稍候取餐通知</p>
          <div style={{ background: '#fff', border: '1px solid #EDF0F7', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>訂單編號</p>
            <p style={{ fontWeight: 900, fontSize: 22, color: '#0F172A', margin: 0, letterSpacing: '0.05em' }}>{orderNum}</p>
          </div>
          {cart.map((i) => (
            <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #EDF0F7', fontSize: 14, color: '#334155' }}>
              <span>{i.product.name} × {i.quantity}</span>
              <span style={{ fontWeight: 600 }}>NT${(Number(i.product.price) * i.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #EDF0F7', padding: '16px 20px', zIndex: 100 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>確認訂單</h1>
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 120px' }}>
          <div style={{ background: '#fff', border: '1px solid #EDF0F7', borderRadius: 16, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', overflow: 'hidden', marginBottom: 16 }}>
            {cart.map((i, idx) => (
              <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: idx < cart.length - 1 ? '1px solid #EDF0F7' : 'none' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>{i.product.name}</p>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>× {i.quantity}</p>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED' }}>NT${(Number(i.product.price) * i.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F8FAFC', borderTop: '2px solid #EDF0F7' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>合計</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>NT${total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #EDF0F7', borderRadius: 16, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', padding: 16, marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#334155', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>備註</label>
            <textarea
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: FONT, resize: 'none', boxSizing: 'border-box', color: '#0F172A', outline: 'none', minHeight: 80 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="食物備註、特殊要求..."
            />
            <label style={{ display: 'block', color: '#334155', fontSize: 13, fontWeight: 600, marginTop: 12, marginBottom: 8 }}>取餐時間（選填）</label>
            <input
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: FONT, boxSizing: 'border-box', color: '#0F172A', outline: 'none' }}
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </div>
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('cart')}
              style={{ flex: '0 0 auto', height: 52, padding: '0 20px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
            >
              返回
            </button>
            <button
              onClick={submitOrder}
              disabled={submitting}
              style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: FONT }}
            >
              {submitting ? '送出中...' : '確認送出'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'cart') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #EDF0F7', padding: '16px 20px', zIndex: 100 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>購物車</h1>
        </div>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 120px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ color: '#94A3B8', fontSize: 15, margin: 0 }}>購物車是空的</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #EDF0F7', borderRadius: 16, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
              {cart.map((i, idx) => (
                <div key={i.product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: idx < cart.length - 1 ? '1px solid #EDF0F7' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>{i.product.name}</p>
                    <p style={{ color: '#7C3AED', fontSize: 14, fontWeight: 700, margin: '2px 0 0' }}>NT${Number(i.product.price).toLocaleString()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #7C3AED', background: '#fff', color: '#7C3AED', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}
                      onClick={() => adjustQty(i.product.id, -1)}
                    >－</button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{i.quantity}</span>
                    <button
                      style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #7C3AED', background: '#7C3AED', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}
                      onClick={() => adjustQty(i.product.id, 1)}
                    >＋</button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F8FAFC', borderTop: '2px solid #EDF0F7' }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>合計</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#7C3AED' }}>NT${total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('menu')}
              style={{ flex: '0 0 auto', height: 52, padding: '0 20px', borderRadius: 14, border: '1px solid #E2E8F0', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
            >
              繼續點餐
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={cart.length === 0}
              style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', opacity: cart.length === 0 ? 0.4 : 1, fontFamily: FONT }}
            >
              前往結帳
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeProducts = menu.find((c) => c.id === activeCategory)?.products ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #EDF0F7', zIndex: 100 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>點餐</h1>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setStep('cart')}
              style={{ width: 40, height: 40, borderRadius: 12, border: '1px solid #EDF0F7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 2h1.5l2.5 10h8l1.5-6.5H5.5" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="16" r="1.2" fill="#334155" />
                <circle cx="13" cy="16" r="1.2" fill="#334155" />
              </svg>
            </button>
            {totalItems > 0 && (
              <div style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, background: '#7C3AED', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{totalItems}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Tab Bar */}
        {menu.length > 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {menu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  flexShrink: 0,
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: activeCategory === cat.id ? 'none' : '1px solid #E2E8F0',
                  background: activeCategory === cat.id ? '#7C3AED' : '#fff',
                  color: activeCategory === cat.id ? '#fff' : '#64748B',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 120px' }}>
        {menu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>目前無商品</p>
          </div>
        ) : activeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#94A3B8', fontSize: 15 }}>此分類目前無商品</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeProducts.map((p) => {
              const qty = cart.find((i) => i.product.id === p.id)?.quantity ?? 0;
              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #EDF0F7', borderRadius: 14, boxShadow: '0 2px 8px rgba(15,23,42,0.06)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>{p.name}</p>
                    {p.description && <p style={{ color: '#64748B', fontSize: 12, margin: '4px 0' }}>{p.description}</p>}
                    <p style={{ color: '#7C3AED', fontWeight: 700, fontSize: 14, margin: '4px 0 0' }}>NT${Number(p.price).toLocaleString()}</p>
                  </div>
                  {qty === 0 ? (
                    <button
                      style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#7C3AED', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1 }}
                      onClick={() => addToCart(p)}
                    >＋</button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <button
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #7C3AED', background: '#fff', color: '#7C3AED', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}
                        onClick={() => adjustQty(p.id, -1)}
                      >－</button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{qty}</span>
                      <button
                        style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #7C3AED', background: '#7C3AED', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}
                        onClick={() => adjustQty(p.id, 1)}
                      >＋</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Bottom Bar */}
      {totalItems > 0 && (
        <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <button
              onClick={() => setStep('cart')}
              style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxSizing: 'border-box' }}
            >
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '2px 10px', fontSize: 13 }}>{totalItems} 項・NT${total.toLocaleString()}</span>
              <span>前往結帳 →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
