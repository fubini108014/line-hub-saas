import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

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

  useEffect(() => {
    fetch(`${BASE}/public/menu?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then(setMenu)
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

  if (loading) return <div style={s.center}>載入中...</div>;

  if (step === 'done') {
    return (
      <div style={s.center}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ color: '#27ACB2' }}>訂單已送出！</h2>
        <p style={{ color: '#555', fontSize: 18 }}>訂單編號</p>
        <p style={{ fontWeight: 900, fontSize: 22, color: '#333' }}>{orderNum}</p>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={s.wrap}>
        <h2 style={s.title}>確認訂單</h2>
        {cart.map((i) => (
          <div key={i.product.id} style={s.row}>
            <span>{i.product.name} × {i.quantity}</span>
            <span>NT${(Number(i.product.price) * i.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div style={{ ...s.row, fontWeight: 700, borderTop: '1px solid #eee', paddingTop: 12, marginTop: 8 }}>
          <span>合計</span>
          <span style={{ color: '#E74C3C' }}>NT${total.toLocaleString()}</span>
        </div>
        <label style={s.label}>備註</label>
        <input style={s.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="食物備註、特殊要求..." />
        <label style={s.label}>取餐時間（選填）</label>
        <input style={s.input} type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
        <button onClick={submitOrder} disabled={submitting} style={s.btn}>
          {submitting ? '送出中...' : '確認送出'}
        </button>
        <button onClick={() => setStep('cart')} style={{ ...s.btn, background: '#888', marginTop: 8 }}>返回購物車</button>
      </div>
    );
  }

  if (step === 'cart') {
    return (
      <div style={s.wrap}>
        <h2 style={s.title}>購物車</h2>
        {cart.length === 0 ? <p style={{ textAlign: 'center', color: '#aaa' }}>購物車是空的</p> : (
          cart.map((i) => (
            <div key={i.product.id} style={s.cartItem}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, margin: 0 }}>{i.product.name}</p>
                <p style={{ color: '#E74C3C', margin: 0 }}>NT${Number(i.product.price).toLocaleString()}</p>
              </div>
              <div style={s.qtyRow}>
                <button style={s.qtyBtn} onClick={() => adjustQty(i.product.id, -1)}>－</button>
                <span style={{ minWidth: 24, textAlign: 'center' }}>{i.quantity}</span>
                <button style={s.qtyBtn} onClick={() => adjustQty(i.product.id, 1)}>＋</button>
              </div>
            </div>
          ))
        )}
        <div style={{ ...s.row, fontWeight: 700, marginTop: 16 }}>
          <span>合計</span>
          <span style={{ color: '#E74C3C' }}>NT${total.toLocaleString()}</span>
        </div>
        <button onClick={() => setStep('confirm')} disabled={cart.length === 0} style={s.btn}>前往結帳</button>
        <button onClick={() => setStep('menu')} style={{ ...s.btn, background: '#888', marginTop: 8 }}>繼續點餐</button>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ ...s.title, marginBottom: 0 }}>點餐</h2>
        {cart.length > 0 && (
          <button onClick={() => setStep('cart')} style={s.cartBadge}>
            🛒 {cart.reduce((n, i) => n + i.quantity, 0)}
          </button>
        )}
      </div>
      {menu.length === 0 ? <p style={{ textAlign: 'center', color: '#aaa' }}>目前無商品</p> :
        menu.map((cat) => (
          <div key={cat.id}>
            <p style={s.catName}>{cat.name}</p>
            {cat.products.map((p) => {
              const qty = cart.find((i) => i.product.id === p.id)?.quantity ?? 0;
              return (
                <div key={p.id} style={s.productCard}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, margin: 0 }}>{p.name}</p>
                    {p.description && <p style={{ color: '#888', fontSize: 13, margin: '2px 0' }}>{p.description}</p>}
                    <p style={{ color: '#E74C3C', fontWeight: 700 }}>NT${Number(p.price).toLocaleString()}</p>
                  </div>
                  {qty === 0 ? (
                    <button style={s.addBtn} onClick={() => addToCart(p)}>加入</button>
                  ) : (
                    <div style={s.qtyRow}>
                      <button style={s.qtyBtn} onClick={() => adjustQty(p.id, -1)}>－</button>
                      <span style={{ minWidth: 24, textAlign: 'center' }}>{qty}</span>
                      <button style={s.qtyBtn} onClick={() => adjustQty(p.id, 1)}>＋</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      }
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 20, maxWidth: 420, margin: '0 auto', fontFamily: 'sans-serif' },
  center: { padding: 60, textAlign: 'center', fontFamily: 'sans-serif' },
  title: { color: '#27ACB2', marginBottom: 16 },
  catName: { fontWeight: 700, fontSize: 16, color: '#555', borderBottom: '2px solid #27ACB2', paddingBottom: 4, marginTop: 20 },
  productCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  addBtn: { background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 16px', cursor: 'pointer', fontWeight: 700 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: '50%', border: '2px solid #27ACB2', background: '#fff', color: '#27ACB2', fontSize: 16, cursor: 'pointer', lineHeight: 1 },
  cartBadge: { background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', fontSize: 15 },
  cartItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '8px 0' },
  label: { display: 'block', color: '#555', fontSize: 14, marginTop: 12, marginBottom: 4 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' },
  btn: { display: 'block', width: '100%', marginTop: 16, padding: 14, background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 700 },
};
