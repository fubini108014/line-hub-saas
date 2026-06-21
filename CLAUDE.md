# CLAUDE.md — LINE Hub SaaS 專案開發指引

## 專案簡介

LINE OA 模組化 SaaS 平台（MVP）。B2B2C 架構：
- **商家**（B）透過後台串接 LINE OA 憑證、設定服務與人員
- **消費者**（C）透過 LINE LIFF 微型網頁完成預約

## 技術棧

- **後端**：NestJS + TypeScript（`apps/api`，port 3001）
- **管理後台**：Next.js 14 App Router（`apps/admin`，port 3000）
- **LIFF App**：React + Vite（`apps/liff`，port 5173）
- **DB**：PostgreSQL + Prisma（Schema 在 `prisma/schema.prisma`）
- **Queue**：BullMQ + Redis（隊列名稱：`line-events`）
- **Monorepo**：npm workspaces

## 開發指令

```powershell
docker compose up -d postgres redis   # 啟動 DB + Redis
npm run db:migrate                     # 執行 Prisma migration
npm run dev                            # 啟動全部服務
npm run dev:api                        # 只啟動 NestJS API
npm run db:studio                      # 開啟 Prisma Studio（DB GUI）
```

## 關鍵檔案速查

| 功能 | 檔案路徑 |
|------|---------|
| Webhook 入口 | `apps/api/src/webhook/webhook.controller.ts` |
| BullMQ 事件處理 | `apps/api/src/webhook/webhook.processor.ts` |
| 時段防重疊邏輯 | `apps/api/src/bookings/availability.service.ts` |
| 預約競態鎖（FOR UPDATE） | `apps/api/src/bookings/bookings.service.ts` |
| AES-256-GCM 加解密 | `apps/api/src/common/utils/crypto.util.ts` |
| LINE Push/Reply | `apps/api/src/line/line.service.ts` |
| Flex Message 範本 | `apps/api/src/line/flex-messages/booking-confirmation.ts` |
| LIFF 主流程 | `apps/liff/src/components/BookingWizard.tsx` |
| Public API（LIFF 用） | `apps/api/src/public/public.controller.ts` |
| 商家 LINE 憑證儲存 | `apps/api/src/merchants/merchants.service.ts` |

## 資料庫 Schema 重點

- 所有資料表含 `merchant_id`（多租戶邏輯隔離）
- `merchants.lineChannelSecret` / `lineAccessToken`：AES-256-GCM 加密後儲存
- `bookings` 索引：`(merchant_id, staff_id, booking_date, status)`
- `members` 唯一約束：`(merchant_id, line_user_id)`
- `staff_services`：人員與服務的多對多關聯表

## API 設計規則

- 需要 JWT 的 API：使用 `@UseGuards(JwtAuthGuard)` + `@CurrentMerchant()` 取得商家 ID
- LIFF 用 Public API：路徑前綴 `/public/`，無需認證，以 query param 傳入 `merchantId`
- Webhook 路由：`/webhook/v1/:merchantId`，每次驗證 HMAC-SHA256 簽章

## 新增功能的標準模式

新增一個模組（如「通知模組」）：

1. 建立 `apps/api/src/notifications/` 目錄
2. 建立 `notifications.module.ts`、`notifications.service.ts`、`notifications.controller.ts`
3. 在 `apps/api/src/app.module.ts` 的 `imports` 陣列中加入新模組
4. 如需 DB 欄位，修改 `prisma/schema.prisma` 並執行 `npm run db:migrate`

## 安全性規則（勿違反）

1. LINE Channel Secret / Access Token **必須**透過 `encrypt()` / `decrypt()` 存取，絕不明碼
2. 建立預約時**必須**在 Prisma transaction 內使用 `FOR UPDATE` 鎖定
3. Webhook handler **必須**驗證 `x-line-signature`
4. `ENCRYPTION_KEY` 只能從環境變數讀取，絕不 hardcode

## Phase 2 規劃（不在 MVP 範疇）

- 金流：LINE Pay / 綠界科技
- 地圖：Google Maps 多店鋪
- 點餐：購物車系統
