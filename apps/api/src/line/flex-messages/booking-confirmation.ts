interface BookingData {
  shopName: string;
  serviceName: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  bookingId: string;
}

export function buildBookingConfirmationFlex(data: BookingData) {
  return {
    type: 'flex',
    altText: `✅ 預約成功｜${data.shopName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#27ACB2',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: '✅ 預約確認', weight: 'bold', color: '#ffffff', size: 'lg' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: data.shopName, weight: 'bold', size: 'xl', wrap: true },
          { type: 'separator', margin: 'md' },
          row('服務項目', data.serviceName),
          row('服務人員', data.staffName),
          row('預約日期', data.date),
          row('預約時間', `${data.startTime} – ${data.endTime}`),
          row('姓名', data.customerName),
          { type: 'separator', margin: 'md' },
          {
            type: 'text',
            text: `訂單編號：${data.bookingId.slice(0, 8).toUpperCase()}`,
            size: 'xs',
            color: '#aaaaaa',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'postback',
              label: '取消預約',
              data: `action=cancel_booking&bookingId=${data.bookingId}`,
              displayText: '我要取消預約',
            },
          },
        ],
      },
    },
  };
}

export function buildBookingStatusFlex(data: {
  shopName: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingId: string;
  date: string;
  startTime: string;
}) {
  const statusMap = {
    CONFIRMED: { text: '✅ 預約已確認', color: '#27ACB2' },
    CANCELLED: { text: '❌ 預約已取消', color: '#E74C3C' },
    COMPLETED: { text: '⭐ 服務已完成', color: '#8E44AD' },
  };
  const { text, color } = statusMap[data.status];

  return {
    type: 'flex',
    altText: `${text}｜${data.shopName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: color,
        paddingAll: '20px',
        contents: [{ type: 'text', text, weight: 'bold', color: '#ffffff', size: 'md' }],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          row('店家', data.shopName),
          row('日期', data.date),
          row('時間', data.startTime),
          row('訂單', data.bookingId.slice(0, 8).toUpperCase()),
        ],
      },
    },
  };
}

function row(label: string, value: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#888888', flex: 2 },
      { type: 'text', text: value, size: 'sm', weight: 'bold', flex: 3, wrap: true },
    ],
  };
}
