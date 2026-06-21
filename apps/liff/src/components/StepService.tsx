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

  if (loading) return <p style={{ padding: 24, color: '#888', textAlign: 'center' }}>載入中...</p>;

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>選擇服務項目</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedService(s); setStaff([]); }}
            style={{
              padding: '12px 16px', borderRadius: 8, border: '2px solid',
              borderColor: selectedService?.id === s.id ? '#27ACB2' : '#e0e0e0',
              background: selectedService?.id === s.id ? '#f0fafa' : '#fff',
              textAlign: 'left', cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{s.name}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              ${Number(s.price).toLocaleString()} · {s.durationMinutes} 分鐘
            </div>
          </button>
        ))}
      </div>

      {selectedService && staff.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>選擇服務人員</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {staff.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(selectedService, s)}
                style={{
                  padding: '12px 16px', borderRadius: 8, border: '2px solid #e0e0e0',
                  background: '#fff', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#27ACB2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 'bold', fontSize: 18, flexShrink: 0,
                }}>
                  {s.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                  {s.specialty && <div style={{ fontSize: 13, color: '#888' }}>{s.specialty}</div>}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
