'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Coupon {
  id: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  totalLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  _count: { claims: number };
}

const INIT = { title: '', description: '', discountType: 'PERCENTAGE', discountValue: 10, totalLimit: '', validFrom: '', validUntil: '' };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<any>(INIT);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem('accessToken');
  const h = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const load = () => {
    fetch(`${API}/coupons`, { headers: h() }).then((r) => r.json()).then(setCoupons).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.validFrom || !form.validUntil) return;
    await fetch(`${API}/coupons`, {
      method: 'POST', headers: h(),
      body: JSON.stringify({
        ...form,
        discountValue: +form.discountValue,
        totalLimit: form.totalLimit ? +form.totalLimit : null,
        perMemberLimit: 1,
      }),
    });
    setForm(INIT);
    setAdding(false);
    load();
  };

  const toggle = async (c: Coupon) => {
    await fetch(`${API}/coupons/${c.id}`, {
      method: 'PATCH', headers: h(),
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  };

  const discountText = (c: Coupon) =>
    c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `折 NT$${c.discountValue}`;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#27ACB2', margin: 0 }}>🎟️ 優惠券管理</h1>
        <button onClick={() => setAdding(true)} style={btn}>+ 新增優惠券</button>
      </div>

      {adding && (
        <div style={formBox}>
          <h3 style={{ marginTop: 0 }}>新增優惠券</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>標題</label>
              <input style={inp} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="優惠券名稱" />
            </div>
            <div>
              <label style={lbl}>折扣類型</label>
              <select style={inp} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="PERCENTAGE">百分比折扣</option>
                <option value="FIXED">固定折扣金額</option>
              </select>
            </div>
            <div>
              <label style={lbl}>{form.discountType === 'PERCENTAGE' ? '折扣 %' : '折扣金額 NT$'}</label>
              <input style={inp} type="number" min={1} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>數量上限（留空=無限）</label>
              <input style={inp} type="number" min={1} value={form.totalLimit} onChange={(e) => setForm({ ...form, totalLimit: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>開始日期</label>
              <input style={inp} type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>結束日期</label>
              <input style={inp} type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>說明（選填）</label>
              <input style={inp} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="使用條件、注意事項..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={create} style={btn}>儲存</button>
            <button onClick={() => setAdding(false)} style={{ ...btn, background: '#888' }}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : coupons.length === 0 ? <p style={{ color: '#aaa' }}>尚無優惠券</p> :
        coupons.map((c) => (
          <div key={c.id} style={{ ...card, opacity: c.isActive ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#E74C3C', marginRight: 12 }}>{discountText(c)}</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{c.title}</span>
                {c.description && <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>{c.description}</span>}
                <div style={{ marginTop: 6, fontSize: 13, color: '#888' }}>
                  已領取 {c._count.claims} 張
                  {c.totalLimit && ` / 限 ${c.totalLimit} 張`}
                  {' · '}
                  {new Date(c.validFrom).toLocaleDateString('zh-TW')} ~ {new Date(c.validUntil).toLocaleDateString('zh-TW')}
                </div>
              </div>
              <button onClick={() => toggle(c)} style={{ ...btn, background: c.isActive ? '#E74C3C' : '#27ACB2', minWidth: 72 }}>
                {c.isActive ? '停用' : '啟用'}
              </button>
            </div>
          </div>
        ))
      }
    </div>
  );
}

const btn: React.CSSProperties = { padding: '8px 18px', background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const formBox: React.CSSProperties = { ...card, marginBottom: 24, borderLeft: '4px solid #27ACB2' };
const lbl: React.CSSProperties = { display: 'block', color: '#555', fontSize: 14, marginBottom: 4 };
const inp: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' };
