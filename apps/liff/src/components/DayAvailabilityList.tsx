import { DayAvailabilityItem } from '../lib/api';

interface Props {
  date: string | null;
  items: DayAvailabilityItem[];
  loading: boolean;
  onSelect: (item: DayAvailabilityItem) => void;
  lowStockThreshold: number;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

function formatDateLabel(dateStr: string) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m} 月 ${d} 日`;
}

interface ServiceGroup {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
  times: DayAvailabilityItem[];
}

interface StaffGroup {
  staffId: string;
  staffName: string;
  avatarUrl: string | null;
  services: ServiceGroup[];
}

function groupItems(items: DayAvailabilityItem[]): StaffGroup[] {
  const staffMap = new Map<string, StaffGroup>();

  for (const item of items) {
    let staffGroup = staffMap.get(item.staffId);
    if (!staffGroup) {
      staffGroup = { staffId: item.staffId, staffName: item.staffName, avatarUrl: item.avatarUrl, services: [] };
      staffMap.set(item.staffId, staffGroup);
    }

    let serviceGroup = staffGroup.services.find((s) => s.serviceId === item.serviceId);
    if (!serviceGroup) {
      serviceGroup = {
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        price: item.price,
        durationMinutes: item.durationMinutes,
        times: [],
      };
      staffGroup.services.push(serviceGroup);
    }
    serviceGroup.times.push(item);
  }

  return [...staffMap.values()];
}

export function DayAvailabilityList({ date, items, loading, onSelect, lowStockThreshold }: Props) {
  const groups = groupItems(items);

  return (
    <div style={{ fontFamily: FONT }}>
      <p style={{
        margin: '0 0 12px',
        fontSize: 13,
        fontWeight: 600,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {date ? `${formatDateLabel(date)} 可預約項目` : '可預約項目'}
      </p>

      {!date ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: 14, padding: '40px 0' }}>
          請先在日曆上選擇日期
        </p>
      ) : loading ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: 14, padding: '40px 0' }}>
          載入中...
        </p>
      ) : groups.length === 0 ? (
        <p style={{ color: '#94A3B8', textAlign: 'center', fontSize: 14, padding: '40px 0' }}>
          當天無可預約時段
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g) => (
            <div key={g.staffId} style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #EDF0F7',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED',
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {g.avatarUrl ? (
                    <img src={g.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    g.staffName[0]
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{g.staffName}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {g.services.map((s) => (
                  <div key={s.serviceId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#334155' }}>{s.serviceName}</span>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>
                        NT${s.price.toLocaleString()} · {s.durationMinutes} 分鐘
                        {s.times.length <= lowStockThreshold && (
                          <span style={{ color: '#F97316', fontWeight: 700 }}> · 僅剩 {s.times.length} 個時段</span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {s.times.map((item) => (
                        <button
                          key={item.time}
                          onClick={() => onSelect(item)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #E2E8F0',
                            background: '#FFFFFF',
                            color: '#7C3AED',
                            fontSize: 13.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: FONT,
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#7C3AED';
                            (e.currentTarget as HTMLButtonElement).style.background = '#EDE9FE';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0';
                            (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                          }}
                        >
                          {item.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
