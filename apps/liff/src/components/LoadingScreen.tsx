export function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e0e0e0', borderTopColor: '#27ACB2',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#888', fontSize: 14 }}>載入中...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
