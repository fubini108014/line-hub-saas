# LINE Hub SaaS — LINE OA 模組化商務助手

> B2B2C SaaS 平台。協助中小企業商家透過簡易憑證綁定，將「預約」等功能模組秒級串接至既有的 LINE 官方帳號。

---

## 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 後端 API | NestJS + TypeScript | v10 |
| 管理後台 | Next.js (App Router) | v14 |
| LIFF App | React + Vite | v18 / v5 |
| 資料庫 | PostgreSQL + Prisma ORM | v16 / v5 |
| 佇列 | BullMQ + Redis | v5 / v7 |
| 認證 | JWT (Access + Refresh) + bcrypt | — |
| 加密 | Node.js AES-256-GCM | 內建 |
| 容器化 | Docker Compose | — |

---

## 系統架構

```
┌──────────────────────────────────────────────────────────┐
│                        Internet                          │
└────────┬──────────────────────┬───────────────────────────┘
         │                      │
    ┌────▼──────┐          ┌────▼─────────┐
    │ Next.js   │          │  LINE OA     │
    │ Admin     │          │  Webhook     │
    │ :3000     │          │  Events      │
    └────┬──────┘          └────┬─────────┘
         │                      │ POST /webhook/v1/:merchantId
    ┌────▼──────────────────────▼──────────┐
    │           NestJS API (:3001)          │
    │                                       │
    │  Auth → JWT Guard → Controllers       │
    │                    ↓                  │
    │  Webhook Controller → BullMQ Queue    │
    │                    ↓                  │
    │  Worker Processor → LINE Service      │
    └─────────────┬─────────────────────────┘
                  │
    ┌─────────────┴──────────────┐
    │         PostgreSQL          │     Redis (BullMQ)
    │  merchants / members        │     Queue: line-events
    │  services / staff           │
    │  bookings / business_hours  │
    └─────────────────────────────┘

    ┌──────────────────────────────┐
    │  LIFF App (React+Vite :5173) │  ← 獨立部署至 CDN
    │  liff.yourdomain.com         │
    └──────────────────────────────┘
```

### 多租戶設計

- 所有資料表含 `merchant_id` 欄位，邏輯隔離
- Webhook URL 格式：`/webhook/v1/:merchantId`
- LINE 憑證（Channel Secret / Access Token）以 **AES-256-GCM** 加密後儲存於 DB

---

## 快速啟動

### 前置需求

- Node.js 20+
- Docker Desktop（運行 PostgreSQL + Redis）

### 1. 環境設定

```powershell
# 複製環境變數範本
Copy-Item .env.example .env
```

編輯 `.env`，必填項目：

```bash
# 生成 ENCRYPTION_KEY（64 位 hex = 32 bytes）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 填入 .env
ENCRYPTION_KEY=<上面指令的輸出>
JWT_SECRET=<任意 32 字以上隨機字串>
JWT_REFRESH_SECRET=<任意 32 字以上隨機字串>
```

### 2. 啟動基礎設施

```powershell
docker compose up -d postgres redis
```

### 3. 安裝依賴 & 初始化資料庫

```powershell
npm install
npm run db:generate    # 生成 Prisma Client
npm run db:migrate     # 建立資料表
```

### 4. 啟動開發伺服器

```powershell
# 同時啟動全部（API + Admin + LIFF）
npm run dev

# 或分別啟動
npm run dev:api      # NestJS  → http://localhost:3001
npm run dev:admin    # Next.js → http://localhost:3000
npm run dev:liff     # Vite    → http://localhost:5173
```

---

## 專案結構

```
line-hub-saas/
├── prisma/
│   └── schema.prisma            # 資料庫 Schema（所有資料表定義）
│
├── packages/
│   └── shared/                  # 前後端共用 TypeScript 型別
│       └── src/types/
│           ├── booking.ts
│           └── merchant.ts
│
├── apps/
│   ├── api/                     # NestJS 後端
│   │   └── src/
│   │       ├── auth/            # 商家註冊/登入 (JWT)
│   │       ├── merchants/       # 商家資料 + LINE 憑證管理
│   │       ├── services/        # 服務項目 CRUD
│   │       ├── staff/           # 人員管理 + 服務綁定
│   │       ├── business-hours/  # 每週營業時間設定
│   │       ├── bookings/        # 預約 CRUD + 時段防重疊
│   │       ├── webhook/         # LINE Webhook 路由 + BullMQ 分流
│   │       ├── line/            # LINE Push/Reply + Flex Message
│   │       ├── members/         # CRM 消費者會員管理
│   │       ├── public/          # LIFF 用無認證 API endpoints
│   │       └── common/          # 加解密工具、Guards、Decorators
│   │
│   ├── admin/                   # Next.js 14 商家管理後台
│   │   └── src/app/
│   │       ├── (auth)/          # 登入 / 註冊頁
│   │       └── (dashboard)/     # 主控台、預約、會員、設定頁
│   │
│   └── liff/                    # React + Vite 消費者預約 App
│       └── src/
│           ├── App.tsx          # LIFF 初始化 + LINE 登入
│           └── components/
│               ├── BookingWizard.tsx  # 三步驟預約主流程
│               ├── StepService.tsx    # 步驟 1：選服務 + 人員
│               ├── StepDateTime.tsx   # 步驟 2：選日期時段
│               └── StepConfirm.tsx    # 步驟 3：填資料確認
│
├── docker-compose.yml
├── .env.example
└── package.json                 # npm workspaces 根設定
```

