import { StaffOption } from '../lib/api';

interface Props {
  staff: StaffOption[];
  selectedStaffId: string | null;
  onSelect: (staffId: string | null) => void;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    padding: active ? '6px 16px 6px 6px' : '6px 16px',
    borderRadius: 999,
    border: `1.5px solid ${active ? '#7C3AED' : '#E2E8F0'}`,
    background: active ? '#7C3AED' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#334155',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: FONT,
    whiteSpace: 'nowrap',
    transition: 'border-color 0.15s, background 0.15s',
  };
}

export function StaffFilterBar({ staff, selectedStaffId, onSelect }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4,
      fontFamily: FONT,
      WebkitOverflowScrolling: 'touch',
    }}>
      <button onClick={() => onSelect(null)} style={chipStyle(selectedStaffId === null)}>
        全部人員
      </button>

      {staff.map((s) => {
        const active = selectedStaffId === s.id;
        return (
          <button key={s.id} onClick={() => onSelect(s.id)} style={chipStyle(active)}>
            <span style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: active ? 'rgba(255,255,255,0.25)' : '#EDE9FE',
              color: active ? '#FFFFFF' : '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {s.avatarUrl ? (
                <img src={s.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                s.name[0]
              )}
            </span>
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
