import { useState } from 'react';
import { StepIndicator } from './StepIndicator';
import { StepService } from './StepService';
import { StepDateTime } from './StepDateTime';
import { StepConfirm } from './StepConfirm';
import { BookingSuccess } from './BookingSuccess';
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
  notes: string;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

export function BookingWizard({ merchantId, lineUserId }: Props) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    service: null, staff: null, date: '', startTime: '',
    customerName: '', customerPhone: '', notes: '',
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
      notes: state.notes || undefined,
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
              notes: state.notes,
            }}
            onChange={update}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <BookingSuccess
            serviceName={state.service?.name ?? ''}
            staffName={state.staff?.name ?? ''}
            date={state.date}
            startTime={state.startTime}
          />
        )}
      </div>
    </div>
  );
}
