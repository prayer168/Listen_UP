# 教師用語播放站 — 開發流程紀錄

## 專案基本資訊

| 項目 | 內容 |
|------|------|
| 專案名稱 | 教師用語播放站（Listen UP） |
| GitHub Repo | https://github.com/prayer168/Listen_UP |
| Firebase 專案 | listen-up-8688d |
| 管理員帳號 | prayer168@gmail.com |
| 建立日期 | 2026-05-21 |

---

## 開發流程

### Step 1 — 規劃與設計

**需求確認：**
- 教師課堂用語一鍵全螢幕顯示 + 自動語音朗讀
- 左側分類用語列表（可搜尋、可折疊）
- 自訂文字輸入 → 全螢幕播放
- Firebase Firestore 即時資料庫
- Google 帳號登入（僅管理員）
- 後台管理：新增、刪除、匯入預設用語
- 附加頁面：自然教室管理規則（靜態網頁）

**技術選型：**
- 純 HTML / CSS / Vanilla JS（無框架，直接部署 GitHub Pages）
- Firebase v10 Modular SDK（CDN 載入，無需建置工具）
- Web Speech API（瀏覽器原生 TTS，`lang: 'zh-TW'`）

---

### Step 2 — 檔案架構建立

```
教室用語APP/
├── index.html              # 前端主頁
├── admin.html              # 後台管理頁
├── rules.html              # 自然教室管理規則頁
├── css/
│   └── style.css           # 全站樣式
├── js/
│   ├── app.js              # 前端主邏輯
│   ├── admin.js            # 後台管理邏輯
│   ├── firebase-config.js  # Firebase 設定（含真實 API Key）
│   └── firebase-config.example.js  # 範本（供參考）
├── data/
│   └── phrases.json        # 70 筆預設用語（離線備援 + 匯入種子）
├── .gitignore
├── README.md
├── CLAUDE.md               # 開發者技術規格
└── MEMORY.md               # 本檔案
```

---

### Step 3 — 核心功能實作

#### 全螢幕朗讀（`js/app.js`）
- `fitText(el)`：依文字長度動態計算 `font-size`，上限 220px，反覆縮小至符合 88vw × 70vh
- `speak(text)`：Web Speech API，優先選取 `zh-TW` 語音，`rate: 0.85`
- CSS 脈動動畫：`@keyframes pulse-scale`，`scale(1) ↔ scale(1.055)`，週期 1.8s

#### 資料載入（雙重備援）
1. Firebase `onSnapshot`（即時同步）
2. 若 Firebase 未設定或讀取失敗 → fallback 載入 `data/phrases.json`

#### 管理後台（`js/admin.js`）
- Google 登入後驗證 email === `prayer168@gmail.com`
- `writeBatch` 批次匯入 70 筆預設用語
- 即時顯示用語列表，支援單筆刪除

---

### Step 4 — Firebase 設定

#### 4-1 建立 Firebase 專案
- 專案名稱：`listen-up`
- 專案 ID：`listen-up-8688d`
- 方案：Spark（免費）

#### 4-2 新增 Web 應用程式
- 暱稱：`listen-up-web`
- App ID：`1:713723849437:web:bb8b6c4b627855b8728934`

#### 4-3 啟用 Authentication
- 登入方式：Google
- 狀態：已啟用

#### 4-4 建立 Firestore Database
- 資料庫 ID：`(default)`
- 地區：`asia-east1`（台灣）
- 初始模式：正式版

#### 4-5 Firestore 安全規則
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /phrases/{docId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == 'prayer168@gmail.com';
    }
  }
}
```

---

### Step 5 — GitHub 部署

```bash
git init
git add .
git commit -m "Initial commit: 教師用語播放站"
gh repo create Listen_UP --public --push
```

**GitHub Pages 啟用方式：**
Settings → Pages → Source → Deploy from branch → `master` → `/ (root)`

---

## 後續操作說明

### 匯入預設用語
1. 前往 `admin.html`，以 `prayer168@gmail.com` 登入
2. 點「⬇ 匯入預設用語」→ 確認
3. 70 筆用語批次寫入 Firestore

### 新增用語
1. 後台管理頁登入後，在表單填入用語文字 + 選擇分類 → 新增

### 修改預設用語清單
- 編輯 `data/phrases.json`，commit 並 push

### 更新 Firestore 安全規則
- Firebase Console → Firestore → 規則 → 編輯後發布

---

## 已知注意事項

- Web Speech API 需要使用者互動才能首次啟動（瀏覽器 autoplay 政策）
- `firebase-config.js` 含真實 API Key，已納入 git 追蹤（Firebase web key 本為公開設計，安全性由 Firestore 規則保障）
- 全螢幕模式在 iOS Safari 需使用者手動操作，無法自動全螢幕
