'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post<{ accessToken: string; merchantId: string }>('/auth/login', form);
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message ?? '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>商家登入</h1>
        <p style={{ margin: '0 0 28px', color: '#888', fontSize: 14 }}>LINE Hub 管理後台</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>密碼</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} />
          </div>
          {error && <p style={{ color: '#E74C3C', fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: '#888' }}>
          還沒有帳號？<a href="/register" style={{ color: '#27ACB2' }}>立即註冊</a>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 14, marginBottom: 6, color: '#555' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { padding: '12px', borderRadius: 8, border: 'none', background: '#27ACB2', color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' };
