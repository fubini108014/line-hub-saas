# LINE OA 串接：最快最便宜驗證方案（總成本 NT$0）

> 目標：**不租任何伺服器**，用本機 Docker + 免費隧道，讓真實的 LINE 官方帳號跑通
> 「加好友 → 關鍵字觸發 → LIFF 預約 → 收到 Flex 確認訊息 → 取消預約」完整流程。
> 預估時間：半天內可完成。

## 架構總覽

```
LINE 平台
  │  webhook (HTTPS)                 ┌──────────────────────────┐
  ▼                                  │ 本機 (docker compose)     │
Cloudflare Tunnel ──────────────────▶│  api      :3001          │
  ▲                                  │  admin    :3000          │
  │  LIFF 頁面 fetch API             │  postgres :5432          │
手機 LINE App ── LIFF (Tunnel:5173) ─┘  redis    :6379          │
                                     └──────────────────────────┘
```

- **API** 用 Cloudflare Tunnel 打洞出去（LINE webhook 需要公開 HTTPS）
- **LIFF** 用第二條 Tunnel 指向本機 Vite dev server（LIFF Endpoint 也要 HTTPS）
- **Admin** 只有自己用，`localhost:3000` 即可，不用打洞

## 費用確認

| 項目 | 費用 |
|------|------|
| LINE Developers 帳號 / Messaging API channel / LIFF | 免費 |
| LINE OA 輕用量方案 | 免費（每月約 200 則**推播**額度；**回覆**訊息不計額度） |
| Cloudflare Tunnel（quick tunnel，免帳號） | 免費 |
| 本機 Docker | 免費 |

> 額度提醒：預約確認 Flex 是「推播（push）」會吃額度；關鍵字回覆是「reply」不吃額度。驗證期間量極小，完全夠用。

## 事前準備

1. 本機服務跑起來：`docker compose up -d`（四個容器都要 healthy）
2. 安裝 cloudflared：`winget install Cloudflare.cloudflared`
3. 一個 LINE Developers 帳號：https://developers.line.biz/ （用個人 LINE 帳號登入即可）

## Step 1：打通 API 隧道

```powershell
cloudflared tunnel --url http://localhost:3001
```

會得到一個隨機網址，例如 `https://xxx-yyy.trycloudflare.com`（下稱 `<API_URL>`）。

驗證：瀏覽器開 `<API_URL>/health` 應回 `{"status":"ok","db":"up"}`。

> ⚠️ quick tunnel 的網址**每次重啟都會變**，變了就要回 LINE Console 更新 webhook URL 與重 build LIFF。驗證期間讓這個終端機一直開著。

## Step 2：建立 LINE Messaging API Channel

1. LINE Developers Console → Create Provider →「Create a Messaging API channel」
   （2024 年後的流程會先建立 LINE 官方帳號，再從 OA 管理後台綁定 Messaging API）
2. 記下 **Channel ID**、**Channel Secret**（Basic settings 頁）
3. Messaging API 頁 → **Channel access token (long-lived)** → Issue，記下 token
4. 同頁設定：
   - Webhook：**啟用**（URL 下一步再填）
   - LINE 官方帳號功能 → 自動回應訊息：**停用**（否則會跟我們的 bot 打架）

## Step 3：註冊商家並填入憑證

1. 開 `http://localhost:3000/register` 註冊一個商家帳號（不要用 seed 的 demo 帳號，用自己真實的 channel）
2. 登入後到 **設定 → LINE 串接**，填入 Channel ID / Channel Secret / Access Token（後端會 AES-256-GCM 加密後存 DB）
3. 頁面會顯示這個商家的 **webhook URL**。注意：URL 的網域來自 `.env` 的 `API_BASE_URL`，記得先改成 `<API_URL>` 再重建容器：

