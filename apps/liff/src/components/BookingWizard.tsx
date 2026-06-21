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
    liff.closeWindow();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <StepIndicator
        current={step}
        total={3}
        labels={['選擇服務', '選擇時段', '確認資料']}
      />

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
      </div>
    </div>
  );
}
