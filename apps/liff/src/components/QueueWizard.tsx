import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;
const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

interface QueueStatus {
  entry: { id: string; queueNumber: number; status: string; customerName: string };
  aheadCount: number;
  session: { isOpen: boolean };
}

export function QueueWizard({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [step, setStep] = useState<'check' | 'form' | 'confirm' | 'waiting'>('check');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadStatus = () => {
    fetch(`${BASE}/public/queue/status?merchantId=${merchantId}&lineUserId=${lineUserId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStatus(data);
          setStep('waiting');
        } else {
          setStatus(null);
          setStep('check');
        }
      });
    fetch(`${BASE}/public/queue/session?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then((session) => { if (session) setSessionOpen(session.isOpen); })
      .finally(() => setLoading(false));
  };

  const cancelQueueEntry = async () => {
    if (!status?.entry?.id) return;
    if (!window.confirm('確定要取消候位嗎？')) return;
    setCancelling(true);
    try {
      const res = await fetch(`${BASE}/public/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, lineUserId, entryId: status.entry.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '取消失敗' }));
        throw new Error(err.message);
      }
      setStatus(null);
      setStep('check');
    } catch (e: any) {
      alert(e.message || '取消失敗，請重試');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const join = async () => {
    setJoining(true);
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
    } finally {
      setJoining(false);
    }
  };

  const proceedToConfirm = () => {
    if (!name.trim() || !phone.trim()) { setError('請填寫姓名與電話'); return; }
    if (!/^09\d{8}$/.test(phone)) { setError('電話格式不正確（09xxxxxxxx）'); return; }
    setError('');
    setStep('confirm');
  };

  const estWait = status ? status.aheadCount * 10 : 0;

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
        <p style={{ color: '#94A3B8', fontSize: 15 }}>載入中...</p>
      </div>
    );
  }

  // ── Waiting / Success ──
  if (step === 'waiting' && status) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>候位管理</span>
        </div>

        <div style={{ flex: 1, padding: '32px 16px 120px', maxWidth: 460, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {status.entry.status === 'CALLED' && (
            <div style={{ background: '#D1FAE5', border: '1.5px solid #10B981', borderRadius: 14, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🔔</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#065F46' }}>輪到您了！請前往服務台</span>
            </div>
          )}

          {/* Queue number circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16, fontWeight: 500 }}>您的候位號碼</p>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
            }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>{status.entry.queueNumber}</span>
            </div>
          </div>

          {/* Info card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #EDF0F7', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #EDF0F7', marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: '#64748B' }}>前方等待</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{status.aheadCount} 組</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#64748B' }}>預估等待</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#7C3AED' }}>{estWait} 分鐘</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={loadStatus}
              style={{ width: '100%', height: 48, background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: FONT }}
            >
              重新整理
            </button>
            <button
              onClick={cancelQueueEntry}
              disabled={cancelling}
              style={{
                width: '100%',
                height: 48,
                background: '#FEE2E2',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                color: '#EF4444',
                cursor: cancelling ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                transition: 'opacity 0.2s',
              }}
            >
              {cancelling ? '取消中...' : '取消候位'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Session closed ──
  if (!sessionOpen) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>候位管理</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
          <p style={{ fontSize: 17, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>今日候位尚未開放</p>
          <p style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>請稍後再試，或洽詢現場人員</p>
        </div>
      </div>
    );
  }

  // ── Step: check (landing) ──
  if (step === 'check') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>候位管理</span>
        </div>
        <div style={{ flex: 1, padding: '32px 16px 120px', maxWidth: 460, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #EDF0F7', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', padding: '24px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, color: '#64748B', textAlign: 'center', margin: 0 }}>立即加入候位名單，輪到您時自動通知</p>
          </div>
        </div>
        <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
          <div style={{ maxWidth: 460, margin: '0 auto' }}>
            <button
              onClick={() => setStep('form')}
              style={{ width: '100%', height: 52, background: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: 14, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
            >
              立即取號
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: form ──
  if (step === 'form') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>候位管理</span>
        </div>

        <div style={{ flex: 1, padding: '24px 16px 120px', maxWidth: 460, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* Info card */}
          <div style={{ background: '#EDE9FE', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>目前候位</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED', margin: 0 }}>—</p>
            </div>
            <div style={{ width: 1, background: '#C4B5FD' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>預估等待</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED', margin: 0 }}>— 分</p>
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              姓名 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, color: '#0F172A', background: '#FFFFFF', boxSizing: 'border-box', fontFamily: FONT, outline: 'none' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="您的姓名"
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              電話 <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, color: '#0F172A', background: '#FFFFFF', boxSizing: 'border-box', fontFamily: FONT, outline: 'none' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              inputMode="tel"
            />
          </div>

          {/* Party size */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10 }}>人數</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <button
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid #E2E8F0', background: '#FFFFFF', color: '#334155', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
              >－</button>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', minWidth: 32, textAlign: 'center' }}>{partySize}</span>
              <button
                style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid #7C3AED', background: '#EDE9FE', color: '#7C3AED', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}
                onClick={() => setPartySize(Math.min(20, partySize + 1))}
              >＋</button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
              <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
          <div style={{ maxWidth: 460, margin: '0 auto' }}>
            <button
              onClick={proceedToConfirm}
              style={{ width: '100%', height: 52, background: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: 14, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
            >
              加入候位
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: confirm ──
  if (step === 'confirm') {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>確認候位資訊</span>
        </div>

        <div style={{ flex: 1, padding: '24px 16px 120px', maxWidth: 460, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #EDF0F7', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', overflow: 'hidden', marginBottom: 16 }}>
            {[
              { label: '姓名', value: name },
              { label: '電話', value: phone },
              { label: '人數', value: `${partySize} 人` },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid #EDF0F7' : 'none' }}>
                <span style={{ fontSize: 14, color: '#64748B' }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginTop: 4 }}>
              <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
          <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('form')}
              style={{ flex: 1, height: 52, background: '#FFFFFF', color: '#334155', border: '1.5px solid #E2E8F0', borderRadius: 14, fontSize: 15.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
            >
              返回修改
            </button>
            <button
              onClick={join}
              disabled={joining}
              style={{ flex: 2, height: 52, background: joining ? '#A78BFA' : '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: 14, fontSize: 15.5, fontWeight: 700, cursor: joining ? 'not-allowed' : 'pointer', fontFamily: FONT }}
            >
              {joining ? '加入中...' : '確認加入'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
