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
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>選擇日期</h3>
      <input
        type="date"
        value={date}
        min={today()}
        onChange={(e) => setDate(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8,
          border: '1px solid #ddd', fontSize: 16, marginBottom: 20,
        }}
      />

      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>選擇時段</h3>
      {loading ? (
        <p style={{ color: '#888', textAlign: 'center' }}>載入時段中...</p>
      ) : slots.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center' }}>該日無可用時段</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {slots.map((slot) => (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => onSelect(date, slot.time)}
              style={{
                padding: '10px 4px', borderRadius: 8, border: '1px solid',
                borderColor: slot.available ? '#27ACB2' : '#e0e0e0',
                background: slot.available ? '#fff' : '#f5f5f5',
                color: slot.available ? '#27ACB2' : '#bbb',
                cursor: slot.available ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: slot.available ? 'bold' : 'normal',
              }}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        style={{
          marginTop: 24, width: '100%', padding: '12px', borderRadius: 8,
          border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 15,
        }}
      >
        返回上一步
      </button>
    </div>
  );
}
