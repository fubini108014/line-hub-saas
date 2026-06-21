'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Service { id: string; name: string; price: number; durationMinutes: number; description?: string; }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: '', price: '', durationMinutes: '60', description: '' });
  const [adding, setAdding] = useState(false);

  const load = () => api.get<Service[]>('/services').then(setServices);
  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/services', { ...form, price: parseFloat(form.price), durationMinutes: parseInt(form.durationMinutes) });
      setForm({ name: '', price: '', durationMinutes: '60', description: '' });
      load();
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要停用此服務嗎？')) return;
    await api.delete(`/services/${id}`);
    load();
  };

  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>服務項目設定</h1>

      <form onSubmit={handleAdd} style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>新增服務</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={L}>服務名稱</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={I} placeholder="例：剪髮" />
          </div>
          <div>
            <label style={L}>價格（元）</label>
            <input required type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={I} placeholder="500" />
          </div>
          <div>
            <label style={L}>服務時長（分鐘）</label>
            <input required type="number" min="15" step="15" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} style={I} />
          </div>
          <div>
            <label style={L}>簡短描述（選填）</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={I} />
          </div>
        </div>
        <button type="submit" disabled={adding} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          {adding ? '新增中...' : '+ 新增服務'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {services.map(s => (
          <div key={s.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 15 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                NT${Number(s.price).toLocaleString()} · {s.durationMinutes} 分鐘
                {s.description && ` · ${s.description}`}
              </div>
            </div>
            <button onClick={() => handleDelete(s.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E74C3C', background: '#fff', color: '#E74C3C', cursor: 'pointer', fontSize: 13 }}>
              停用
            </button>
          </div>
        ))}
        {services.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>尚未設定任何服務</p>}
      </div>
    </div>
  );
}

const L: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 5, color: '#555' };
const I: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' };
