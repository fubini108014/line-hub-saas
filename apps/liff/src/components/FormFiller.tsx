import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;
const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  options?: string[];
  required?: boolean;
}

interface FormDef {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export function FormFiller({
  merchantId,
  lineUserId,
  formId,
}: {
  merchantId: string;
  lineUserId: string;
  formId: string;
}) {
  const [formDef, setFormDef] = useState<FormDef | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!formId) { setError('無效的表單連結'); setLoading(false); return; }
    fetch(`${BASE}/public/forms/${formId}?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then(setFormDef)
      .catch(() => setError('載入表單失敗'))
      .finally(() => setLoading(false));
  }, [formId]);

  const set = (fieldId: string, value: any) => setAnswers((a) => ({ ...a, [fieldId]: value }));

  const submit = async () => {
    if (!formDef) return;
    const missing = formDef.fields.filter((f) => f.required && !answers[f.id]);
    if (missing.length > 0) { setError(`請填寫必填欄位：${missing.map((f) => f.label).join('、')}`); return; }
    setError('');
    const res = await fetch(`${BASE}/public/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, lineUserId, answers }),
    });
    if (res.ok) setSubmitted(true);
    else setError('提交失敗，請重試');
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
        <p style={{ color: '#94A3B8', fontSize: 15 }}>載入中...</p>
      </div>
    );
  }

  // ── Error (no form loaded) ──
  if (error && !formDef) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 26 }}>!</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#EF4444', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  // ── Submitted ──
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{formDef?.title ?? '問卷表單'}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 36 }}>✓</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>感謝您的回答！</p>
          <p style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 1.6 }}>您的意見將幫助我們持續改善服務</p>
        </div>
      </div>
    );
  }

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', borderRadius: 10,
    border: '1.5px solid #E2E8F0', fontSize: 15, color: '#0F172A',
    background: '#FFFFFF', fontFamily: FONT, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF', borderBottom: '1px solid #EDF0F7', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{formDef!.title || '問卷表單'}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 460, margin: '0 auto', width: '100%', padding: '16px 16px 100px', boxSizing: 'border-box' }}>

        {/* Description */}
        {formDef!.description && (
          <div style={{ background: '#EDE9FE', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{formDef!.description}</p>
          </div>
        )}

        {/* Fields */}
        {formDef!.fields.map((f) => (
          <div key={f.id} style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              {f.label}
              {f.required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
            </label>

            {f.type === 'text' && (
              <input
                style={{ ...inputBase, height: 48, padding: '0 14px' }}
                value={answers[f.id] ?? ''}
                onChange={(e) => set(f.id, e.target.value)}
              />
            )}

            {f.type === 'textarea' && (
              <textarea
                style={{ ...inputBase, minHeight: 100, padding: '12px 14px', resize: 'none', lineHeight: 1.6 }}
                value={answers[f.id] ?? ''}
                onChange={(e) => set(f.id, e.target.value)}
                rows={4}
              />
            )}

            {f.type === 'select' && (
              <select
                style={{ ...inputBase, height: 48, padding: '0 14px', appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', cursor: 'pointer' }}
                value={answers[f.id] ?? ''}
                onChange={(e) => set(f.id, e.target.value)}
              >
                <option value="">請選擇</option>
                {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}

            {f.type === 'radio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {f.options?.map((o) => {
                  const selected = answers[f.id] === o;
                  return (
                    <div
                      key={o}
                      onClick={() => set(f.id, o)}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10,
                        border: `1.5px solid ${selected ? '#7C3AED' : '#E2E8F0'}`,
                        background: selected ? '#EDE9FE' : '#FFFFFF',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selected ? '#7C3AED' : '#CBD5E1'}`, background: selected ? '#7C3AED' : '#FFFFFF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFFFFF' }} />}
                      </div>
                      <span style={{ fontSize: 14, color: selected ? '#5B21B6' : '#334155', fontWeight: selected ? 600 : 400 }}>{o}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {f.type === 'checkbox' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {f.options?.map((o) => {
                  const checked = (answers[f.id] ?? []).includes(o);
                  return (
                    <div
                      key={o}
                      onClick={() => {
                        const cur: string[] = answers[f.id] ?? [];
                        set(f.id, checked ? cur.filter((x) => x !== o) : [...cur, o]);
                      }}
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 10,
                        border: `1.5px solid ${checked ? '#7C3AED' : '#E2E8F0'}`,
                        background: checked ? '#EDE9FE' : '#FFFFFF',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'border-color 0.15s, background 0.15s',
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? '#7C3AED' : '#CBD5E1'}`, background: checked ? '#7C3AED' : '#FFFFFF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {checked && <span style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 800, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, color: checked ? '#5B21B6' : '#334155', fontWeight: checked ? 600 : 400 }}>{o}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginTop: 4 }}>
            <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: 'sticky', bottom: 0, background: '#FFFFFF', borderTop: '1px solid #EDF0F7', padding: '12px 16px' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          <button
            onClick={submit}
            style={{ width: '100%', height: 52, background: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: 14, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
          >
            送出回答
          </button>
        </div>
      </div>
    </div>
  );
}
