import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

interface Prize { id: string; name: string; description?: string; probability: number }
interface Campaign { id: string; title: string; description?: string; type: string; prizes: Prize[]; maxEntriesPerMember: number }
interface DrawResult { isWinner: boolean; prize?: { name: string; description?: string } }

const WHEEL_COLORS = ['#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

export function LuckyDraw({ merchantId, lineUserId }: { merchantId: string; lineUserId: string }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BASE}/public/draw/active?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then((data) => { if (data) setCampaign(data); })
      .finally(() => setLoading(false));
  }, []);

  const spin = async () => {
    if (!campaign || spinning) return;
    setSpinning(true);
    setResult(null);
    setError('');

    const spins = 5 + Math.random() * 3;
    const extraDeg = Math.random() * 360;
    const finalRotation = rotation + spins * 360 + extraDeg;
    setRotation(finalRotation);

    setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/public/draw/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, lineUserId, campaignId: campaign.id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: '抽獎失敗' }));
          setError(err.message);
        } else {
          const data: DrawResult = await res.json();
          setResult(data);
        }
      } finally {
        setSpinning(false);
      }
    }, 4000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #EDE9FE', borderTopColor: '#7C3AED', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748B', fontSize: 14, fontFamily: FONT, margin: 0 }}>載入中...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎲</div>
          <p style={{ color: '#64748B', fontSize: 15, margin: 0 }}>目前無抽獎活動</p>
        </div>
      </div>
    );
  }

  const prizes = campaign.prizes;
  const segAngle = 360 / prizes.length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, textAlign: 'center' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #EDF0F7', padding: '16px 20px', zIndex: 100 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>抽獎活動</h1>
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px 40px' }}>
        {/* Campaign Title & Description */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 4px' }}>{campaign.title}</h2>
        {campaign.description && (
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, marginTop: 4, lineHeight: 1.5 }}>{campaign.description}</p>
        )}
        {!campaign.description && <div style={{ marginBottom: 24 }} />}

        {/* Wheel Container */}
        <div style={{ display: 'inline-block', position: 'relative', margin: '0 auto' }}>
          {/* SVG Pointer */}
          <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
              <path d="M12 32 L0 0 L24 0 Z" fill="#7C3AED" />
            </svg>
          </div>

          {/* Spinning Wheel */}
          <div
            style={{
              display: 'block',
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              borderRadius: '50%',
              boxShadow: '0 4px 24px rgba(124,58,237,0.2)',
            }}
          >
            <svg width={280} height={280} viewBox="0 0 280 280">
              {prizes.map((prize, i) => {
                const startAngle = (i * segAngle - 90) * (Math.PI / 180);
                const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
                const r = 135;
                const cx = 140;
                const cy = 140;
                const x1 = cx + r * Math.cos(startAngle);
                const y1 = cy + r * Math.sin(startAngle);
                const x2 = cx + r * Math.cos(endAngle);
                const y2 = cy + r * Math.sin(endAngle);
                const largeArc = segAngle > 180 ? 1 : 0;
                const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
                const tx = cx + 82 * Math.cos(midAngle);
                const ty = cy + 82 * Math.sin(midAngle);

                return (
                  <g key={prize.id}>
                    <path
                      d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                    />
                    <text
                      x={tx} y={ty}
                      fill="#fff"
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${(i + 0.5) * segAngle}, ${tx}, ${ty})`}
                    >
                      {prize.name.slice(0, 6)}
                    </text>
                  </g>
                );
              })}
              <circle cx={140} cy={140} r={20} fill="#fff" />
              <circle cx={140} cy={140} r={14} fill="#EDE9FE" />
            </svg>
          </div>
        </div>

        {/* Spin Button */}
        <div style={{ marginTop: 32 }}>
          <button
            onClick={spin}
            disabled={spinning}
            style={{
              padding: '14px 56px',
              borderRadius: 50,
              border: 'none',
              background: '#7C3AED',
              color: '#fff',
              fontSize: 17,
              fontWeight: 800,
              cursor: spinning ? 'not-allowed' : 'pointer',
              opacity: spinning ? 0.5 : 1,
              fontFamily: FONT,
              letterSpacing: '-0.01em',
              boxShadow: spinning ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
              transition: 'opacity 0.2s, box-shadow 0.2s',
            }}
          >
            {spinning ? '抽獎中...' : '開始抽獎'}
          </button>
        </div>

        {/* Result Box */}
        {result && (
          <div style={{ marginTop: 32, animation: 'fadeInUp 0.4s ease-out' }}>
            {result.isWinner ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #FEF3C7, #D1FAE5)',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: '0 4px 24px rgba(245,158,11,0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#64748B', margin: '0 0 8px' }}>恭喜中獎！</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 8px' }}>{result.prize?.name}</p>
                {result.prize?.description && (
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{result.prize.description}</p>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 20,
                  padding: 28,
                  border: '1px solid #EDF0F7',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>😊</div>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#334155', margin: '0 0 8px' }}>感謝參與</p>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>這次沒有獲獎，下次再來！</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p style={{ color: '#EF4444', textAlign: 'center', marginTop: 16, fontSize: 14, fontWeight: 500 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
