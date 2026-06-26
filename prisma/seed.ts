import { PrismaClient, BookingStatus, QueueStatus, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createCipheriv, randomBytes } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const ALGORITHM = 'aes-256-gcm';

function encrypt(plainText: string): string {
  const keyHex = process.env.ENCRYPTION_KEY || '33df1574043879c538949e6d7659a4b73599a7f550b27aa45f4e8b256f924845';
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function main() {
  console.log('🌱 Start seeding database...');

  // 1. Clean up existing data in dependency order
  console.log('🧹 Cleaning up database...');
  await prisma.drawEntry.deleteMany({});
  await prisma.drawPrize.deleteMany({});
  await prisma.drawCampaign.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.formResponse.deleteMany({});
  await prisma.formTemplate.deleteMany({});
  await prisma.couponClaim.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.queueEntry.deleteMany({});
  await prisma.queueSession.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.stampEvent.deleteMany({});
  await prisma.loyaltyCard.deleteMany({});
  await prisma.loyaltyProgram.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.businessHour.deleteMany({});
  await prisma.staffService.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.merchant.deleteMany({});

  console.log('✨ Database cleaned. Creating seed data...');

  // 2. Define Fixed UUIDs for validation and references
  const MERCHANT_ID = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
  const MEMBER_ID = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
  const DUMMY_MEMBER_ID = 'b3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e';
  const STAFF_1_ID = 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f';
  const STAFF_2_ID = 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a';
  const SERVICE_1_ID = 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b';
  const SERVICE_2_ID = 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c';
  const SERVICE_3_ID = '07b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d';
  const PROGRAM_ID = '18c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e';
  const COUPON_1_ID = '29d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f';
  const COUPON_2_ID = '30e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a';
  const CAMPAIGN_ID = '41f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b';
  const CATEGORY_ID = '52a3b4c5-d6e7-8f9a-0b1c-2d3e4f5a6b7c';
  const FORM_TEMPLATE_ID = '85d6e7f8-a9b0-1c2d-3e4f-5a6b7c8d9e0f';

  // 3. Create Merchant
  const passwordHash = await bcrypt.hash('password123', 12);
  const merchant = await prisma.merchant.create({
    data: {
      id: MERCHANT_ID,
      email: 'demo@example.com',
      passwordHash,
      companyName: 'LINE Hub 示範沙龍餐飲',
      address: '台北市信義區信義路五段7號',
      logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&h=150&fit=crop',
      lineChannelId: '2001234567',
      lineChannelSecret: encrypt('channel_secret_example_value'),
      lineAccessToken: encrypt('access_token_example_value'),
      lineLiffId: process.env.VITE_LIFF_ID || 'your_liff_id_here',
      isActive: true,
    },
  });
  console.log(`✅ Created Merchant: ${merchant.companyName} (${merchant.id})`);

  // 4. Create Business Hours
  console.log('⏰ Creating Business Hours...');
  for (let i = 0; i <= 6; i++) {
    await prisma.businessHour.create({
      data: {
        merchantId: MERCHANT_ID,
        dayOfWeek: i,
        openTime: '09:00',
        closeTime: '21:00',
        isClosed: i === 0, // Closed on Sundays
      },
    });
  }

  // 5. Create Services
  console.log('💇 Creating Services...');
  await prisma.service.create({
    data: {
      id: SERVICE_1_ID,
      merchantId: MERCHANT_ID,
      name: '時尚質感剪髮 (含洗髮)',
      description: '資深設計師親自操刀，量身打造最適合您臉型的質感髮型。',
      price: 800.0,
      durationMinutes: 60,
    },
  });
  await prisma.service.create({
    data: {
      id: SERVICE_2_ID,
      merchantId: MERCHANT_ID,
      name: '深層修護染髮',
      description: '使用日系進口無氨染劑，溫和不傷頭皮，色彩飽和持久。',
      price: 2500.0,
      durationMinutes: 120,
    },
  });
  await prisma.service.create({
    data: {
      id: SERVICE_3_ID,
      merchantId: MERCHANT_ID,
      name: '頭皮甦活精油 SPA',
      description: '搭配天然植物精油進行頭部紓壓按摩，放鬆頭皮緊繃，改善髮質健康。',
      price: 1200.0,
      durationMinutes: 90,
    },
  });

  // 6. Create Staff
  console.log('🧑‍💼 Creating Staff...');
  await prisma.staff.create({
    data: {
      id: STAFF_1_ID,
      merchantId: MERCHANT_ID,
      name: '設計師 David',
      specialty: '擅長韓系短髮、空氣感燙髮與高難度剪髮設計。',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    },
  });
  await prisma.staff.create({
    data: {
      id: STAFF_2_ID,
      merchantId: MERCHANT_ID,
      name: '設計師 Emily',
      specialty: '擅長色彩美學，漸層染、耳圈染與受損髮質修復。',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    },
  });

  // 7. Associate Staff and Services
  console.log('🔗 Linking Staff to Services...');
  // David does Scissors (Service 1) and Scalp SPA (Service 3)
  await prisma.staffService.create({ data: { staffId: STAFF_1_ID, serviceId: SERVICE_1_ID } });
  await prisma.staffService.create({ data: { staffId: STAFF_1_ID, serviceId: SERVICE_3_ID } });
  // Emily does Scissors (Service 1) and Hair Color (Service 2)
  await prisma.staffService.create({ data: { staffId: STAFF_2_ID, serviceId: SERVICE_1_ID } });
  await prisma.staffService.create({ data: { staffId: STAFF_2_ID, serviceId: SERVICE_2_ID } });

  // 8. Create Members (User and Dummy)
  console.log('👥 Creating Members...');
  const member = await prisma.member.create({
    data: {
      id: MEMBER_ID,
      merchantId: MERCHANT_ID,
      lineUserId: 'dev-user-001',
      displayName: '蔡小華 (Dev Test User)',
      phone: '0912345678',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    },
  });

  const dummyMember = await prisma.member.create({
    data: {
      id: DUMMY_MEMBER_ID,
      merchantId: MERCHANT_ID,
      lineUserId: 'dummy-user-999',
      displayName: '王大同 (排隊路人)',
      phone: '0987654321',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    },
  });

  // 9. Create Bookings (Yesterday completed, tomorrow upcoming)
  console.log('📅 Creating Bookings...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Completed booking for review
  await prisma.booking.create({
    data: {
      id: '50e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5b',
      merchantId: MERCHANT_ID,
      memberId: MEMBER_ID,
      serviceId: SERVICE_1_ID,
      staffId: STAFF_1_ID,
      bookingDate: yesterday,
      startTime: '10:00',
      endTime: '11:00',
      customerName: member.displayName || '蔡小華',
      customerPhone: member.phone || '0912345678',
      status: BookingStatus.COMPLETED,
    },
  });

  // Upcoming confirmed booking
  await prisma.booking.create({
    data: {
      id: '61f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6c',
      merchantId: MERCHANT_ID,
      memberId: MEMBER_ID,
      serviceId: SERVICE_2_ID,
      staffId: STAFF_2_ID,
      bookingDate: tomorrow,
      startTime: '14:00',
      endTime: '16:00',
      customerName: member.displayName || '蔡小華',
      customerPhone: member.phone || '0912345678',
      status: BookingStatus.CONFIRMED,
      notes: '想要染深茶色，髮尾稍作修剪。',
    },
  });

  // 10. Create Loyalty Program, Card and Stamps
  console.log('🎫 Creating Loyalty Program and Card...');
  await prisma.loyaltyProgram.create({
    data: {
      id: PROGRAM_ID,
      merchantId: MERCHANT_ID,
      name: '常客集點回饋卡',
      stampsRequired: 10,
      rewardDescription: '集滿 10 點可兌換『免費剪髮一次』或『精美洗護旅行組一份』',
      isActive: true,
    },
  });

  const card = await prisma.loyaltyCard.create({
    data: {
      merchantId: MERCHANT_ID,
      memberId: MEMBER_ID,
      programId: PROGRAM_ID,
      stamps: 8, // Set to 8 so user only needs 2 points to redeem
      totalEarned: 8,
    },
  });

  await prisma.stampEvent.create({
    data: {
      cardId: card.id,
      type: 'EARN',
      count: 8,
      note: '初始註冊及消費累計點數',
    },
  });

  // 11. Create Coupons
  console.log('🎟️ Creating Coupons...');
  await prisma.coupon.create({
    data: {
      id: COUPON_1_ID,
      merchantId: MERCHANT_ID,
      title: '新加入會員歡迎禮折價券',
      description: '首次加入 LINE OA 會員即可使用，全項目消費滿 NT$300 折抵 NT$50',
      discountType: DiscountType.FIXED,
      discountValue: 50.0,
      minSpend: 300.0,
      totalLimit: 1000,
      perMemberLimit: 1,
      validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      id: COUPON_2_ID,
      merchantId: MERCHANT_ID,
      title: '夏日頭皮養護體驗八折券',
      description: '體驗精油 SPA 項目即可享 8 折特惠',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 8.0, // 8.0 is 8折 (0.8)
      minSpend: 1000.0,
      totalLimit: 500,
      perMemberLimit: 1,
      validFrom: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // 12. Create Questionnaires / Form Templates
  console.log('📝 Creating Form Templates...');
  await prisma.formTemplate.create({
    data: {
      id: FORM_TEMPLATE_ID,
      merchantId: MERCHANT_ID,
      title: '沙龍體驗滿意度調查',
      description: '感謝您今日蒞臨！請花費一分鐘協助我們填寫問卷，您的寶貴意見是我們進步的動力。',
      fields: [
        {
          id: 'gender',
          type: 'radio',
          label: '您的性別',
          required: true,
          options: ['男', '女', '其他 / 不便透露'],
        },
        {
          id: 'stylist_rating',
          type: 'rating',
          label: '您對今日設計師的溝通與技術是否滿意？',
          required: true,
        },
        {
          id: 'recommendation',
          type: 'select',
          label: '您是否願意向親友推薦我們？',
          required: true,
          options: ['非常願意', '願意', '考慮中', '不願意'],
        },
        {
          id: 'feedback',
          type: 'textarea',
          label: '是否有其他建議與指教？',
          required: false,
        },
      ],
      isActive: true,
    },
  });

  // 13. Create Menu Categories & Products
  console.log('🥤 Creating Menu and Products...');
  const category = await prisma.productCategory.create({
    data: {
      id: CATEGORY_ID,
      merchantId: MERCHANT_ID,
      name: '熱銷質感特調茶飲',
      sortOrder: 1,
    },
  });

  await prisma.product.create({
    data: {
      id: '63b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
      merchantId: MERCHANT_ID,
      categoryId: category.id,
      name: '招牌黑糖厚奶珍珠鮮奶',
      description: '每日慢火溫熬香濃黑糖珍珠，搭配頂級純淨鮮乳與海鹽起司奶蓋，層次豐富彈牙。',
      price: 75.0,
      isAvailable: true,
      sortOrder: 1,
    },
  });

  await prisma.product.create({
    data: {
      id: '74c5d6e7-f8a9-0b1c-2d3e-4f5a6b7c8d9e',
      merchantId: MERCHANT_ID,
      categoryId: category.id,
      name: '黃金四季青茶 (大杯)',
      description: '嚴選南投高山茶葉，低溫冷萃熟化，茶色翠綠爽口、回甘悠長。',
      price: 45.0,
      isAvailable: true,
      sortOrder: 2,
    },
  });

  // 14. Create Queue Session & Entries for Today
  console.log('🚶 Creating Queue Session and Entries...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const session = await prisma.queueSession.create({
    data: {
      merchantId: MERCHANT_ID,
      name: '日常候位排隊',
      date: today,
      isOpen: true,
      currentNumber: 2,
    },
  });

  // Dummy member entry 1 (status WAITING) - ahead of user
  await prisma.queueEntry.create({
    data: {
      sessionId: session.id,
      memberId: DUMMY_MEMBER_ID,
      queueNumber: 1,
      customerName: '王大同',
      customerPhone: '0987654321',
      partySize: 4,
      status: QueueStatus.WAITING,
    },
  });

  // User entry 2 (status WAITING) - waiting behind dummy
  await prisma.queueEntry.create({
    data: {
      sessionId: session.id,
      memberId: MEMBER_ID,
      queueNumber: 2,
      customerName: '蔡小華',
      customerPhone: '0912345678',
      partySize: 2,
      status: QueueStatus.WAITING,
    },
  });

  // 15. Create Lucky Draw Wheel Campaign & Prizes
  console.log('🎯 Creating Lucky Draw Campaign...');
  const startDraw = new Date();
  startDraw.setDate(startDraw.getDate() - 2);
  const endDraw = new Date();
  endDraw.setDate(endDraw.getDate() + 30);

  await prisma.drawCampaign.create({
    data: {
      id: CAMPAIGN_ID,
      merchantId: MERCHANT_ID,
      title: '夏日大輪盤驚喜抽獎',
      description: '100% 中獎機會！集點、消費滿額即可抽大獎，包含 Dyson 吹風機與沙龍折價券！',
      startAt: startDraw,
      endAt: endDraw,
      maxEntriesPerMember: 3,
      isActive: true,
      prizes: {
        create: [
          {
            name: '特獎：Dyson 頂級美髮吹風機',
            description: '市價 NT$14,600，沙龍專用款。',
            probability: 0.01,
            totalCount: 1,
            claimedCount: 0,
          },
          {
            name: '頭獎：頭皮護理精油套組',
            description: '包含洋甘菊與薄荷舒緩精油。',
            probability: 0.05,
            totalCount: 5,
            claimedCount: 0,
          },
          {
            name: '二獎：NT$200 沙龍消費抵用券',
            description: '下回消費即可折抵，無低消限制。',
            probability: 0.15,
            totalCount: 50,
            claimedCount: 0,
          },
          {
            name: '三獎：現泡飲品一杯兌換券',
            description: '限店內取餐兌換。',
            probability: 0.3,
            totalCount: 200,
            claimedCount: 0,
          },
        ],
      },
    },
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
