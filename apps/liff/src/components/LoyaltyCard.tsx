import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface Program { id: string; name: string; stampsRequired: number; rewardDescription: string }
interface Card { stamps: number; totalEarned: number; program: Program }

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function post(path: string, body: unknown) {
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

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

export function LoyaltyCard({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

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
      await post('/public/loyalty/redeem', { merchantId, lineUserId, programId: selected.id });
      setMsg('已成功兌換獎勵！');
      setMsgType('success');
      const updated = await get<Card>(`/public/loyalty/card?merchantId=${merchantId}&lineUserId=${lineUserId}&programId=${selected.id}`);
      setCard(updated);
    } catch (e: unknown) {
      setMsg((e as Error).message);
      setMsgType('error');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#94A3B8', fontSize: 14 }}>載入中...</span>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#94A3B8', fontSize: 14 }}>目前無集點活動</span>
      </div>
    );
  }

  const prog = selected!;
  const stamps = card?.stamps ?? 0;
  const required = prog.stampsRequired;
  const pct = Math.min((stamps / required) * 100, 100);
  const totalRows = Math.ceil(required / 10);
  const stampsPerRow = Math.ceil(required / totalRows);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>集點卡</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 460, margin: '0 auto', padding: 16 }}>

        {/* Program tabs */}
        {programs.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: p.id === selected?.id ? 'none' : '1px solid #E2E8F0',
                  background: p.id === selected?.id ? '#7C3AED' : '#FFFFFF',
                  color: p.id === selected?.id ? '#FFFFFF' : '#64748B',
                  fontFamily: FONT,
                  transition: 'all 0.2s',
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Main loyalty card */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)',
          borderRadius: 20,
          padding: 24,
          color: '#FFFFFF',
          marginBottom: 16,
        }}>
          {/* Program name */}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
            {prog.name}
          </div>

          {/* Stamps progress text */}
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
            {stamps} / {required} 點
          </div>

          {/* Progress bar */}
          <div style={{
            height: 8,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
            margin: '0 0 16px 0',
          }}>
            <div style={{
              height: '100%',
              background: '#FFFFFF',
              borderRadius: 4,
              width: `${pct}%`,
              transition: 'width 0.5s',
            }} />
          </div>

          {/* Stamps grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' }}>
            {Array.from({ length: required }).map((_, i) => {
              const filled = i < stamps;
              return (
                <div
                  key={i}
                  style={{
                    width: `calc((100% - ${(stampsPerRow - 1) * 6}px) / ${stampsPerRow})`,
                    maxWidth: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    background: filled ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    color: filled ? '#7C3AED' : 'rgba(255,255,255,0.5)',
                    boxShadow: filled ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {filled ? '★' : '☆'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Reward info card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid #EDF0F7',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            兌換獎勵
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            {prog.rewardDescription}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>
            累計獲得 {card?.totalEarned ?? 0} 點
          </div>
        </div>

        {/* Redeem button */}
        {stamps >= required && (
          <button
            onClick={handleRedeem}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              background: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
              marginBottom: 12,
            }}
          >
            立即兌換獎勵
          </button>
        )}

        {/* Success/error message */}
        {msg && (
          <div style={{
            textAlign: 'center',
            marginTop: 8,
          }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: msgType === 'success' ? '#D1FAE5' : '#FEE2E2',
              color: msgType === 'success' ? '#065F46' : '#991B1B',
            }}>
              {msg}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
