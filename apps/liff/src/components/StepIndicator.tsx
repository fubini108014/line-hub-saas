interface Props {
  current: number;
  total: number;
  labels: string[];
}

export function StepIndicator({ current, total, labels }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 56,
        padding: '0 16px',
        background: '#FFFFFF',
        borderBottom: '1px solid #EDF0F7',
        fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;

        const circleStyle: React.CSSProperties = done
          ? {
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              background: '#7C3AED',
              color: '#FFFFFF',
              flexShrink: 0,
            }
          : active
          ? {
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              background: '#FFFFFF',
              color: '#7C3AED',
              border: '2px solid #7C3AED',
              boxSizing: 'border-box',
              flexShrink: 0,
            }
          : {
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              background: '#EDF0F7',
              color: '#94A3B8',
              flexShrink: 0,
            };

        const labelColor = done || active ? '#7C3AED' : '#94A3B8';

        return (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: step < total ? 1 : undefined,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div style={circleStyle}>{done ? '✓' : step}</div>
              <span
                style={{
                  fontSize: 11,
                  color: labelColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {labels[i]}
              </span>
            </div>
            {step < total && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: done ? '#7C3AED33' : '#EDF0F7',
                  margin: '0 8px',
                  marginBottom: 16,
                  alignSelf: 'flex-start',
                  marginTop: 13,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
