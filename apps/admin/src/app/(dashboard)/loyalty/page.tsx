'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Program { id: string; name: string; stampsRequired: number; rewardDescription: string; isActive: boolean }

export default function LoyaltyPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState({ name: '', stampsRequired: 10, rewardDescription: '' });
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem('accessToken');

  const load = () => {
    fetch(`${API}/loyalty/programs`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json()).then(setPrograms).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.rewardDescription) return;
    await fetch(`${API}/loyalty/programs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', stampsRequired: 10, rewardDescription: '' });
    setAdding(false);
    load();
  };

  const toggle = async (p: Program) => {
    await fetch(`${API}/loyalty/programs/${p.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    load();
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#27ACB2', margin: 0 }}>🎯 集點卡管理</h1>
        <button onClick={() => setAdding(true)} style={btn}>+ 新增集點計畫</button>
      </div>

      {adding && (
        <div style={formBox}>
          <h3 style={{ marginTop: 0 }}>新增集點計畫</h3>
          <label style={lbl}>計畫名稱</label>
          <input style={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：消費集點" />
          <label style={lbl}>所需點數（集滿可兌換）</label>
          <input style={inp} type="number" min={1} value={form.stampsRequired} onChange={(e) => setForm({ ...form, stampsRequired: +e.target.value })} />
          <label style={lbl}>兌換獎勵說明</label>
          <input style={inp} value={form.rewardDescription} onChange={(e) => setForm({ ...form, rewardDescription: e.target.value })} placeholder="例：免費飲料一杯" />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={create} style={btn}>儲存</button>
            <button onClick={() => setAdding(false)} style={cancelBtn}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : programs.length === 0 ? <p style={{ color: '#aaa' }}>尚無集點計畫</p> : (
        programs.map((p) => (
          <div key={p.id} style={{ ...card, opacity: p.isActive ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{p.name}</p>
                <p style={{ color: '#888', fontSize: 14, margin: '4px 0' }}>集滿 {p.stampsRequired} 點 → {p.rewardDescription}</p>
              </div>
              <button onClick={() => toggle(p)} style={{ ...btn, background: p.isActive ? '#E74C3C' : '#27ACB2', minWidth: 72 }}>
                {p.isActive ? '停用' : '啟用'}
              </button>
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 32, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
        <h3 style={{ marginTop: 0 }}>如何讓客戶集點？</h3>
        <p style={{ color: '#555', lineHeight: 1.8 }}>
          透過 API 端點 <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>POST /loyalty/stamp</code> 加蓋章，
          傳入 <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>lineUserId</code>、<code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>programId</code> 即可。
          客戶透過 LIFF（type=loyalty）查看集點進度。
        </p>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = { padding: '8px 18px', background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const cancelBtn: React.CSSProperties = { ...btn, background: '#888' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const formBox: React.CSSProperties = { ...card, marginBottom: 24, borderLeft: '4px solid #27ACB2' };
const lbl: React.CSSProperties = { display: 'block', color: '#555', fontSize: 14, marginBottom: 4, marginTop: 12 };
const inp: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' };
