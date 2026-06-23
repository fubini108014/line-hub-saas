import { useEffect, useState } from 'react';
import { fetchServices, fetchStaff, ServiceItem, StaffMember } from '../lib/api';

interface Props {
  merchantId: string;
  onSelect: (service: ServiceItem, staff: StaffMember) => void;
}

export function StepService({ merchantId, onSelect }: Props) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices(merchantId)
      .then(setServices)
      .finally(() => setLoading(false));
  }, [merchantId]);

  useEffect(() => {
    if (!selectedService) return;
    setLoading(true);
    fetchStaff(merchantId, selectedService.id)
      .then(setStaff)
      .finally(() => setLoading(false));
  }, [selectedService]);

  if (loading) {
    return (
      <p style={{
        padding: 24,
        color: '#94A3B8',
        textAlign: 'center',
        fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif",
        fontSize: 15,
      }}>
        載入中...
      </p>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif" }}>
      <p style={{
        margin: '20px 0 10px',
        padding: '0 16px',
        fontSize: 13,
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        選擇服務項目
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px', marginBottom: 24 }}>
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedService(s); setStaff([]); }}
            style={{
              width: '100%',
              borderRadius: 14,
              border: `1.5px solid ${selectedService?.id === s.id ? '#7C3AED' : '#E2E8F0'}`,
              background: selectedService?.id === s.id ? '#EDE9FE' : '#FFFFFF',
              padding: '14px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
              NT${Number(s.price).toLocaleString()} · {s.durationMinutes} 分鐘
            </div>
          </button>
        ))}
      </div>

      {selectedService && staff.length > 0 && (
        <>
          <p style={{
            margin: '0 0 10px',
            padding: '0 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            選擇服務人員
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
            {staff.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(selectedService, s)}
                style={{
                  width: '100%',
                  borderRadius: 14,
                  border: '1.5px solid #E2E8F0',
                  background: '#FFFFFF',
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED',
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  {s.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                  {s.specialty && (
                    <div style={{ fontSize: 13, color: '#64748B' }}>{s.specialty}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
