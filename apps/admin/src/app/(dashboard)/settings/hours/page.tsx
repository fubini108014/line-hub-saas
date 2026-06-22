'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const DAY_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const defaultHours = (): BusinessHour[] =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: i === 0,
  }));

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get<BusinessHour[]>('/business-hours').then((d) => {
      if (Array.isArray(d) && d.length === 7) setHours(d);
    });
  }, []);

  const update = (dayOfWeek: number, patch: Partial<BusinessHour>) =>
    setHours((prev) => prev.map((h) => h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/business-hours', { hours });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 560 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>營業時間設定</h1>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {hours.map((h, i) => (
          <div key={h.dayOfWeek} style={{
            display: 'grid',
            gridTemplateColumns: '56px 1fr',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: i < 6 ? '1px solid #f0f0f0' : 'none',
            background: h.isClosed ? '#fafafa' : '#fff',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: h.isClosed ? '#aaa' : '#333' }}>
              {DAY_NAMES[h.dayOfWeek]}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 60 }}>
                <input
                  type="checkbox"
                  checked={h.isClosed}
                  onChange={(e) => update(h.dayOfWeek, { isClosed: e.target.checked })}
                />
                <span style={{ fontSize: 13, color: '#888' }}>休息</span>
              </label>

              {!h.isClosed && (
                <>
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => update(h.dayOfWeek, { openTime: e.target.value })}
                    style={timeInput}
                  />
                  <span style={{ color: '#aaa', fontSize: 13 }}>至</span>
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => update(h.dayOfWeek, { closeTime: e.target.value })}
                    style={timeInput}
                  />
                </>
              )}
              {h.isClosed && <span style={{ color: '#ccc', fontSize: 13 }}>— 休息日</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={saving} style={btnPrimary}>
          {saving ? '儲存中...' : '儲存設定'}
        </button>
        {saved && <span style={{ color: '#27ACB2', fontSize: 14 }}>✓ 已儲存</span>}
      </div>
    </div>
  );
}

const timeInput: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, color: '#333' };
const btnPrimary: React.CSSProperties = { padding: '10px 24px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 };
