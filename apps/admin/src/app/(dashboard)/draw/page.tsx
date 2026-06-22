'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Prize { id: string; name: string; probability: number; totalCount?: number; claimedCount: number }
interface Campaign {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  prizes: Prize[];
  _count: { entries: number };
}

const INIT_PRIZE = { name: '', probability: 0.1, totalCount: '' };

export default function DrawPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'WHEEL', startAt: '', endAt: '', maxEntriesPerMember: 1 });
  const [prizes, setPrizes] = useState([{ ...INIT_PRIZE }]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [createError, setCreateError] = useState('');

  const token = () => localStorage.getItem('accessToken');
  const h = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const load = () => {
    fetch(`${API}/draw/campaigns`, { headers: h() }).then((r) => r.json()).then((d) => setCampaigns(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const loadEntries = (c: Campaign) => {
    setSelected(c);
    fetch(`${API}/draw/campaigns/${c.id}/entries`, { headers: h() }).then((r) => r.json()).then((d) => setEntries(Array.isArray(d) ? d : []));
  };

  const create = async () => {
    setCreateError('');
    if (!form.title) { setCreateError('請填寫活動名稱'); return; }
    if (!form.startAt || !form.endAt) { setCreateError('請填寫活動開始與結束時間'); return; }
    const emptyPrize = prizes.findIndex((p) => !p.name);
    if (emptyPrize >= 0) { setCreateError(`請填寫第 ${emptyPrize + 1} 個獎品名稱`); return; }
    try {
      const res = await fetch(`${API}/draw/campaigns`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({
          ...form,
          prizes: prizes.map((p) => ({ name: p.name, probability: +p.probability, totalCount: p.totalCount ? +p.totalCount : null })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `建立失敗（${res.status}）`);
      }
      setForm({ title: '', description: '', type: 'WHEEL', startAt: '', endAt: '', maxEntriesPerMember: 1 });
      setPrizes([{ ...INIT_PRIZE }]);
      setAdding(false);
      load();
    } catch (e: any) {
      setCreateError(e.message || '建立失敗，請稍後再試');
    }
  };

  const addPrize = () => setPrizes((p) => [...p, { ...INIT_PRIZE }]);
  const updatePrize = (i: number, patch: any) => setPrizes((p) => p.map((x, idx) => idx === i ? { ...x, ...patch } : x));

  if (selected) {
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => setSelected(null)} style={{ ...btn, background: '#888', marginBottom: 16 }}>← 返回</button>
        <h2 style={{ color: '#27ACB2' }}>{selected.title} — 抽獎紀錄</h2>
        <p style={{ color: '#888' }}>共 {selected._count.entries} 次抽獎</p>
        {entries.length === 0 ? <p style={{ color: '#aaa' }}>尚無紀錄</p> :
          entries.slice(0, 50).map((e) => (
            <div key={e.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700 }}>{e.member.displayName || e.member.lineUserId}</span>
                <span style={{ marginLeft: 12, color: e.isWinner ? '#27ACB2' : '#aaa' }}>
                  {e.isWinner ? `🎉 ${e.prize?.name}` : '未中獎'}
                </span>
              </div>
              <span style={{ color: '#aaa', fontSize: 13 }}>{new Date(e.drawnAt).toLocaleString('zh-TW')}</span>
            </div>
          ))
        }
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#27ACB2', margin: 0 }}>🎰 抽獎活動</h1>
        <button onClick={() => setAdding(true)} style={btn}>+ 新增活動</button>
      </div>

      {adding && (
        <div style={formBox}>
          <h3 style={{ marginTop: 0 }}>建立抽獎活動</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>活動名稱 *</label>
              <input style={inp} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例：夏日抽獎活動" />
            </div>
            <div>
              <label style={lbl}>開始時間</label>
              <input style={inp} type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>結束時間</label>
              <input style={inp} type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>每人抽獎次數</label>
              <input style={inp} type="number" min={1} value={form.maxEntriesPerMember} onChange={(e) => setForm({ ...form, maxEntriesPerMember: +e.target.value })} />
            </div>
          </div>

          <h4 style={{ marginBottom: 8 }}>獎品設定</h4>
          {prizes.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input style={{ ...inp, flex: 2 }} value={p.name} onChange={(e) => updatePrize(i, { name: e.target.value })} placeholder="獎品名稱" />
              <input style={{ ...inp, flex: 1 }} type="number" step={0.01} min={0} max={1} value={p.probability} onChange={(e) => updatePrize(i, { probability: e.target.value })} placeholder="機率 0~1" />
              <input style={{ ...inp, flex: 1 }} type="number" min={1} value={p.totalCount} onChange={(e) => updatePrize(i, { totalCount: e.target.value })} placeholder="數量（選填）" />
              {prizes.length > 1 && <button onClick={() => setPrizes((p) => p.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#E74C3C', cursor: 'pointer', fontSize: 20 }}>✕</button>}
            </div>
          ))}
          <p style={{ color: '#888', fontSize: 12, marginTop: 4 }}>機率：所有獎品機率之和 ≤ 1，剩餘機率為未中獎</p>
          <button onClick={addPrize} style={{ ...btn, background: '#888', marginBottom: 12 }}>+ 新增獎品</button>
          {createError && <p style={{ color: '#E74C3C', marginBottom: 8, fontSize: 14 }}>⚠️ {createError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={create} style={btn}>建立活動</button>
            <button onClick={() => { setAdding(false); setCreateError(''); }} style={{ ...btn, background: '#888' }}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : campaigns.length === 0 ? <p style={{ color: '#aaa' }}>尚無抽獎活動</p> :
        campaigns.map((c) => (
          <div key={c.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{c.title}</p>
                <p style={{ color: '#888', fontSize: 13, margin: '4px 0' }}>
                  {new Date(c.startAt).toLocaleDateString('zh-TW')} ~ {new Date(c.endAt).toLocaleDateString('zh-TW')}
                  {' · '}已抽 {c._count.entries} 次
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {c.prizes.map((p) => (
                    <span key={p.id} style={{ background: '#f0f0f0', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: '#555' }}>
                      {p.name} ({(p.probability * 100).toFixed(1)}%){p.totalCount ? ` ×${p.totalCount - p.claimedCount}剩` : ''}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => loadEntries(c)} style={{ ...btn, background: '#8E44AD' }}>查看紀錄</button>
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
