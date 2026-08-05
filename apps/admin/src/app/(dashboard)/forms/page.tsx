'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface FormTemplate {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  _count: { responses: number };
}

interface FormField { id: string; label: string; type: string; options?: string[]; required?: boolean }

const FIELD_TYPES = [
  { value: 'text', label: '單行文字' },
  { value: 'textarea', label: '多行文字' },
  { value: 'select', label: '下拉選單' },
  { value: 'radio', label: '單選' },
  { value: 'checkbox', label: '多選' },
];

function newField(): FormField {
  return { id: Math.random().toString(36).slice(2), label: '', type: 'text', required: false };
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [fields, setFields] = useState<FormField[]>([newField()]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get<FormTemplate[]>('/forms')
      .then((d) => setForms(Array.isArray(d) ? d : []))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addField = () => setFields((f) => [...f, newField()]);
  const updateField = (id: string, patch: Partial<FormField>) =>
    setFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeField = (id: string) => setFields((f) => f.filter((x) => x.id !== id));

  const create = async () => {
    if (!title) return;
    try {
      await api.post('/forms', { title, description: desc, fields });
      setTitle(''); setDesc(''); setFields([newField()]); setAdding(false);
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const toggle = async (f: FormTemplate) => {
    try {
      await api.patch(`/forms/${f.id}`, { isActive: !f.isActive });
      load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#27ACB2', margin: 0 }}>📋 問卷表單</h1>
        <button onClick={() => setAdding(true)} style={btn}>+ 新增表單</button>
      </div>

      {adding && (
        <div style={formBox}>
          <h3 style={{ marginTop: 0 }}>建立新表單</h3>
          <label style={lbl}>表單標題 *</label>
          <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：服務前健康問卷" />
          <label style={lbl}>說明（選填）</label>
          <input style={inp} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="表單說明文字" />

          <h4 style={{ marginBottom: 8, marginTop: 20 }}>題目</h4>
          {fields.map((f, i) => (
            <div key={f.id} style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inp, flex: 1 }} value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} placeholder={`題目 ${i + 1}`} />
                <select style={{ ...inp, width: 130 }} value={f.type} onChange={(e) => updateField(f.id, { type: e.target.value })}>
                  {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} />
                  必填
                </label>
                {fields.length > 1 && (
                  <button onClick={() => removeField(f.id)} style={{ border: 'none', background: 'transparent', color: '#E74C3C', cursor: 'pointer', fontSize: 18 }}>✕</button>
                )}
              </div>
              {['select', 'radio', 'checkbox'].includes(f.type) && (
                <input
                  style={inp}
                  placeholder="選項1, 選項2, 選項3（用逗號分隔）"
                  value={f.options?.join(', ') ?? ''}
                  onChange={(e) => updateField(f.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                />
              )}
            </div>
          ))}

          <button onClick={addField} style={{ ...btn, background: '#888', marginBottom: 12 }}>+ 新增題目</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={create} style={btn}>儲存表單</button>
            <button onClick={() => setAdding(false)} style={{ ...btn, background: '#888' }}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : forms.length === 0 ? <p style={{ color: '#aaa' }}>尚無表單</p> :
        forms.map((f) => (
          <div key={f.id} style={{ ...card, opacity: f.isActive ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{f.title}</p>
                {f.description && <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>{f.description}</p>}
                <p style={{ color: '#aaa', fontSize: 13, margin: '4px 0 0' }}>已收到 {f._count.responses} 份回覆</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/forms/${f.id}/responses`} style={{ ...btn, textDecoration: 'none', background: '#8E44AD' }}>查看回覆</a>
                <button onClick={() => toggle(f)} style={{ ...btn, background: f.isActive ? '#E74C3C' : '#27ACB2', minWidth: 72 }}>
                  {f.isActive ? '停用' : '啟用'}
                </button>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

const btn: React.CSSProperties = { padding: '8px 18px', background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' };
const formBox: React.CSSProperties = { ...card, marginBottom: 24, borderLeft: '4px solid #27ACB2' };
const lbl: React.CSSProperties = { display: 'block', color: '#555', fontSize: 14, marginBottom: 4, marginTop: 12 };
const inp: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' };
