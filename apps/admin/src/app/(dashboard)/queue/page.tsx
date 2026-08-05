'use client';
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface QueueEntry { id: string; queueNumber: number; customerName: string; customerPhone: string; partySize: number; status: string; createdAt: string }
interface Session { id: string; isOpen: boolean; currentNumber: number; entries?: QueueEntry[] }

const STATUS_LABEL: Record<string, string> = { WAITING: '等待中', CALLED: '已叫號', COMPLETED: '已完成', CANCELLED: '已取消' };
const STATUS_COLOR: Record<string, string> = { WAITING: '#27ACB2', CALLED: '#FFC107', COMPLETED: '#888', CANCELLED: '#E74C3C' };

export default function QueuePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const token = () => localStorage.getItem('accessToken');
  const h = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

  const load = useCallback(() => {
    fetch(`${API}/queue/today`, { headers: h() })
      .then((r) => r.text())
      .then((t) => setSession(t ? JSON.parse(t) : null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openSession = () => fetch(`${API}/queue/open`, { method: 'POST', headers: h() }).then(load);
  const closeSession = () => fetch(`${API}/queue/close`, { method: 'POST', headers: h() }).then(load);
  const callNext = () => fetch(`${API}/queue/call-next`, { method: 'POST', headers: h() }).then(load);
  const updateEntry = (id: string, status: string) =>
    fetch(`${API}/queue/entries/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify({ status }) }).then(load);

  const waiting = session?.entries?.filter((e) => e.status === 'WAITING') ?? [];
  const called = session?.entries?.filter((e) => e.status === 'CALLED') ?? [];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#27ACB2', margin: 0 }}>🔢 候位管理</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {!session || !session.isOpen
            ? <button onClick={openSession} style={btn}>開始候位</button>
            : <button onClick={closeSession} style={{ ...btn, background: '#E74C3C' }}>結束候位</button>}
          {session?.isOpen && <button onClick={callNext} style={{ ...btn, background: '#8E44AD' }}>叫下一號</button>}
        </div>
      </div>

      {loading ? <p>載入中...</p> : !session ? (
        <div style={emptyBox}>
          <p style={{ fontSize: 48 }}>🚦</p>
          <p style={{ color: '#888' }}>今日尚未開放候位，點擊「開始候位」即可開啟</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={statCard}><p style={statLabel}>目前號碼</p><p style={statVal}>{session.currentNumber}</p></div>
            <div style={statCard}><p style={statLabel}>等待中</p><p style={statVal}>{waiting.length}</p></div>
            <div style={statCard}><p style={statLabel}>狀態</p><p style={{ ...statVal, color: session.isOpen ? '#27ACB2' : '#E74C3C', fontSize: 18 }}>{session.isOpen ? '開放中' : '已結束'}</p></div>
          </div>

          {called.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ color: '#FFC107' }}>📣 已叫號</h3>
              {called.map((e) => (
                <div key={e.id} style={{ ...entryCard, borderLeft: '4px solid #FFC107' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#FFC107', marginRight: 12 }}>#{e.queueNumber}</span>
                      <span style={{ fontWeight: 700 }}>{e.customerName}</span>
                      <span style={{ color: '#888', marginLeft: 8, fontSize: 14 }}>{e.customerPhone} · {e.partySize}人</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateEntry(e.id, 'COMPLETED')} style={{ ...btn, fontSize: 13, padding: '6px 12px' }}>完成</button>
                      <button onClick={() => updateEntry(e.id, 'CANCELLED')} style={{ ...btn, background: '#E74C3C', fontSize: 13, padding: '6px 12px' }}>取消</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3>等待名單（{waiting.length} 組）</h3>
          {waiting.length === 0 ? <p style={{ color: '#aaa' }}>目前無等待</p> :
            waiting.map((e) => (
              <div key={e.id} style={entryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#27ACB2', marginRight: 12 }}>#{e.queueNumber}</span>
                    <span style={{ fontWeight: 700 }}>{e.customerName}</span>
                    <span style={{ color: '#888', marginLeft: 8, fontSize: 14 }}>{e.customerPhone} · {e.partySize}人</span>
                  </div>
                  <button onClick={() => updateEntry(e.id, 'CANCELLED')} style={{ ...btn, background: '#E74C3C', fontSize: 13, padding: '6px 12px' }}>取消</button>
                </div>
              </div>
            ))
          }
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: '8px 18px', background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const statCard: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const statLabel: React.CSSProperties = { color: '#888', fontSize: 13, margin: 0 };
const statVal: React.CSSProperties = { fontSize: 32, fontWeight: 900, color: '#333', margin: '4px 0 0' };
const entryCard: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const emptyBox: React.CSSProperties = { textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