```powershell
# .env 修改後讓容器吃到新值
docker compose up -d api
```

   或者直接手動組出來：`<API_URL>/webhook/v1/<merchantId>`（merchantId 可從 admin 網頁或 DB 查）

4. 回 LINE Console → Messaging API → Webhook URL 填入上面的網址 → 按 **Verify**，應顯示 Success
   （這一步同時驗證了 HMAC 簽章與加密憑證的解密都正常）

## Step 4：打通 LIFF 隧道並建立 LIFF App

1. 開第二條隧道指向 Vite dev server：

```powershell
npm run dev:liff          # 先啟動 LIFF（port 5173）
cloudflared tunnel --url http://localhost:5173   # 另開終端機
```

   得到 `<LIFF_URL>`。若 Vite 擋未知網域，在 `apps/liff/vite.config.ts` 的 `server` 加 `host: true, allowedHosts: true`（僅開發用）。

2. LINE Console → 該 channel → **LIFF** 分頁 → Add：
   - Size：`Full`
   - Endpoint URL：`<LIFF_URL>`
   - Scope：`profile`
3. 記下 **LIFF ID**（格式 `1234567890-abcdefgh`），填到兩個地方：
   - `.env` 的 `VITE_LIFF_ID`（重啟 `npm run dev:liff` 生效）
   - Admin → 設定 → LINE 串接 → LIFF ID 欄位（bot 回覆的預約連結會用到）

## Step 5：真機驗證清單

用手機 LINE 掃 channel 的 QR code（LINE Console → Messaging API 頁）加好友，依序驗證：

- [ ] **加好友**：API log 出現 follow 事件（`docker logs -f linehub-api`），且 BullMQ 有處理（無 error）
- [ ] **關鍵字觸發**：對 OA 輸入「預約」（支援：預約 / 我要預約 / booking / 約）→ 收到含 LIFF 連結的回覆
- [ ] **LIFF 預約**：點連結 → LIFF 開啟（`https://liff.line.me/<LIFF_ID>?mid=<merchantId>`）→ 走完 4 步驟預約精靈
- [ ] **Flex 推播**：預約完成後收到「預約確認」Flex Message（含服務、時段、取消按鈕）
- [ ] **Admin 同步**：`localhost:3000/bookings` 看得到這筆預約
- [ ] **postback 取消**：按 Flex 上的取消按鈕 → 預約狀態變 CANCELLED、時段釋出
- [ ] **狀態推播**：Admin 把預約改成「確認」→ 手機收到狀態更新 Flex

## 常見坑

| 症狀 | 原因 / 解法 |
|------|------------|
| Webhook Verify 失敗 | merchantId 打錯、Channel Secret 填錯、或 `.env` 改了但容器沒重建 |
| LIFF 開啟白畫面 | `VITE_LIFF_ID` 沒設、或 Endpoint URL 跟隧道網址不一致 |
| LIFF 內 API 全部失敗（CORS） | `.env` 的 `ALLOWED_ORIGINS` 要加上 `<LIFF_URL>`，然後 `docker compose up -d api` |
| 收不到 Flex 推播 | Access Token 貼錯或過期；看 `docker logs linehub-api` 的 LINE API 錯誤回應 |
| 隧道網址變了全部失效 | quick tunnel 重啟就換網址——webhook URL、LIFF Endpoint、`API_BASE_URL`、`ALLOWED_ORIGINS` 四處要一起更新 |

## 驗證通過後的正式部署（下一步，仍然低成本）

| 元件 | 建議去處 | 費用 |
|------|---------|------|
| API + Postgres + Redis | Zeabur / Render / Railway（直接吃現成 `apps/api/Dockerfile`） | 免費額度起步 |
| LIFF | GitHub Pages 或 Cloudflare Pages（注意 Vite `base` 子路徑） | 免費 |
| Admin | Vercel | 免費 |

正式部署後把 webhook URL / LIFF Endpoint 換成固定網址，就不再有「隧道網址會變」的問題。
