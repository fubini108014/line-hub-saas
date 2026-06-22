'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OrderItem { id: string; productName: string; quantity: number; unitPrice: number }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  note?: string;
  pickupTime?: string;
  createdAt: string;
  member: { displayName?: string; lineUserId: string };
  items: OrderItem[];
}
interface Product { id: string; name: string; price: number; isAvailable: boolean; category?: { name: string } }

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待確認', CONFIRMED: '已確認', PREPARING: '製作中', READY: '可取餐', COMPLETED: '已完成', CANCELLED: '已取消',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: '#FFC107', CONFIRMED: '#27ACB2', PREPARING: '#8E44AD', READY: '#2ECC71', COMPLETED: '#888', CANCELLED: '#E74C3C',
};
const NEXT_STATUS: Record<string, string> = { PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' };

export default function OrdersPage() {
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState({ name: '', price: '', categoryName: '' });
  const [loading, setLoading] = useState(true);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const token = () => localStorage.getItem('accessToken');
  const h = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const loadOrders = () => fetch(`${API}/orders`, { headers: h() }).then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : []));
  const loadProducts = () => fetch(`${API}/orders/products`, { headers: h() }).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : []));

  useEffect(() => {
    Promise.all([loadOrders(), loadProducts()]).finally(() => setLoading(false));
  }, []);

  const nextStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await fetch(`${API}/orders/${order.id}/status`, {
      method: 'PATCH', headers: h(), body: JSON.stringify({ status: next }),
    });
    loadOrders();
  };

  const cancelOrder = async (id: string) => {
    await fetch(`${API}/orders/${id}/status`, {
      method: 'PATCH', headers: h(), body: JSON.stringify({ status: 'CANCELLED' }),
    });
    loadOrders();
  };

  const addProduct = async () => {
    setAddError('');
    setAddSuccess('');
    if (!productForm.name || !productForm.price) {
      setAddError('請填寫商品名稱與價格');
      return;
    }
    try {
      let categoryId: string | undefined;
      if (productForm.categoryName) {
        const catRes = await fetch(`${API}/orders/categories`, {
          method: 'POST', headers: h(), body: JSON.stringify({ name: productForm.categoryName }),
        });
        if (!catRes.ok) {
          const err = await catRes.json().catch(() => ({}));
          throw new Error(err.message || `分類建立失敗（${catRes.status}）`);
        }
        const cat = await catRes.json();
        categoryId = cat.id;
      }
      const body: Record<string, unknown> = { name: productForm.name, price: +productForm.price };
      if (categoryId) body.categoryId = categoryId;
      const res = await fetch(`${API}/orders/products`, {
        method: 'POST', headers: h(), body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `商品新增失敗（${res.status}）`);
      }
      setProductForm({ name: '', price: '', categoryName: '' });
      setAddSuccess('商品已新增');
      loadProducts();
    } catch (e: any) {
      setAddError(e.message || '新增失敗，請稍後再試');
    }
  };

  const toggleProduct = async (p: Product) => {
    await fetch(`${API}/orders/products/${p.id}`, {
      method: 'PATCH', headers: h(), body: JSON.stringify({ isAvailable: !p.isAvailable }),
    });
    loadProducts();
  };

  const activeOrders = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status));

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: '#27ACB2', marginBottom: 24 }}>🍽️ 點餐管理</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('orders')} style={{ ...btn, background: tab === 'orders' ? '#27ACB2' : '#ddd', color: tab === 'orders' ? '#fff' : '#555' }}>訂單管理</button>
        <button onClick={() => setTab('products')} style={{ ...btn, background: tab === 'products' ? '#27ACB2' : '#ddd', color: tab === 'products' ? '#fff' : '#555' }}>商品管理</button>
      </div>

      {loading ? <p>載入中...</p> : tab === 'orders' ? (
        <>
          <h3>進行中訂單（{activeOrders.length}）</h3>
          {activeOrders.length === 0 ? <p style={{ color: '#aaa' }}>目前無進行中訂單</p> :
            activeOrders.map((o) => (
              <div key={o.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 900, fontSize: 16 }}>{o.orderNumber}</span>
                    <span style={{ marginLeft: 12, color: '#888', fontSize: 14 }}>{o.member.displayName || o.member.lineUserId}</span>
                    {o.pickupTime && <span style={{ marginLeft: 8, color: '#8E44AD', fontSize: 13 }}>取餐時間 {o.pickupTime}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: STATUS_COLOR[o.status], color: '#fff', padding: '2px 10px', borderRadius: 20, fontSize: 13 }}>{STATUS_LABEL[o.status]}</span>
                    {NEXT_STATUS[o.status] && <button onClick={() => nextStatus(o)} style={{ ...btn, fontSize: 13, padding: '5px 12px' }}>{STATUS_LABEL[NEXT_STATUS[o.status]]}</button>}
                    {['PENDING', 'CONFIRMED'].includes(o.status) && (
                      <button onClick={() => cancelOrder(o.id)} style={{ ...btn, background: '#E74C3C', fontSize: 13, padding: '5px 12px' }}>取消</button>
                    )}
                  </div>
                </div>
                {o.items.map((item) => (
                  <div key={item.id} style={{ color: '#555', fontSize: 14 }}>
                    {item.productName} × {item.quantity} — NT${(Number(item.unitPrice) * item.quantity).toLocaleString()}
                  </div>
                ))}
                <div style={{ marginTop: 8, fontWeight: 700 }}>合計：NT${Number(o.subtotal).toLocaleString()}</div>
                {o.note && <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>備註：{o.note}</p>}
              </div>
            ))
          }
        </>
      ) : (
        <>
          <div style={formBox}>
            <h3 style={{ marginTop: 0 }}>新增商品</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
              <input style={inp} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="商品名稱" />
              <input style={inp} type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="價格" />
              <input style={inp} value={productForm.categoryName} onChange={(e) => setProductForm({ ...productForm, categoryName: e.target.value })} placeholder="分類（選填）" />
            </div>
            <button onClick={addProduct} style={{ ...btn, marginTop: 8 }}>新增</button>
            {addError && <p style={{ color: '#E74C3C', marginTop: 8, fontSize: 14 }}>⚠️ {addError}</p>}
            {addSuccess && <p style={{ color: '#2ECC71', marginTop: 8, fontSize: 14 }}>✓ {addSuccess}</p>}
          </div>
          {products.length === 0 ? <p style={{ color: '#aaa' }}>尚無商品</p> :
            products.map((p) => (
              <div key={p.id} style={{ ...card, opacity: p.isAvailable ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {p.category && <span style={{ color: '#aaa', fontSize: 12, marginRight: 8 }}>{p.category.name}</span>}
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span style={{ color: '#E74C3C', fontWeight: 700, marginLeft: 12 }}>NT${Number(p.price).toLocaleString()}</span>
                  </div>
                  <button onClick={() => toggleProduct(p)} style={{ ...btn, background: p.isAvailable ? '#E74C3C' : '#27ACB2', minWidth: 72 }}>
                    {p.isAvailable ? '下架' : '上架'}
                  </button>
                </div>
              </div>
            ))
          }
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: '8px 18px', background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const formBox: React.CSSProperties = { ...card, marginBottom: 20, borderLeft: '4px solid #27ACB2' };
const inp: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' };
