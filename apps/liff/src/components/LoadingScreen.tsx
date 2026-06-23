export function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 12,
        background: '#F8FAFC',
        fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #E2E8F0',
          borderTopColor: '#7C3AED',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <span style={{ color: '#94A3B8', fontSize: 13 }}>載入中</span>
    </div>
  );
}
