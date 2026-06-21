'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post<{ accessToken: string }>('/auth/register', form);
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message ?? '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>建立商家帳號</h1>
        <p style={{ margin: '0 0 28px', color: '#888', fontSize: 14 }}>免費開始使用 LINE Hub</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'companyName', label: '店家名稱', type: 'text', placeholder: '例：美麗髮廊' },
            { key: 'email', label: 'Email', type: 'email', placeholder: '' },
            { key: 'password', label: '密碼（至少 8 碼）', type: 'password', placeholder: '' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: 14, marginBottom: 6, color: '#555' }}>{label}</label>
              <input type={type} required placeholder={placeholder} value={(form as any)[key]} onChange={f(key)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' as const }} />
            </div>
          ))}
          {error && <p style={{ color: '#E74C3C', fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '建立中...' : '建立帳號'}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#888' }}>
          已有帳號？<a href="/login" style={{ color: '#27ACB2' }}>前往登入</a>
        </p>
      </div>
    </div>
  );
}
