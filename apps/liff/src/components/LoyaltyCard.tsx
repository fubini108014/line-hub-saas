import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface Program { id: string; name: string; stampsRequired: number; rewardDescription: string }
interface Card { stamps: number; totalEarned: number; program: Program }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function post(path: string, body: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '操作失敗' }));
    throw new Error(err.message);
  }
  return res.json();
}

export function LoyaltyCard({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    get<Program[]>(`/public/loyalty/programs?merchantId=${merchantId}`)
      .then((data) => {
        setPrograms(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .finally(() => setLoading(false));
  }, [merchantId]);

  useEffect(() => {
    if (!selected) return;
    setCard(null);
    get<Card>(`/public/loyalty/card?merchantId=${merchantId}&lineUserId=${lineUserId}&programId=${selected.id}`)
      .then(setCard);
  }, [selected]);

  const handleRedeem = async () => {
    if (!selected || !card) return;
    try {
      await post('/loyalty/redeem', { lineUserId, programId: selected.id });
      setMsg('已成功兌換獎勵！');
      const updated = await get<Card>(`/public/loyalty/card?merchantId=${merchantId}&lineUserId=${lineUserId}&programId=${selected.id}`);
      setCard(updated);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  if (loading) return <div style={styles.center}>載入中...</div>;
  if (programs.length === 0) return <div style={styles.center}>目前無集點活動</div>;

  const prog = selected!;
  const stamps = card?.stamps ?? 0;
  const required = prog.stampsRequired;
  const pct = Math.min((stamps / required) * 100, 100);

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>集點卡</h2>

      {programs.length > 1 && (
        <div style={styles.tabs}>
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              style={{ ...styles.tab, ...(p.id === selected?.id ? styles.tabActive : {}) }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div style={styles.card}>
        <p style={styles.progName}>{prog.name}</p>
        <div style={styles.stampsRow}>
          {Array.from({ length: required }).map((_, i) => (
            <div key={i} style={{ ...styles.stamp, ...(i < stamps ? styles.stampFilled : {}) }}>
              {i < stamps ? '★' : '☆'}
            </div>
          ))}
        </div>
        <div style={styles.bar}>
          <div style={{ ...styles.barFill, width: `${pct}%` }} />
        </div>
        <p style={styles.stampCount}>{stamps} / {required} 點</p>
        <p style={styles.reward}>兌換獎勵：{prog.rewardDescription}</p>
        <p style={styles.total}>累計獲得：{card?.totalEarned ?? 0} 點</p>

        {stamps >= required && (
          <button onClick={handleRedeem} style={styles.btn}>立即兌換獎勵</button>
        )}
        {msg && <p style={{ marginTop: 12, color: '#27ACB2', textAlign: 'center' }}>{msg}</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 20, maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif' },
  center: { padding: 40, textAlign: 'center', color: '#888' },
  title: { textAlign: 'center', color: '#27ACB2', marginBottom: 16 },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' },
  tabActive: { background: '#27ACB2', color: '#fff', border: '1px solid #27ACB2' },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  progName: { fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 16 },
  stampsRow: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 },
  stamp: { width: 36, height: 36, borderRadius: '50%', border: '2px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#ddd' },
  stampFilled: { background: '#27ACB2', borderColor: '#27ACB2', color: '#fff' },
  bar: { height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', background: '#27ACB2', transition: 'width 0.5s' },
  stampCount: { textAlign: 'center', color: '#555', fontSize: 14 },
  reward: { textAlign: 'center', color: '#333', marginTop: 8 },
  total: { textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 4 },
  btn: { display: 'block', width: '100%', marginTop: 16, padding: 14, background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 700 },
};
