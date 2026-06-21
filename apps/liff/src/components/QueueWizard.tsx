import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface QueueStatus {
  entry: { queueNumber: number; status: string; customerName: string };
  aheadCount: number;
  session: { isOpen: boolean };
}

export function QueueWizard({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [step, setStep] = useState<'check' | 'form' | 'waiting'>('check');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStatus = () => {
    fetch(`${BASE}/public/queue/status?merchantId=${merchantId}&lineUserId=${lineUserId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) { setStatus(data); setStep('waiting'); }
      });
    fetch(`${BASE}/public/queue/session?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then((session) => { if (session) setSessionOpen(session.isOpen); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStatus(); }, []);

  const join = async () => {
    if (!name.trim() || !phone.trim()) { setError('請填寫姓名與電話'); return; }
    if (!/^09\d{8}$/.test(phone)) { setError('電話格式不正確（09xxxxxxxx）'); return; }
    setError('');
    try {
      const res = await fetch(`${BASE}/public/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, lineUserId, customerName: name, customerPhone: phone, partySize }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '加入失敗' }));
        throw new Error(err.message);
      }
      await loadStatus();
      setStep('waiting');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div style={styles.center}>載入中...</div>;

  if (step === 'waiting' && status) {
    return (
      <div style={styles.wrap}>
        <h2 style={styles.title}>候位號碼</h2>
        <div style={styles.numberBox}>
          <p style={styles.numberLabel}>您的號碼</p>
          <p style={styles.number}>{status.entry.queueNumber}</p>
          <p style={styles.ahead}>前方還有 <b>{status.aheadCount}</b> 組</p>
        </div>
        {status.entry.status === 'CALLED' && (
          <div style={styles.callBanner}>🔔 輪到您了！請前往服務台</div>
        )}
        <button onClick={loadStatus} style={styles.refreshBtn}>重新整理</button>
      </div>
    );
  }

  if (!sessionOpen) {
    return (
      <div style={styles.center}>
        <p style={{ fontSize: 48 }}>🚫</p>
        <p style={{ color: '#888' }}>今日候位尚未開放</p>
      </div>
    );
  }

  if (step === 'check') {
    return (
      <div style={styles.wrap}>
        <h2 style={styles.title}>現場候位</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: 24 }}>立即加入候位名單，輪到您時自動通知</p>
        <button onClick={() => setStep('form')} style={styles.btn}>立即取號</button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>填寫資料</h2>
      <label style={styles.label}>姓名</label>
      <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="您的姓名" />
      <label style={styles.label}>電話</label>
      <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
      <label style={styles.label}>人數</label>
      <div style={styles.counter}>
        <button style={styles.countBtn} onClick={() => setPartySize(Math.max(1, partySize - 1))}>－</button>
        <span style={styles.countNum}>{partySize}</span>
        <button style={styles.countBtn} onClick={() => setPartySize(Math.min(20, partySize + 1))}>＋</button>
      </div>
      {error && <p style={{ color: '#E74C3C', fontSize: 14 }}>{error}</p>}
      <button onClick={join} style={styles.btn}>確認取號</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 24, maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif' },
  center: { padding: 60, textAlign: 'center', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', color: '#27ACB2', marginBottom: 20 },
  numberBox: { background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: 20 },
  numberLabel: { color: '#888', marginBottom: 8 },
  number: { fontSize: 80, fontWeight: 900, color: '#27ACB2', margin: '0 0 8px' },
  ahead: { color: '#555', fontSize: 18 },
  callBanner: { background: '#FFC107', borderRadius: 12, padding: 16, textAlign: 'center', fontWeight: 700, marginBottom: 16 },
  refreshBtn: { display: 'block', width: '100%', padding: 12, background: '#f0f0f0', border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer' },
  label: { display: 'block', color: '#555', fontSize: 14, marginBottom: 4, marginTop: 12 },
  input: { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', fontSize: 16, boxSizing: 'border-box' },
  counter: { display: 'flex', alignItems: 'center', gap: 20, marginTop: 8 },
  countBtn: { width: 40, height: 40, borderRadius: '50%', border: '2px solid #27ACB2', background: '#fff', color: '#27ACB2', fontSize: 20, cursor: 'pointer' },
  countNum: { fontSize: 24, fontWeight: 700, minWidth: 40, textAlign: 'center' },
  btn: { display: 'block', width: '100%', marginTop: 24, padding: 14, background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 700 },
};
