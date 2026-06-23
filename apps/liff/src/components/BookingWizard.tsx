import liff from '@line/liff';
import { useState } from 'react';
import { StepIndicator } from './StepIndicator';
import { StepService } from './StepService';
import { StepDateTime } from './StepDateTime';
import { StepConfirm } from './StepConfirm';
import { createBooking, ServiceItem, StaffMember } from '../lib/api';

interface Props {
  merchantId: string;
  lineUserId: string;
}

interface WizardState {
  service: ServiceItem | null;
  staff: StaffMember | null;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

export function BookingWizard({ merchantId, lineUserId }: Props) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    service: null, staff: null, date: '', startTime: '',
    customerName: '', customerPhone: '',
  });

  const update = (partial: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const handleSubmit = async () => {
    await createBooking({
      merchantId,
      lineUserId,
      serviceId: state.service!.id,
      staffId: state.staff!.id,
      date: state.date,
      startTime: state.startTime,
      customerName: state.customerName,
      customerPhone: state.customerPhone,
    });
    setStep(4);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: FONT,
    }}>
      {/* Sticky header with step indicator (hidden on success screen) */}
      {step < 4 && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#FFFFFF',
          borderBottom: '1px solid #EDF0F7',
        }}>
          <StepIndicator
            current={step}
            total={3}
            labels={['選擇服務', '選擇時段', '確認預約']}
          />
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {step === 1 && (
          <StepService
            merchantId={merchantId}
            onSelect={(service, staff) => {
              update({ service, staff });
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <StepDateTime
            merchantId={merchantId}
            staffId={state.staff!.id}
            serviceId={state.service!.id}
            onSelect={(date, startTime) => {
              update({ date, startTime });
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepConfirm
            data={{
              serviceName: state.service!.name,
              staffName: state.staff!.name,
              date: state.date,
              startTime: state.startTime,
              customerName: state.customerName,
              customerPhone: state.customerPhone,
            }}
            onChange={update}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}>
            {/* Checkmark circle */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 8px',
              textAlign: 'center',
            }}>
              預約成功！
            </h2>
            <p style={{
              fontSize: 13,
              color: '#64748B',
              margin: '0 0 28px',
              textAlign: 'center',
            }}>
              我們將透過 LINE 發送確認訊息
            </p>

            {/* Summary card */}
            <div style={{
              width: '100%',
              maxWidth: 400,
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #EDF0F7',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
              padding: '0 16px',
              marginBottom: 24,
            }}>
              {([
                ['服務項目', state.service?.name ?? ''],
                ['服務人員', state.staff?.name ?? ''],
                ['預約日期', state.date],
                ['預約時間', state.startTime],
              ] as const).map(([label, value], idx, arr) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 0',
                    borderBottom: idx < arr.length - 1 ? '1px solid #EDF0F7' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => liff.closeWindow()}
              style={{
                width: '100%',
                maxWidth: 400,
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: '#7C3AED',
                color: '#FFFFFF',
                fontSize: 15.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              關閉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
