'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Service { id: string; name: string; durationMinutes: number }
interface Staff {
  id: string;
  name: string;
  specialty?: string;
  staffServices: { service: Service }[];
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: '', specialty: '' });
  const [adding, setAdding] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Staff | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const load = () => api.get<Staff[]>('/staff').then((d) => setStaff(Array.isArray(d) ? d : []));

  useEffect(() => {
    load();
    api.get<Service[]>('/services').then((d) => setServices(Array.isArray(d) ? d : []));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/staff', form);
      setForm({ name: '', specialty: '' });
      load();
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要停用此人員嗎？')) return;
    await api.delete(`/staff/${id}`);
    load();
  };

  const openAssign = (s: Staff) => {
    setAssignTarget(s);
    setSelectedServiceIds(s.staffServices.map((ss) => ss.service.id));
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    await api.put(`/staff/${assignTarget.id}/services`, { serviceIds: selectedServiceIds });
    setAssignTarget(null);
    load();
  };

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22 }}>人員設定</h1>

      <form onSubmit={handleAdd} style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>新增人員</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={L}>姓名</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={I} placeholder="例：王小明" />
          </div>
          <div>
            <label style={L}>專長（選填）</label>
            <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} style={I} placeholder="例：燙髮、染髮" />
          </div>
        </div>
        <button type="submit" disabled={adding} style={btnPrimary}>
          {adding ? '新增中...' : '+ 新增人員'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {staff.map(s => (
          <div key={s.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 15 }}>{s.name}</div>
              {s.specialty && <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.specialty}</div>}
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {s.staffServices.length === 0
                  ? <span style={{ fontSize: 12, color: '#aaa' }}>尚未指派服務</span>
                  : s.staffServices.map(({ service }) => (
                    <span key={service.id} style={tag}>{service.name}</span>
                  ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
              <button onClick={() => openAssign(s)} style={btnSecondary}>指派服務</button>
              <button onClick={() => handleDelete(s.id)} style={btnDanger}>停用</button>
            </div>
          </div>
        ))}
        {staff.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>尚未設定任何人員</p>}
      </div>

      {assignTarget && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 16px' }}>指派服務 — {assignTarget.name}</h3>
            {services.length === 0
              ? <p style={{ color: '#aaa' }}>請先至「服務項目」建立服務</p>
              : services.map(svc => (
                <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedServiceIds.includes(svc.id)} onChange={() => toggleService(svc.id)} />
                  <span>{svc.name}（{svc.durationMinutes} 分鐘）</span>
                </label>
              ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleAssign} style={btnPrimary}>儲存</button>
              <button onClick={() => setAssignTarget(null)} style={btnSecondary}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const L: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 5, color: '#555' };
const I: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' };
const tag: React.CSSProperties = { background: '#E8F7F8', color: '#27ACB2', borderRadius: 4, padding: '2px 8px', fontSize: 12 };
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 };
const btnSecondary: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, border: '1px solid #27ACB2', background: '#fff', color: '#27ACB2', cursor: 'pointer', fontSize: 13 };
const btnDanger: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, border: '1px solid #E74C3C', background: '#fff', color: '#E74C3C', cursor: 'pointer', fontSize: 13 };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' };
