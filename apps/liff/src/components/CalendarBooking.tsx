import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarGrid } from './CalendarGrid';
import { DayAvailabilityList } from './DayAvailabilityList';
import { StaffFilterBar } from './StaffFilterBar';
import { SegmentFilterBar } from './SegmentFilterBar';
import { StepConfirm } from './StepConfirm';
import { BookingSuccess } from './BookingSuccess';
import {
  fetchMonthAvailability,
  fetchDayAvailability,
  fetchAllStaff,
  fetchCalendarSettings,
  createBooking,
  DayAvailabilityInfo,
  DayAvailabilityItem,
  StaffOption,
  CalendarSettings,
} from '../lib/api';
import { Segment, segmentOf } from '../lib/segment';

interface Props {
  merchantId: string;
  lineUserId: string;
}

const FONT = "'Plus Jakarta Sans', -apple-system, 'PingFang TC', sans-serif";

export function CalendarBooking({ merchantId, lineUserId }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [statusByDate, setStatusByDate] = useState<Record<string, DayAvailabilityInfo>>({});
  const [monthLoading, setMonthLoading] = useState(true);

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayItems, setDayItems] = useState<DayAvailabilityItem[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState<DayAvailabilityItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [quickBookSearching, setQuickBookSearching] = useState(false);
  const [quickBookNotice, setQuickBookNotice] = useState<string | null>(null);
  const pendingSelectRef = useRef<string | null>(null);

  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    fetchCalendarSettings(merchantId)
      .then(setSettings)
      .catch(() => setSettings({ enabled: true, morningEndTime: '12:00', afternoonEndTime: '17:00', lowStockThreshold: 3 }))
      .finally(() => setSettingsLoading(false));
  }, [merchantId]);

  useEffect(() => {
    fetchAllStaff(merchantId)
      .then(setStaffOptions)
      .catch(() => setStaffOptions([]));
  }, [merchantId]);

  useEffect(() => {
    setMonthLoading(true);
    setDayItems([]);
    const pending = pendingSelectRef.current;
    pendingSelectRef.current = null;
    if (!pending) setSelectedDate(null);
    fetchMonthAvailability(merchantId, year, month, selectedStaffId ?? undefined)
      .then((data) => {
        setStatusByDate(data);
        if (pending) setSelectedDate(pending);
      })
      .catch(() => setStatusByDate({}))
      .finally(() => setMonthLoading(false));
  }, [merchantId, year, month, selectedStaffId]);

  useEffect(() => {
    if (!selectedDate) return;
    setDayLoading(true);
    fetchDayAvailability(merchantId, selectedDate, selectedStaffId ?? undefined)
      .then(setDayItems)
      .catch(() => setDayItems([]))
      .finally(() => setDayLoading(false));
  }, [merchantId, selectedDate, selectedStaffId]);

  const visibleDayItems = useMemo(
    () =>
      selectedSegment
        ? dayItems.filter(
            (item) => segmentOf(item.time, settings?.morningEndTime, settings?.afternoonEndTime) === selectedSegment,
          )
        : dayItems,
    [dayItems, selectedSegment, settings],
  );

  const goPrevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const handleSelectStaff = (id: string | null) => {
    setQuickBookNotice(null);
    setSelectedStaffId(id);
  };
  const handleSelectSegment = (seg: Segment | null) => {
    setQuickBookNotice(null);
    setSelectedSegment(seg);
  };
  const handleSelectDate = (d: string) => {
    setQuickBookNotice(null);
    setSelectedDate(d);
  };

  const handleQuickBook = async () => {
    setQuickBookSearching(true);
    setQuickBookNotice(null);
    try {
      let y = year;
      let m = month;
      let found: string | null = null;

      for (let i = 0; i < 6 && !found; i++) {
        const info = await fetchMonthAvailability(merchantId, y, m, selectedStaffId ?? undefined);
        const dates = Object.keys(info).sort();
        for (const d of dates) {
          const dInfo = info[d];
          const ok = selectedSegment ? dInfo[selectedSegment] : dInfo.status === 'available';
          if (ok) { found = d; break; }
        }
        if (!found) {
          m += 1;
          if (m > 12) { m = 1; y += 1; }
        }
      }

      if (!found) {
        setQuickBookNotice('近期查無可預約時段，請試試其他篩選條件');
        return;
      }

      const [fy, fm, fd] = found.split('-').map(Number);
      if (fy !== year || fm !== month) {
        pendingSelectRef.current = found;
        setYear(fy);
        setMonth(fm);
      } else {
        setSelectedDate(found);
      }
      setQuickBookNotice(`已為你找到最快可預約日期：${fm} 月 ${fd} 日`);
    } finally {
      setQuickBookSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedItem || !selectedDate) return;
    await createBooking({
      merchantId,
      lineUserId,
      serviceId: selectedItem.serviceId,
      staffId: selectedItem.staffId,
      date: selectedDate,
      startTime: selectedItem.time,
      customerName,
      customerPhone,
      notes: notes || undefined,
    });
    setSubmitted(true);
  };

  if (settingsLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, color: '#94A3B8', fontSize: 14 }}>
        載入中...
      </div>
    );
  }

  if (settings && !settings.enabled) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: FONT,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 32, margin: '0 0 12px' }}>🚧</p>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
          此功能暫未開放
        </h2>
        <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
          預約日曆目前暫停使用，請洽詢商家或改用其他預約方式
        </p>
      </div>
    );
  }

  if (submitted && selectedItem && selectedDate) {
    return (
      <BookingSuccess
        serviceName={selectedItem.serviceName}
        staffName={selectedItem.staffName}
        date={selectedDate}
        startTime={selectedItem.time}
      />
    );
  }

  if (selectedItem && selectedDate) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <StepConfirm
            data={{
              serviceName: selectedItem.serviceName,
              staffName: selectedItem.staffName,
              date: selectedDate,
              startTime: selectedItem.time,
              customerName,
              customerPhone,
              notes,
            }}
            onChange={(partial) => {
              if (partial.customerName !== undefined) setCustomerName(partial.customerName);
              if (partial.customerPhone !== undefined) setCustomerPhone(partial.customerPhone);
              if (partial.notes !== undefined) setNotes(partial.notes);
            }}
            onSubmit={handleSubmit}
            onBack={() => setSelectedItem(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: FONT }}>
      <style>{`
        .calendar-booking-layout {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 900px) {
          .calendar-booking-layout {
            flex-direction: row;
            align-items: flex-start;
            gap: 24px;
            max-width: 900px;
            margin: 0 auto;
          }
          .calendar-booking-layout > .calendar-pane {
            flex: 0 0 380px;
          }
          .calendar-booking-layout > .list-pane {
            flex: 1;
            max-height: calc(100vh - 140px);
            overflow-y: auto;
          }
        }
      `}</style>

      <div style={{ padding: '20px 16px 0', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
          預約日曆
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 14px' }}>
          先選人員，再挑日期與時段
        </p>
        <div style={{ marginBottom: 8 }}>
          <StaffFilterBar staff={staffOptions} selectedStaffId={selectedStaffId} onSelect={handleSelectStaff} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SegmentFilterBar selectedSegment={selectedSegment} onSelect={handleSelectSegment} />
          </div>
          <button
            onClick={handleQuickBook}
            disabled={quickBookSearching}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              border: '1.5px solid #7C3AED',
              background: '#FFFFFF',
              color: '#7C3AED',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: quickBookSearching ? 'not-allowed' : 'pointer',
              opacity: quickBookSearching ? 0.6 : 1,
              fontFamily: FONT,
              whiteSpace: 'nowrap',
            }}
          >
            ⚡ {quickBookSearching ? '搜尋中...' : '最快可預約'}
          </button>
        </div>
        {quickBookNotice && (
          <p style={{ fontSize: 12.5, color: '#7C3AED', margin: '0 0 8px', fontWeight: 600 }}>
            {quickBookNotice}
          </p>
        )}
      </div>

      <div className="calendar-booking-layout" style={{ padding: '0 16px 32px' }}>
        <div className="calendar-pane" style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #EDF0F7',
          boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
          padding: 16,
          marginBottom: 16,
        }}>
          <CalendarGrid
            year={year}
            month={month}
            statusByDate={statusByDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            loading={monthLoading}
            showSegments={selectedStaffId !== null}
            segmentFilter={selectedSegment}
          />
        </div>

        <div className="list-pane">
          <DayAvailabilityList
            date={selectedDate}
            items={visibleDayItems}
            loading={dayLoading}
            onSelect={setSelectedItem}
            lowStockThreshold={settings?.lowStockThreshold ?? 3}
          />
        </div>
      </div>
    </div>
  );
}
