import { Segment, SEGMENTS, SEGMENT_LABELS, SEGMENT_COLORS } from '../lib/segment';

interface Props {
  selectedSegment: Segment | null;
  onSelect: (segment: Segment | null) => void;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

function chipStyle(active: boolean, accent?: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    padding: '6px 14px',
    borderRadius: 999,
    border: `1.5px solid ${active ? (accent ?? '#7C3AED') : '#E2E8F0'}`,
    background: active ? (accent ?? '#7C3AED') : '#FFFFFF',
    color: active ? '#FFFFFF' : '#334155',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: FONT,
    whiteSpace: 'nowrap',
    transition: 'border-color 0.15s, background 0.15s',
  };
}

export function SegmentFilterBar({ selectedSegment, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, fontFamily: FONT }}>
      <button onClick={() => onSelect(null)} style={chipStyle(selectedSegment === null)}>
        全部時段
      </button>
      {SEGMENTS.map((seg) => {
        const active = selectedSegment === seg;
        return (
          <button key={seg} onClick={() => onSelect(seg)} style={chipStyle(active, SEGMENT_COLORS[seg])}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: active ? 'rgba(255,255,255,0.9)' : SEGMENT_COLORS[seg],
              flexShrink: 0,
            }} />
            {SEGMENT_LABELS[seg]}
          </button>
        );
      })}
    </div>
  );
}
