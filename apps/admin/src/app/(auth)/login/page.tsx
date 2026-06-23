'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const HubIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
  </svg>
);

const FEATURES = [
  '預約管理・集點卡・優惠券',
  '候位系統・問卷表單・點餐',
  '一站串接 LINE 官方帳號',
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ accessToken: string; merchantId: string }>('/auth/login', form);
      localStorage.setItem('accessToken', res.accessToken);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message ?? '帳號或密碼不正確，請再試一次');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left: Brand panel */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <HubIcon />
          </div>
          <div className="auth-brand-title">LINE Hub</div>
          <div className="auth-brand-desc">
            為台灣商家打造的 LINE OA 模組化管理平台
          </div>
          <div className="auth-features">
            {FEATURES.map((f) => (
              <div key={f} className="auth-feature-item">
                <span className="auth-feature-dot" />
                <span className="auth-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-form-header">
            <h1 className="auth-form-title">商家登入</h1>
            <p className="auth-form-subtitle">歡迎回來，請輸入您的帳號資訊</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-fields">
              <div className="form-group">
                <label className="form-label">電子郵件</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">密碼</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input"
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? '登入中...' : '登入'}
            </button>
          </form>

          <p className="auth-footer-text">
            還沒有帳號？{' '}
            <a href="/register" style={{ fontWeight: 600 }}>立即免費註冊</a>
          </p>
        </div>
      </div>
    </div>
  );
}
