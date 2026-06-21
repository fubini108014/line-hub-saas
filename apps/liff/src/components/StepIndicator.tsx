interface Props {
  current: number;
  total: number;
  labels: string[];
}

export function StepIndicator({ current, total, labels }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #eee' }}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: step < total ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold',
                background: done ? '#27ACB2' : active ? '#27ACB2' : '#e0e0e0',
                color: done || active ? '#fff' : '#999',
              }}>
                {done ? '✓' : step}
              </div>
              <span style={{ fontSize: 11, color: active ? '#27ACB2' : '#999', whiteSpace: 'nowrap' }}>
                {labels[i]}
              </span>
            </div>
            {step < total && (
              <div style={{ flex: 1, height: 2, background: done ? '#27ACB2' : '#e0e0e0', margin: '0 8px', marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
