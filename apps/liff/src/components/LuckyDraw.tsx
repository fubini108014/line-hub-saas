import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface Prize { id: string; name: string; description?: string; probability: number }
interface Campaign { id: string; title: string; description?: string; type: string; prizes: Prize[]; maxEntriesPerMember: number }
interface DrawResult { isWinner: boolean; prize?: { name: string; description?: string } }

const WHEEL_COLORS = ['#27ACB2', '#FFC107', '#E74C3C', '#8E44AD', '#2ECC71', '#F39C12', '#3498DB', '#E67E22'];

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

  if (loading) return <div style={s.center}>載入中...</div>;
  if (!campaign) return <div style={s.center}><p style={{ fontSize: 40 }}>🎲</p><p style={{ color: '#888' }}>目前無抽獎活動</p></div>;

  const prizes = campaign.prizes;
  const segAngle = 360 / prizes.length;

  return (
    <div style={s.wrap}>
      <h2 style={s.title}>{campaign.title}</h2>
      {campaign.description && <p style={s.desc}>{campaign.description}</p>}

      <div style={s.wheelWrap}>
        {/* Pointer */}
        <div style={s.pointer}>▼</div>

        {/* Wheel */}
        <div
          style={{
            ...s.wheel,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          <svg width={260} height={260} viewBox="0 0 260 260">
            {prizes.map((prize, i) => {
              const startAngle = (i * segAngle - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * segAngle - 90) * (Math.PI / 180);
              const r = 125;
              const cx = 130;
              const cy = 130;
              const x1 = cx + r * Math.cos(startAngle);
              const y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle);
              const y2 = cy + r * Math.sin(endAngle);
              const largeArc = segAngle > 180 ? 1 : 0;
              const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
              const tx = cx + 75 * Math.cos(midAngle);
              const ty = cy + 75 * Math.sin(midAngle);

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
            <circle cx={130} cy={130} r={18} fill="#fff" />
          </svg>
        </div>
      </div>

      <button onClick={spin} disabled={spinning} style={{ ...s.spinBtn, opacity: spinning ? 0.6 : 1 }}>
        {spinning ? '抽獎中...' : '開始抽獎'}
      </button>

      {result && (
        <div style={{ ...s.resultBox, background: result.isWinner ? '#fff8e1' : '#f5f5f5' }}>
          {result.isWinner ? (
            <>
              <p style={{ fontSize: 40 }}>🎉</p>
              <p style={s.resultTitle}>恭喜中獎！</p>
              <p style={s.prizeName}>{result.prize?.name}</p>
              {result.prize?.description && <p style={{ color: '#888' }}>{result.prize.description}</p>}
            </>
          ) : (
            <>
              <p style={{ fontSize: 40 }}>😊</p>
              <p style={s.resultTitle}>感謝參與</p>
              <p style={{ color: '#888' }}>這次沒有獲獎，下次再來！</p>
            </>
          )}
        </div>
      )}

      {error && <p style={{ color: '#E74C3C', textAlign: 'center', marginTop: 12 }}>{error}</p>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { padding: 20, maxWidth: 400, margin: '0 auto', fontFamily: 'sans-serif', textAlign: 'center' },
  center: { padding: 60, textAlign: 'center', fontFamily: 'sans-serif' },
  title: { color: '#27ACB2', marginBottom: 8 },
  desc: { color: '#888', marginBottom: 16 },
  wheelWrap: { position: 'relative', display: 'inline-block', marginBottom: 24 },
  pointer: { position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 24, color: '#E74C3C', zIndex: 10 },
  wheel: { display: 'block' },
  spinBtn: { padding: '14px 48px', background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 50, fontSize: 18, cursor: 'pointer', fontWeight: 900 },
  resultBox: { marginTop: 24, borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  resultTitle: { fontSize: 22, fontWeight: 700, margin: '8px 0 4px' },
  prizeName: { fontSize: 26, fontWeight: 900, color: '#E74C3C' },
};
