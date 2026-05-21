# 教師用語播放站

> 一鍵全螢幕顯示教師課堂用語，搭配語音朗讀，讓教室指令清晰傳達。

## 功能簡介

### 前端（學生視角 / 教師操作台）
- **左側用語列表**：依分類條列所有常用教師廣播用語
- **臨時輸入框**：教師可不登入直接輸入任意文字
- **全螢幕顯示**：按下確定後，文字全螢幕呈現，搭配縮放脈動動畫效果
- **語音朗讀**：使用 Web Speech API 自動朗讀文字（支援繁體中文）

### 後端（教師管理介面）
- Google 帳號登入（限指定管理員）
- 新增、編輯、刪除教師用語
- 即時同步至前端列表（Firebase Firestore）

---

## 預設用語分類

| 分類 | 數量 |
|------|------|
| 一、上課前與進教室 | 7 句 |
| 二、課堂秩序與專心提醒 | 11 句 |
| 三、觀看影片與聆聽說明 | 6 句 |
| 四、分組討論與合作學習 | 8 句 |
| 五、實驗操作與安全提醒 | 11 句 |
| 六、作業、習作與檢討 | 10 句 |
| 七、下課前整理與離開教室 | 9 句 |
| 八、鼓勵、提醒與收束語 | 8 句 |

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | HTML / CSS / Vanilla JS（無框架） |
| 語音 | Web Speech API（SpeechSynthesis） |
| 資料庫 | Firebase Firestore |
| 身份驗證 | Firebase Authentication（Google 登入） |
| 部署 | GitHub Pages |

---

## 專案結構（規劃中）

```
教室用語APP/
├── index.html          # 主頁（前端展示 + 教師操作台）
├── admin.html          # 後端管理介面
├── css/
│   ├── style.css       # 主樣式
│   └── fullscreen.css  # 全螢幕顯示樣式
├── js/
│   ├── app.js          # 主邏輯（列表、全螢幕、語音）
│   ├── admin.js        # 管理介面邏輯
│   └── firebase.js     # Firebase 初始化與資料存取
├── data/
│   └── phrases.json    # 初始用語資料（seed data）
├── CLAUDE.md           # 開發者說明（供 Claude Code 使用）
└── README.md           # 本文件
```

---

## 環境設定

### Firebase 設定
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案，啟用 Firestore 與 Google 登入
3. 將設定資訊填入 `js/firebase.js`

### 本地開發
```bash
# 使用任意靜態伺服器，例如：
npx serve .
# 或
python -m http.server 8080
```

### 部署至 GitHub Pages
1. 將程式碼推送至 `main` 分支
2. 至 GitHub 倉庫 Settings → Pages → 選擇 `main` 分支
3. 網站將發布於 `https://<username>.github.io/<repo-name>/`

---

## 授權

本專案為教育用途開發，用語內容版權歸原作者所有。
