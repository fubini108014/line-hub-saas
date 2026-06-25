const BASE = 'http://localhost:3001';

async function runTests() {
  console.log('=== Starting E2E API Integration Test ===');
  
  const email = `test-merchant-${Date.now()}@example.com`;
  const password = 'testpassword123';
  const companyName = '測試髮廊';
  
  // 1. Register
  console.log('\n[1] Registering test merchant...');
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, companyName })
  });
  if (!regRes.ok) {
    console.error('Registration failed:', await regRes.text());
    return;
  }
  const regData = await regRes.json();
  console.log('Registration success. Merchant ID:', regData.merchantId);
  const token = regData.accessToken;

  // Helper request function
  async function apiCall(method, path, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE}${path}`, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  }

  // 2. Profile
  console.log('\n[2] Fetching Profile (/merchants/me)...');
  const profile = await apiCall('GET', '/merchants/me');
  console.log('Profile Response:', profile.ok ? 'OK' : 'FAIL', profile.data);

  // 3. Services
  console.log('\n[3] Creating Service (/services)...');
  const service = await apiCall('POST', '/services', {
    name: '精緻剪髮',
    description: '含洗髮與吹整',
    price: 600,
    durationMinutes: 45
  });
  console.log('Create Service Response:', service.ok ? 'OK' : 'FAIL', service.data);
  const serviceId = service.data?.id;

  // 4. Staff
  console.log('\n[4] Creating Staff (/staff)...');
  const staff = await apiCall('POST', '/staff', {
    name: '設計師 Amy',
    specialty: '日系燙染'
  });
  console.log('Create Staff Response:', staff.ok ? 'OK' : 'FAIL', staff.data);
  const staffId = staff.data?.id;

  if (serviceId && staffId) {
    console.log('\n[4.1] Associating Staff with Service (/staff/:id/services)...');
    const assoc = await apiCall('PUT', `/staff/${staffId}/services`, {
      serviceIds: [serviceId]
    });
    console.log('Association Response:', assoc.ok ? 'OK' : 'FAIL', assoc.data);
  }

  // 5. Business Hours
  console.log('\n[5] Fetching Business Hours (/business-hours)...');
  const hours = await apiCall('GET', '/business-hours');
  console.log('Fetch Hours Response:', hours.ok ? 'OK' : 'FAIL', hours.data);

  // 6. Coupons
  console.log('\n[6] Creating Coupon (/coupons)...');
  const coupon = await apiCall('POST', '/coupons', {
    title: '新客優惠券',
    description: '首次預約現折 100 元',
    discountType: 'FIXED',
    discountValue: 100,
    perMemberLimit: 1,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  console.log('Create Coupon Response:', coupon.ok ? 'OK' : 'FAIL', coupon.data);

  // 7. Queue Session
  console.log('\n[7] Opening Queue Session (/queue/open)...');
  const queueOpen = await apiCall('POST', '/queue/open');
  console.log('Open Queue Response:', queueOpen.ok ? 'OK' : 'FAIL', queueOpen.data);

  // 8. Forms (問卷表單)
  console.log('\n[8] Creating Form Template (/forms)...');
  const form = await apiCall('POST', '/forms', {
    title: '剪髮偏好調查',
    description: '幫助我們了解您的需求',
    fields: [
      { id: 'hair_length', type: 'select', label: '目前髮長', required: true, options: ['短髮', '中長髮', '長髮'] },
      { id: 'scalp_condition', type: 'text', label: '頭皮狀況描述', required: false }
    ]
  });
  console.log('Create Form Response:', form.ok ? 'OK' : 'FAIL', form.data);

  // 9. Orders / Products
  console.log('\n[9] Creating ProductCategory (/orders/categories)...');
  const category = await apiCall('POST', '/orders/categories', {
    name: '洗護產品'
  });
  console.log('Create Category Response:', category.ok ? 'OK' : 'FAIL', category.data);
  const categoryId = category.data?.id;

  if (categoryId) {
    console.log('\n[9.1] Creating Product (/orders/products)...');
    const product = await apiCall('POST', '/orders/products', {
      name: '保濕洗髮精',
      description: '沙龍專用保濕洗髮精',
      price: 450,
      isAvailable: true,
      categoryId
    });
    console.log('Create Product Response:', product.ok ? 'OK' : 'FAIL', product.data);
  }

  // 10. Draw / Lucky Draw
  console.log('\n[10] Creating DrawCampaign (/draw/campaigns)...');
  const draw = await apiCall('POST', '/draw/campaigns', {
    title: '週年慶大轉盤',
    description: '消費滿千可參加抽獎',
    type: 'WHEEL',
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxEntriesPerMember: 1,
    prizes: [
      { name: '特獎：免費剪髮', probability: 0.05, totalCount: 5 },
      { name: '普獎：護髮折價券', probability: 0.95, totalCount: 100 }
    ]
  });
  console.log('Create DrawCampaign Response:', draw.ok ? 'OK' : 'FAIL', draw.data);

  // 11. Loyalty Program (集點卡)
  console.log('\n[11] Creating LoyaltyProgram (/loyalty/programs)...');
  const loyalty = await apiCall('POST', '/loyalty/programs', {
    name: '消費滿額集點活動',
    stampsRequired: 10,
    rewardDescription: '贈送高級護髮一次',
    isActive: true
  });
  console.log('Create LoyaltyProgram Response:', loyalty.ok ? 'OK' : 'FAIL', loyalty.data);

  console.log('\n=== E2E Test Finished ===');
}

runTests().catch(console.error);
