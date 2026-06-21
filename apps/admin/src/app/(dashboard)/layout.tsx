'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: '總覽', icon: '📊' },
  { href: '/bookings', label: '預約管理', icon: '📅' },
  { href: '/members', label: '客戶名冊', icon: '👥' },
  { href: '/reviews', label: '評價管理', icon: '⭐' },
  { href: '/loyalty', label: '集點卡', icon: '🎯' },
  { href: '/queue', label: '候位管理', icon: '🔢' },
  { href: '/coupons', label: '優惠券', icon: '🎟️' },
  { href: '/forms', label: '問卷表單', icon: '📋' },
  { href: '/orders', label: '點餐管理', icon: '🍽️' },
  { href: '/draw', label: '抽獎活動', icon: '🎰' },
  { href: '/settings/line', label: 'LINE 串接', icon: '💚' },
  { href: '/settings/services', label: '服務設定', icon: '✂️' },
  { href: '/settings/staff', label: '人員設定', icon: '👤' },
  { href: '/settings/hours', label: '營業時間', icon: '🕐' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#27ACB2' }}>LINE Hub</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>商家管理後台</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                textDecoration: 'none', color: active ? '#27ACB2' : '#ccc',
                background: active ? 'rgba(39,172,178,0.1)' : 'transparent',
                borderLeft: active ? '3px solid #27ACB2' : '3px solid transparent',
                fontSize: 14,
              }}>
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} style={{
          margin: 16, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
          background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13,
        }}>
          登出
        </button>
      </aside>
      <main style={{ flex: 1, background: '#f8f9fa', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
