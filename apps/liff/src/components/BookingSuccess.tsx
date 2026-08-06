import liff from '@line/liff';

interface Props {
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

export function BookingSuccess({ serviceName, staffName, date, startTime }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: FONT,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#D1FAE5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{
        fontSize: 22,
        fontWeight: 800,
        color: '#0F172A',
        margin: '0 0 8px',
        textAlign: 'center',
      }}>
        預約成功！
      </h2>
      <p style={{
        fontSize: 13,
        color: '#64748B',
        margin: '0 0 28px',
        textAlign: 'center',
      }}>
        我們將透過 LINE 發送確認訊息
      </p>

      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #EDF0F7',
        boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
        padding: '0 16px',
        marginBottom: 24,
      }}>
        {([
          ['服務項目', serviceName],
          ['服務人員', staffName],
          ['預約日期', date],
          ['預約時間', startTime],
        ] as const).map(([label, value], idx, arr) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '11px 0',
              borderBottom: idx < arr.length - 1 ? '1px solid #EDF0F7' : 'none',
            }}
          >
            <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => liff.closeWindow()}
        style={{
          width: '100%',
          maxWidth: 400,
          height: 52,
          borderRadius: 14,
          border: 'none',
          background: '#7C3AED',
          color: '#FFFFFF',
          fontSize: 15.5,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        關閉
      </button>
    </div>
  );
}
