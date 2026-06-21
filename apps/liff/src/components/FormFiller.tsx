import { useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL as string;

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';
  options?: string[];
  required?: boolean;
}

interface FormTemplate {
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
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!formId) { setError('無效的表單連結'); setLoading(false); return; }
    fetch(`${BASE}/public/forms/${formId}`)
      .then((r) => r.json())
      .then(setForm)
      .catch(() => setError('載入表單失敗'))
      .finally(() => setLoading(false));
  }, [formId]);

  const set = (fieldId: string, value: any) => setAnswers((a) => ({ ...a, [fieldId]: value }));

  const submit = async () => {
    if (!form) return;
    const missing = form.fields.filter((f) => f.required && !answers[f.id]);
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

  if (loading) return <div style={styles.center}>載入中...</div>;
  if (error && !form) return <div style={{ ...styles.center, color: '#E74C3C' }}>{error}</div>;
  if (submitted) return (
    <div style={styles.center}>
      <div style={{ fontSize: 60 }}>✅</div>
      <h2 style={{ color: '#27ACB2' }}>提交成功！</h2>
      <p style={{ color: '#888' }}>感謝您填寫問卷</p>
    </div>
  );

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>{form!.title}</h2>
      {form!.description && <p style={styles.desc}>{form!.description}</p>}

      {form!.fields.map((f) => (
        <div key={f.id} style={styles.field}>
          <label style={styles.label}>
            {f.label}{f.required && <span style={{ color: '#E74C3C' }}> *</span>}
          </label>
          {f.type === 'text' && (
            <input style={styles.input} value={answers[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)} />
          )}
          {f.type === 'textarea' && (
            <textarea style={{ ...styles.input, height: 80, resize: 'none' }} value={answers[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)} rows={3} />
          )}
          {f.type === 'select' && (
            <select style={styles.input} value={answers[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)}>
              <option value="">請選擇</option>
              {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {f.type === 'radio' && f.options?.map((o) => (
            <label key={o} style={styles.optRow}>
              <input type="radio" name={f.id} value={o} checked={answers[f.id] === o} onChange={() => set(f.id, o)} />
              <span style={{ marginLeft: 8 }}>{o}</span>
            </label>
          ))}
          {f.type === 'checkbox' && f.options?.map((o) => (
            <label key={o} style={styles.optRow}>
              <input
                type="checkbox"
                checked={(answers[f.id] ?? []).includes(o)}
                onChange={(e) => {
                  const cur = answers[f.id] ?? [];
                  set(f.id, e.target.checked ? [...cur, o] : cur.filter((x: string) => x !== o));
                }}
              />
              <span style={{ marginLeft: 8 }}>{o}</span>
            </label>
          ))}
        </div>
      ))}

      {error && <p style={{ color: '#E74C3C', fontSize: 14 }}>{error}</p>}
      <button onClick={submit} style={styles.btn}>送出</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 24, maxWidth: 420, margin: '0 auto', fontFamily: 'sans-serif' },
  center: { padding: 60, textAlign: 'center', fontFamily: 'sans-serif' },
  title: { textAlign: 'center', color: '#27ACB2', marginBottom: 8 },
  desc: { textAlign: 'center', color: '#888', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { display: 'block', color: '#555', fontSize: 14, marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' },
  optRow: { display: 'flex', alignItems: 'center', marginBottom: 6, cursor: 'pointer' },
  btn: { display: 'block', width: '100%', marginTop: 24, padding: 14, background: '#27ACB2', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 700 },
};
