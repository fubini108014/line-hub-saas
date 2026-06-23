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

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

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

  const summaryRows = [
    ['服務項目', data.serviceName],
    ['服務人員', data.staffName],
    ['預約日期', data.date],
    ['預約時間', data.startTime],
  ] as const;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 10,
    border: '1.5px solid #E2E8F0',
    fontSize: 15,
    padding: '0 12px',
    boxSizing: 'border-box',
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
    fontFamily: FONT,
  };

  return (
    <div style={{
      fontFamily: FONT,
      padding: '0 16px 100px',
    }}>
      {/* Booking summary card */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #EDF0F7',
        boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
        padding: '0 16px',
        marginTop: 20,
        marginBottom: 20,
      }}>
        {summaryRows.map(([label, value], idx) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '11px 0',
              borderBottom: idx < summaryRows.length - 1 ? '1px solid #EDF0F7' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Form inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            marginBottom: 6,
          }}>
            姓名 *
          </label>
          <input
            value={data.customerName}
            onChange={(e) => onChange({ customerName: e.target.value })}
            placeholder="請輸入您的姓名"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            marginBottom: 6,
          }}>
            手機號碼 *
          </label>
          <input
            value={data.customerPhone}
            onChange={(e) => onChange({ customerPhone: e.target.value })}
            placeholder="09xxxxxxxx"
            type="tel"
            maxLength={10}
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <div style={{
          background: '#FEE2E2',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 13,
          color: '#EF4444',
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Sticky bottom bar */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#FFFFFF',
        borderTop: '1px solid #EDF0F7',
        padding: '12px 16px',
        margin: '0 -16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: '#7C3AED',
            color: '#FFFFFF',
            fontSize: 15.5,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontFamily: FONT,
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? '預約中...' : '確認預約'}
        </button>

        <button
          onClick={onBack}
          disabled={loading}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONT,
          }}
        >
          返回上一步
        </button>
      </div>
    </div>
  );
}