---

## 核心資料庫 Schema

```
merchants ──┬── members      (line_user_id, merchant_id 唯一)
            ├── services     (name, price, duration_minutes)
            ├── staff        (name, specialty)
            │    └── staff_services  (多對多)
            ├── business_hours (day_of_week 0-6, open/close_time)
            └── bookings     (date, start_time, end_time, status enum)
                              status: PENDING → CONFIRMED → COMPLETED
                                                ↓
                                             CANCELLED
```

---

## API 快速參考

### 認證（無需 JWT）

| Method | Path | 說明 |
|--------|------|------|
| POST | `/auth/register` | 商家註冊 |
| POST | `/auth/login` | 商家登入 → 取得 accessToken |

### 商家設定（需 JWT）

| Method | Path | 說明 |
|--------|------|------|
| GET | `/merchants/me` | 取得商家資料 + webhookUrl |
| PUT | `/merchants/me/line-credentials` | 儲存 LINE 憑證（自動加密） |
| GET/PUT | `/business-hours` | 營業時間 |
| GET/POST/PATCH/DELETE | `/services` | 服務項目 |
| GET/POST/PATCH/PUT | `/staff` | 人員管理 |

### 預約管理（需 JWT）

| Method | Path | 說明 |
|--------|------|------|
| GET | `/bookings?date=YYYY-MM-DD` | 列出預約（可篩選） |
| GET | `/bookings/calendar?year=&month=` | 行事曆視角 |
| PATCH | `/bookings/:id/status` | 更新狀態（confirm/cancel/complete） |
| GET | `/members` | 會員名冊 |

### Public API（LIFF 用，無需 JWT）

| Method | Path | 說明 |
|--------|------|------|
| GET | `/public/services?merchantId=` | 取得服務列表 |
| GET | `/public/staff?merchantId=&serviceId=` | 取得可服務人員 |
| GET | `/public/availability?merchantId=&staffId=&serviceId=&date=` | 取得可用時段 |
| POST | `/public/bookings` | 消費者建立預約 |

### LINE Webhook

| Method | Path | 說明 |
|--------|------|------|
| POST | `/webhook/v1/:merchantId` | LINE 統一 Webhook 入口 |

---

## 關鍵流程說明

### LIFF 預約流程

```
消費者點擊 LINE 選單
    → LIFF App 開啟
    → liff.init() + liff.login() → 取得 userId
    → GET /public/services    (選服務)
    → GET /public/staff       (選人員)
    → GET /public/availability (選時段，disabled 已滿時段)
    → POST /public/bookings   (建立預約)
         ↓ DB transaction + SELECT FOR UPDATE (防競態)
    → 後端發送 Flex Message 憑證給消費者
    → liff.closeWindow()
```

### Webhook 處理流程（異步）

```
LINE 伺服器 POST → /webhook/v1/:merchantId
    → 驗證 HMAC-SHA256 簽章
    → 事件丟入 BullMQ queue（立即回應 200）
    → Worker 非同步處理：
        "預約" 關鍵字 → Reply Flex Message（含 LIFF 連結）
        postback cancel_booking → 更新狀態 + Push 通知
```

### 金鑰加密流程

```
商家輸入 Channel Secret / Access Token
    → AES-256-GCM encrypt (iv:authTag:ciphertext hex 串接)
    → 存入 DB
    
使用時：
    → 從 DB 取出 ciphertext
    → AES-256-GCM decrypt → 原始 token
    → 用於 LINE API 呼叫
```

---

## 環境變數說明

| 變數名 | 必填 | 說明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 連線字串 |
| `REDIS_URL` | ✅ | Redis 連線字串 |
| `ENCRYPTION_KEY` | ✅ | 64 位 hex 字串（32 bytes），用於 AES-256-GCM |
| `JWT_SECRET` | ✅ | JWT Access Token 簽署密鑰 |
| `JWT_REFRESH_SECRET` | ✅ | JWT Refresh Token 簽署密鑰 |
| `API_BASE_URL` | ✅ | API 公開網址（用於生成 Webhook URL） |
| `VITE_LIFF_ID` | ✅ | LINE LIFF App ID |
| `VITE_API_URL` | ✅ | LIFF App 呼叫的 API 網址 |
| `NEXT_PUBLIC_API_URL` | ✅ | Admin 後台呼叫的 API 網址 |

---

## 安全性注意事項

1. **`ENCRYPTION_KEY` 絕對不能** 提交至 git（`.gitignore` 已排除 `.env`）
2. LINE Channel Secret / Access Token 以 AES-256-GCM 加密儲存，**絕不明碼入庫**
3. Webhook 每次請求都驗證 `x-line-signature`，拒絕偽造請求
4. 預約建立使用 `SELECT FOR UPDATE` 鎖定，防止同一時段雙重預約

---

## Phase 2 擴充規劃

- **金流模組**：LINE Pay / 綠界科技，預約定金、線上付款
- **地圖模組**：Google Maps API，多店鋪距離排行
- **點餐模組**：購物車、商品規格選擇、加購邏輯
