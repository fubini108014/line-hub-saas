import liff from '@line/liff';
import { useEffect, useState } from 'react';
import { BookingWizard } from './components/BookingWizard';
import { LoyaltyCard } from './components/LoyaltyCard';
import { MyBookings } from './components/MyBookings';
import { ReviewForm } from './components/ReviewForm';
import { QueueWizard } from './components/QueueWizard';
import { CouponList } from './components/CouponList';
import { FormFiller } from './components/FormFiller';
import { OrderWizard } from './components/OrderWizard';
import { LuckyDraw } from './components/LuckyDraw';
import { LoadingScreen } from './components/LoadingScreen';

const LIFF_TYPE_MAP: Record<string, string> = {
  booking: 'booking',
  loyalty: 'loyalty',
  'my-bookings': 'my-bookings',
  review: 'review',
  queue: 'queue',
  coupon: 'coupon',
  form: 'form',
  order: 'order',
  draw: 'draw',
};

export function App() {
  const [lineUserId, setLineUserId] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const params = new URLSearchParams(window.location.search);
  const merchantId = params.get('mid') ?? '';
  const type = LIFF_TYPE_MAP[params.get('type') ?? 'booking'] ?? 'booking';
  const extra = params.get('extra') ?? '';
  const liffId = import.meta.env.VITE_LIFF_ID as string;

  useEffect(() => {
    if (!merchantId) {
      setError('無效的連結，請從 LINE 聊天室重新開啟。');
      return;
    }

    liff
      .init({ liffId })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        return liff.getProfile();
      })
      .then((profile) => {
        if (profile) {
          setLineUserId(profile.userId);
          setReady(true);
        }
      })
      .catch(() => setError('LINE 登入失敗，請重試。'));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#E74C3C' }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!ready) return <LoadingScreen />;

  const commonProps = { merchantId, lineUserId };

  switch (type) {
    case 'loyalty':
      return <LoyaltyCard {...commonProps} />;
    case 'my-bookings':
      return <MyBookings {...commonProps} />;
    case 'review':
      return <ReviewForm {...commonProps} bookingId={extra || undefined} />;
    case 'queue':
      return <QueueWizard {...commonProps} />;
    case 'coupon':
      return <CouponList {...commonProps} />;
    case 'form':
      return <FormFiller {...commonProps} formId={extra} />;
    case 'order':
      return <OrderWizard {...commonProps} />;
    case 'draw':
      return <LuckyDraw {...commonProps} />;
    default:
      return <BookingWizard merchantId={merchantId} lineUserId={lineUserId} />;
  }
}
