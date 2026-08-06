'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface CalendarSettings {
  enabled: boolean;
  morningEndTime: string;
  afternoonEndTime: string;
  lowStockThreshold: number;
}

interface Staff {
  id: string;
  name: string;
  specialty?: string;
  isBookable: boolean;
}

interface StaffAvailabilityRow {
  dayOfWeek: number;
  useMerchantHours: boolean;
  openTime: string;
  closeTime: string;
  isOff: boolean;
}

const DAY_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

const defaultAvailability = (): StaffAvailabilityRow[] =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    useMerchantHours: true,
    openTime: '09:00',
    closeTime: '18:00',
    isOff: false,
  }));

export default function BookingCalendarSettingsPage() {
  const [settings, setSettings] = useState<CalendarSettings>({
    enabled: true, morningEndTime: '12:00', afternoonEndTime: '17:00', lowStockThreshold: 3,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  const [liffId, setLiffId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [copied, setCopied] = useState(false);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [availabilityTarget, setAvailabilityTarget] = useState<Staff | null>(null);
  const [availabilityRows, setAvailabilityRows] = useState<StaffAvailabilityRow[]>(defaultAvailability());
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    api.get<CalendarSettings>('/calendar-settings').then(setSettings);
    api.get<any>('/merchants/me').then((m) => {
      setLiffId(m.lineLiffId ?? '');
      setMerchantId(m.id ?? '');
    });
    loadStaff();
  }, []);

  const loadStaff = () => api.get<Staff[]>('/staff').then((d) => setStaffList(Array.isArray(d) ? d : []));

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/calendar-settings', settings);
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2000);
    } finally { setSavingSettings(false); }
  };

  const toggleBookable = async (s: Staff) => {
    await api.patch(`/staff/${s.id}`, { isBookable: !s.isBookable });
    loadStaff();
  };

  const openAvailability = async (s: Staff) => {
    setAvailabilityTarget(s);
    const rows = await api.get<StaffAvailabilityRow[]>(`/staff/${s.id}/availability`);
    const merged = defaultAvailability().map((d) => rows.find((r) => r.dayOfWeek === d.dayOfWeek) ?? d);
    setAvailabilityRows(merged);
  };

  const updateRow = (dayOfWeek: number, patch: Partial<StaffAvailabilityRow>) =>
    setAvailabilityRows((prev) => prev.map((r) => r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r));

  const handleSaveAvailability = async () => {
    if (!availabilityTarget) return;
    setSavingAvailability(true);
    try {
      await api.put(`/staff/${availabilityTarget.id}/availability`, { days: availabilityRows });
      setAvailabilityTarget(null);
    } finally { setSavingAvailability(false); }
  };

  const liffLink = liffId ? `https://liff.line.me/${liffId}?type=calendar` : '';

  const copyLink = () => {
    if (!liffLink) return;
    navigator.clipboard.writeText(liffLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>日曆預約設定</h1>

      {/* ── 啟用開關 + 連結 ───────────────────────────────── */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>入口開關</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
          />
          <span style={{ fontSize: 14 }}>啟用「預約日曆」LIFF 入口</span>
        </label>

        <label style={L}>專屬連結</label>
        {!liffId ? (
          <p style={{ fontSize: 13, color: '#E74C3C', margin: 0 }}>
            尚未設定 LIFF ID，請先至「LINE 串接」頁面設定後才能產生連結
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input readOnly value={liffLink} style={{ ...I, flex: 1, color: '#555', background: '#fafafa' }} />
            <button onClick={copyLink} style={btnSecondary}>{copied ? '已複製 ✓' : '複製'}</button>
          </div>
        )}
        {merchantId && (
          <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>商家 ID：{merchantId}</p>
        )}
      </div>

      {/* ── 時段參數設定 ───────────────────────────────── */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>時段與提示設定</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={L}>早上結束時間</label>
            <input
              type="time"
              value={settings.morningEndTime}
              onChange={(e) => setSettings((s) => ({ ...s, morningEndTime: e.target.value }))}
              style={I}
            />
          </div>
          <div>
            <label style={L}>下午結束時間（之後算晚上）</label>
            <input
              type="time"
              value={settings.afternoonEndTime}
              onChange={(e) => setSettings((s) => ({ ...s, afternoonEndTime: e.target.value }))}
              style={I}
            />
          </div>
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={L}>「僅剩 X 個時段」提示門檻</label>
          <input
            type="number"
            min={0}
            max={50}
            value={settings.lowStockThreshold}
            onChange={(e) => setSettings((s) => ({ ...s, lowStockThreshold: Number(e.target.value) }))}
            style={{ ...I, maxWidth: 120 }}
          />
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleSaveSettings} disabled={savingSettings} style={btnPrimary}>
            {savingSettings ? '儲存中...' : '儲存設定'}
          </button>
          {savedSettings && <span style={{ color: '#27ACB2', fontSize: 14 }}>✓ 已儲存</span>}
        </div>
      </div>

      {/* ── 人員可預約設定 ───────────────────────────────── */}
      <div style={card}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>人員可預約設定</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#999' }}>
          關閉「可被預約」的人員不會出現在日曆預約頁；「設定時段」可讓該人員擁有自己的週間工作時間，未設定則預設跟隨商家營業時間。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {staffList.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: '#fafafa' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{s.name}</div>
                {s.specialty && <div style={{ fontSize: 12, color: '#999' }}>{s.specialty}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={s.isBookable} onChange={() => toggleBookable(s)} />
                  可被預約
                </label>
                <button onClick={() => openAvailability(s)} style={btnSecondary}>設定時段</button>
              </div>
            </div>
          ))}
          {staffList.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', padding: 12 }}>尚未設定任何人員</p>}
        </div>
      </div>

      {availabilityTarget && (
        <div style={overlay}>
          <div style={{ ...modal, maxWidth: 520 }}>
            <h3 style={{ margin: '0 0 4px' }}>可預約時段 — {availabilityTarget.name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#999' }}>
              預設跟隨商家營業時間；取消勾選後可自訂該天的工作時間，或標記本日不上班。
            </p>

            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #eee' }}>
              {availabilityRows.map((r, i) => (
                <div key={r.dayOfWeek} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: i < 6 ? '1px solid #f0f0f0' : 'none',
                  background: r.isOff ? '#fafafa' : '#fff',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ width: 44, fontWeight: 600, fontSize: 13.5, color: r.isOff ? '#bbb' : '#333' }}>
                    {DAY_NAMES[r.dayOfWeek]}
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5, color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={r.useMerchantHours}
                      onChange={(e) => updateRow(r.dayOfWeek, { useMerchantHours: e.target.checked })}
                    />
                    跟隨商家時間
                  </label>

                  {!r.useMerchantHours && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12.5, color: '#666' }}>
                        <input
                          type="checkbox"
                          checked={r.isOff}
                          onChange={(e) => updateRow(r.dayOfWeek, { isOff: e.target.checked })}
                        />
                        不上班
                      </label>
                      {!r.isOff && (
                        <>
                          <input type="time" value={r.openTime} onChange={(e) => updateRow(r.dayOfWeek, { openTime: e.target.value })} style={smallTimeInput} />
                          <span style={{ color: '#aaa', fontSize: 12.5 }}>至</span>
                          <input type="time" value={r.closeTime} onChange={(e) => updateRow(r.dayOfWeek, { closeTime: e.target.value })} style={smallTimeInput} />
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSaveAvailability} disabled={savingAvailability} style={btnPrimary}>
                {savingAvailability ? '儲存中...' : '儲存'}
              </button>
              <button onClick={() => setAvailabilityTarget(null)} style={btnSecondary}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const L: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 5, color: '#555' };
const I: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' };
const smallTimeInput: React.CSSProperties = { padding: '5px 7px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 };
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 };
const btnSecondary: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, border: '1px solid #27ACB2', background: '#fff', color: '#27ACB2', cursor: 'pointer', fontSize: 13 };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', maxHeight: '85vh', overflowY: 'auto' };
