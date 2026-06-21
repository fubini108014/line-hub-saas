import { useState } from 'react';

interface Props {
  data: {
    serviceName: string;
    staffName: string;
    date: string;
    startTime: string;
    customerName: string;
    customerPhone: string;
  };
  onChange: (partial: { customerName?: string; customerPhone?: string }) => void;
  onSubmit: () => Promise<void>;
  onBack: () => void;
}

export function StepConfirm({ data, onChange, onSubmit, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!data.customerName.trim()) { setError('請填寫姓名'); return; }
    if (!/^09\d{8}$/.test(data.customerPhone)) { setError('請填寫正確的手機號碼（09xxxxxxxx）'); return; }

    setLoading(true);
    setError('');
    try {
      await onSubmit();
    } catch (e: any) {
      setError(e.message ?? '預約失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>確認預約資訊</h3>

      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #eee' }}>
        {[
          ['服務項目', data.serviceName],
          ['服務人員', data.staffName],
          ['預約日期', data.date],
          ['預約時間', data.startTime],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#888', fontSize: 14 }}>{label}</span>
            <span style={{ fontWeight: 'bold', fontSize: 14 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 14, color: '#555', display: 'block', marginBottom: 6 }}>姓名 *</label>
          <input
            value={data.customerName}
            onChange={(e) => onChange({ customerName: e.target.value })}
            placeholder="請輸入您的姓名"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 14, color: '#555', display: 'block', marginBottom: 6 }}>手機號碼 *</label>
          <input
            value={data.customerPhone}
            onChange={(e) => onChange({ customerPhone: e.target.value })}
            placeholder="09xxxxxxxx"
            type="tel"
            maxLength={10}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15 }}
          />
        </div>
      </div>

      {error && <p style={{ color: '#E74C3C', fontSize: 14, marginBottom: 12 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: 10, border: 'none',
          background: loading ? '#ccc' : '#27ACB2', color: '#fff',
          fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10,
        }}
      >
        {loading ? '預約中...' : '確認預約'}
      </button>

      <button
        onClick={onBack}
        style={{
          width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #ddd',
          background: '#fff', cursor: 'pointer', fontSize: 15,
        }}
      >
        返回上一步
      </button>
    </div>
  );
}
