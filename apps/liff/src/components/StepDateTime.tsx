import { useEffect, useState } from 'react';
import { fetchSlots, TimeSlot } from '../lib/api';

interface Props {
  merchantId: string;
  staffId: string;
  serviceId: string;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function StepDateTime({ merchantId, staffId, serviceId, onSelect, onBack }: Props) {
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSlots(merchantId, staffId, serviceId, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, staffId, serviceId]);

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
      padding: '0 16px',
      paddingBottom: 100,
    }}>
      <p style={{
        margin: '20px 0 10px',
        fontSize: 13,
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        選擇日期
      </p>

      <input
        type="date"
        value={date}
        min={today()}
        onChange={(e) => setDate(e.target.value)}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 10,
          border: '1.5px solid #E2E8F0',
          fontSize: 16,
          padding: '0 12px',
          boxSizing: 'border-box',
          color: '#0F172A',
          background: '#FFFFFF',
          outline: 'none',
          marginBottom: 20,
          fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
        }}
      />

      <p style={{
        margin: '0 0 10px',
        fontSize: 13,
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        可用時段
      </p>

      {loading ? (
        <p style={{
          color: '#94A3B8',
          textAlign: 'center',
          fontSize: 14,
          padding: '20px 0',
        }}>
          載入時段中...
        </p>
      ) : slots.length === 0 ? (
        <p style={{
          color: '#94A3B8',
          textAlign: 'center',
          fontSize: 14,
          padding: '20px 0',
        }}>
          該日無可用時段
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}>
          {slots.map((slot) => (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => slot.available && onSelect(date, slot.time)}
              style={{
                height: 44,
                borderRadius: 10,
                border: `1.5px solid ${slot.available ? '#E2E8F0' : '#EDF0F7'}`,
                background: slot.available ? '#FFFFFF' : '#F8FAFC',
                color: slot.available ? '#7C3AED' : '#CBD5E1',
                fontSize: 14,
                fontWeight: 600,
                cursor: slot.available ? 'pointer' : 'not-allowed',
                fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!slot.available) return;
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#7C3AED';
                (e.currentTarget as HTMLButtonElement).style.background = '#EDE9FE';
              }}
              onMouseLeave={(e) => {
                if (!slot.available) return;
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              }}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#FFFFFF',
        borderTop: '1px solid #EDF0F7',
        padding: '12px 16px',
        margin: '0 -16px',
      }}>
        <button
          onClick={onBack}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            border: '1.5px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
          }}
        >
          返回上一步
        </button>
      </div>
    </div>
  );
}
