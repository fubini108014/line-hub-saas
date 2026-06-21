'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function LineSettingsPage() {
  const [form, setForm] = useState({ channelId: '', channelSecret: '', accessToken: '', liffId: '' });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<any>('/merchants/me').then((m) => {
      setWebhookUrl(m.webhookUrl);
      if (m.lineChannelId) setForm(f => ({ ...f, channelId: m.lineChannelId, liffId: m.lineLiffId ?? '' }));
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await api.put('/merchants/me/line-credentials', form);
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'channelId', label: 'Channel ID', placeholder: '1234567890' },
    { key: 'channelSecret', label: 'Channel Secret', placeholder: '留空表示不變更' },
    { key: 'accessToken', label: 'Channel Access Token', placeholder: '留空表示不變更' },
    { key: 'liffId', label: 'LIFF ID', placeholder: '1234567890-AbCdEfGh' },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 640 }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>LINE 帳號串接</h1>
      <p style={{ margin: '0 0 28px', color: '#888', fontSize: 14 }}>填入您的 LINE Messaging API 憑證，憑證會以 AES-256 加密儲存。</p>

      {webhookUrl && (
        <div style={{ background: '#f0fafa', border: '1px solid #27ACB2', borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#27ACB2', fontSize: 14 }}>您的 Webhook URL（請複製填入 LINE Developer Console）</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <code style={{ flex: 1, background: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 12, overflow: 'auto' }}>{webhookUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(webhookUrl)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #27ACB2', background: '#fff', color: '#27ACB2', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
              複製
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>{label}</label>
            <input
              value={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' as const }}
            />
          </div>
        ))}

        {error && <p style={{ color: '#E74C3C', fontSize: 14 }}>{error}</p>}
        {saved && <p style={{ color: '#27ACB2', fontSize: 14 }}>✅ 儲存成功</p>}

        <button type="submit" disabled={saving}
          style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>
          {saving ? '儲存中...' : '儲存憑證'}
        </button>
      </form>
    </div>
  );
}
