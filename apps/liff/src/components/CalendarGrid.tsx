import { DayAvailabilityInfo } from '../lib/api';
import { Segment, SEGMENTS, SEGMENT_LABELS, SEGMENT_COLORS } from '../lib/segment';

interface Props {
  year: number;
  month: number; // 1-12
  statusByDate: Record<string, DayAvailabilityInfo>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading: boolean;
  showSegments: boolean;
  segmentFilter: Segment | null;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const SEGMENT_OFF = '#E2E8F0';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function CalendarGrid({
  year,
  month,
  statusByDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  loading,
  showSegments,
  segmentFilter,
}: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0 = Monday

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: `${year}-${pad(month)}-${pad(day)}` });
  }

  const isPastMonth = (() => {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth() + 1);
  })();

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 14px' }}>
        <button
          onClick={onPrevMonth}
          disabled={isPastMonth}
          aria-label="上一月"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1.5px solid #E2E8F0',
            background: '#FFFFFF',
            color: isPastMonth ? '#CBD5E1' : '#334155',
            cursor: isPastMonth ? 'not-allowed' : 'pointer',
            fontSize: 15,
          }}
        >
          ‹
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
          {year} 年 {month} 月
        </div>
        <button
          onClick={onNextMonth}
          aria-label="下一月"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: '1.5px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#334155',
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#94A3B8', padding: '4px 0' }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`blank-${idx}`} />;

          const info = statusByDate[cell.dateStr];
          const status = info?.status;
          const disabled = loading || status === 'past' || status === 'closed' || status === undefined;
          const selected = selectedDate === cell.dateStr;
          const effectiveAvailable = info
            ? (segmentFilter ? info[segmentFilter] : status === 'available')
            : false;
          const isFull = !disabled && !effectiveAvailable;

          return (
            <button
              key={cell.dateStr}
              disabled={disabled}
              onClick={() => onSelectDate(cell.dateStr)}
              style={{
                aspectRatio: '1',
                borderRadius: 10,
                border: selected ? '1.5px solid #7C3AED' : '1.5px solid transparent',
                background: selected ? '#EDE9FE' : 'transparent',
                color: disabled ? '#CBD5E1' : isFull ? '#94A3B8' : '#0F172A',
                fontSize: 14,
                fontWeight: selected ? 800 : 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <span>{cell.day}</span>
              {status === 'closed' ? (
                <span style={{ fontSize: 9, color: '#CBD5E1' }}>公休</span>
              ) : showSegments && info ? (
                <span style={{ display: 'flex', gap: 3 }}>
                  {SEGMENTS.map((seg) => {
                    const on = info[seg];
                    const dimmed = segmentFilter !== null && segmentFilter !== seg;
                    return (
                      <span
                        key={seg}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: on ? SEGMENT_COLORS[seg] : SEGMENT_OFF,
                          opacity: on && dimmed ? 0.35 : 1,
                        }}
                      />
                    );
                  })}
                </span>
              ) : isFull ? (
                <span style={{ fontSize: 9, color: '#94A3B8' }}>已額滿</span>
              ) : (
                <span style={{ height: 11 }} />
              )}
            </button>
          );
        })}
      </div>

      {showSegments && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
          {SEGMENTS.map((seg) => (
            <div key={seg} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: SEGMENT_COLORS[seg] }} />
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{SEGMENT_LABELS[seg]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
