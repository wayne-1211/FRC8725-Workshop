# 培訓室工具與材料管理系統 (Workshop Manager)

一個**純靜態**網頁應用程式，用來管理培訓室內工具、設備與材料的存放位置、狀態與數量。
只使用 HTML5、CSS3、原生 JavaScript（ES Modules）、Firebase Web SDK 與 JSON 設定檔，
不需要任何打包／編譯步驟，可直接部署到任何靜態網站服務。

---

## ✨ 功能

- **互動式平面圖**：從 JSON 動態產生可點擊的櫃子區域，滑鼠移入顯示摘要 Tooltip，支援鍵盤操作。
- **全域搜尋**：可搜尋名稱、標籤、說明、櫃子與抽屜名稱；不分大小寫、支援中文與部分關鍵字。
- **櫃子詳細頁**：依 JSON 定義的物理結構（列／欄／抽屜／層板）動態產生 CSS Grid。
- **新增／編輯／刪除**：可重複使用的表單 Modal，依「工具／材料」動態切換欄位，刪除需二次確認。
- **標籤系統**：Enter 建立、× 移除、防止重複、可點擊建議標籤。
- **工具狀態**：可用 / 使用中 / 維修中 / 找不到 / 不可用，並以顏色 + 文字雙重標示。
- **材料數量**：大約數量、單位、最低存量、低存量與缺貨警示。
- **搜尋定位**：從搜尋結果一鍵跳到對應櫃子，自動高亮抽屜與物品並捲動至該位置。
- **Firebase / 示範資料自動切換**：未設定 Firebase 時自動改用 `data/demo-items.json` + `localStorage`，永不崩潰。
- **Toast 通知**與完整的載入 / 空白 / 錯誤狀態處理。
- **平面圖自動縮放**：桌面版依可用視窗高度自動縮放，一次完整顯示整張平面圖，且點擊區域同步對齊。
- **搜尋結果面板限高**：搜尋欄與模式切換固定在上方，只有結果清單捲動，不會把平面圖推出畫面。
- **搜尋結果 ↔ 平面圖連動**：滑鼠移入或鍵盤 Focus 到搜尋結果時，平面圖上對應櫃子會高亮並顯示摘要。
- **卡片 / 列表雙檢視**：櫃子詳細頁與搜尋結果都可切換卡片與列表模式，偏好記在 `localStorage`。
- **響應式**：桌面三欄、平板兩欄、手機單欄。

---

## 📁 專案結構

```text
workshop-manager/
├── index.html              # 平面圖總覽 + 全域搜尋
├── storage.html            # 櫃子詳細頁（共用，依 ?id= 載入）
├── css/
│   ├── theme.css           # 指定配色 CSS 變數
│   ├── layout.css          # 版面、導覽、響應式
│   ├── components.css      # 按鈕、卡片、Modal、Toast…
│   ├── home.css            # 首頁 / 平面圖樣式
│   └── storage.css         # 詳細頁樣式
├── js/
│   ├── app.js              # 共用：導覽、資料模式橫幅、重設示範
│   ├── home.js             # 首頁邏輯
│   ├── storage.js          # 詳細頁邏輯
│   ├── firebase-config.js  # ← 你填入 Firebase 設定的地方
│   ├── firebase-service.js # Firestore 操作封裝
│   ├── data-service.js     # 資料抽象層（Firebase / localStorage 自動切換）
│   ├── search.js           # 搜尋邏輯
│   ├── labels.js           # 狀態 / 類型 / 標籤（讀 labels.json）
│   ├── item-view.js        # 卡片/列表共用渲染、模式切換、模式偏好
│   ├── map-renderer.js     # 平面圖熱區、Tooltip、搜尋高亮連動
│   ├── map-calibrate.js    # 平面圖校正工具（量測新座標）
│   ├── storage-renderer.js # 櫃子結構（呼叫 item-view 渲染物品）
│   ├── item-form.js        # 新增 / 編輯表單
│   ├── modal.js            # Modal 與確認視窗
│   ├── notifications.js    # Toast 通知
│   └── utils.js            # 共用工具、圖示與常數
├── config/
│   ├── workshop-map.json      # 平面圖區域座標（百分比）
│   ├── storage-structures.json# 櫃子物理結構
│   └── labels.json            # 狀態 / 類型 / 標籤定義（含顏色）
├── data/
│   └── demo-items.json     # 示範工具 / 材料資料
├── images/
│   ├── icon.ico            # Team 8725 Logo（favicon + 側欄）
│   ├── workshop-floor-plan.svg
│   └── placeholder-item.svg
└── README.md
```

---

## 🚀 在本機執行

> ⚠️ **請勿直接用 `file://` 開啟 `index.html`。**
> 本專案透過 `fetch()` 載入 JSON 設定檔，且使用 ES Modules，
> 瀏覽器在 `file://` 下會因 CORS / 模組安全限制而無法載入。必須透過 HTTP 伺服器開啟。

### 方法 A：VS Code Live Server（推薦）

1. 安裝「**Live Server**」擴充套件。
2. 在 `index.html` 上按右鍵 →「**Open with Live Server**」。
3. 瀏覽器會開啟 `http://127.0.0.1:5500/index.html`。

### 方法 B：Python 內建伺服器

```bash
python -m http.server 8000
```

接著開啟：

```text
http://localhost:8000
```

（網站本身不依賴 Python，這只是本機預覽的一種方式。）

### 方法 C：Node 靜態伺服器

```bash
npx serve .
```

---

## ☁️ 部署

### GitHub Pages

1. 將整個資料夾推送到 GitHub repository。
2. Repository → **Settings → Pages**。
3. **Source** 選擇 `Deploy from a branch`，Branch 選 `main` / 根目錄 `/`。
4. 儲存後即可透過 `https://<帳號>.github.io/<repo>/` 開啟。

### Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages**。
2. 連結 Git repository（或直接上傳資料夾）。
3. **Build command 留空**，**Build output directory** 設為 `/`（根目錄）。
4. 部署完成後即可使用。

> 因為是純靜態專案，其他服務（Firebase Hosting、Netlify、一般靜態伺服器）同樣直接部署根目錄即可，
> **不需要** build 指令。

---

## 自訂狀態、類型與標籤（labels.json）

工具狀態、物品類型與標籤的**文字與顏色**集中在 `config/labels.json`，
格式統一為 `{ name, color, label }`：

```json
{
  "statuses": [
    { "name": "in-use", "color": "#ffbc5e", "label": "使用中" }
  ],
  "categories": [
    { "name": "tool", "color": "#87d1ff", "label": "工具" }
  ],
  "tags": [
    { "name": "常用", "color": "#c6543d", "label": "常用" }
  ]
}
```

- `name`：程式與資料中實際儲存的值（例如物品的 `status` 欄位存 `"in-use"`）。**修改 `name` 時，請同步更新 `demo-items.json` / Firestore 內的資料**，否則會對應不到。
- `color`：徽章 / 標籤顯示的顏色（HEX）。
- `label`：畫面上顯示的文字。

想新增一個工具狀態或標籤，只要在對應陣列加一筆即可，**不需要改任何 CSS 或 JavaScript**。
若 `labels.json` 載入失敗，程式會使用內建後備定義，不會崩潰。

---

## 自訂平面圖與櫃子

### 更換平面圖（換一張新的平面圖）

1. 將新圖片放入 `images/`（例如 `images/workshop-floor-plan.png`），建議維持原始長寬比。
2. 修改 `config/workshop-map.json` 的 `mapImage` 欄位指向新檔案。
3. 重新量測每個櫃子的座標（見下方「校正工具」）。因為座標是**百分比**，只要比例正確，平面圖縮放後仍會對齊。

### 用校正工具量測座標（推薦）

換新平面圖後，最花時間的是抓每個櫃子的 `x / y / width / height`。內建校正工具可以幫你：

1. 開啟 `index.html?calibrate=1`。
2. 平面圖會顯示目前所有區域的外框與名稱，並進入「校正模式」。
3. 直接在平面圖上**用滑鼠拖曳**框出一個櫃子的範圍。
4. 右下角面板會即時顯示該範圍的百分比座標，例如：

   ```json
   { "x": 11.29, "y": 10.75, "width": 10.94, "height": 5.75 }
   ```

5. 按「複製 JSON」，再貼回 `workshop-map.json` 對應區域的座標欄位即可。

> 校正工具只是輔助量測，不會改動任何檔案；實際座標仍以 `workshop-map.json` 為準。

### 修改櫃子座標 / 新增櫃子

編輯 `config/workshop-map.json` 的 `areas` 陣列，每個區域：

```json
{
  "id": "cabinet-11",       // 唯一 ID（會出現在網址 ?id=）
  "name": "櫃 11",           // 顯示名稱
  "type": "cabinet",         // 類型（影響 Tooltip 標籤）
  "x": 11.29,                // 左上角 X（% 相對圖片寬）
  "y": 10.75,                // 左上角 Y（% 相對圖片高）
  "width": 10.94,            // 寬（%）
  "height": 5.75,            // 高（%）
  "rotation": 0,             // 旋轉角度
  "structureId": "drawer-4v" // 對應的物理結構 ID
}
```

新增一個櫃子只要在 `areas` 加一筆並指定 `structureId` 即可，**不需要新增任何 HTML**。

### 修改櫃子物理結構

編輯 `config/storage-structures.json`。此檔**只**描述櫃子外觀（列、欄、抽屜、層板），
**不**存放實際工具 / 材料資料：

```json
{
  "id": "drawer-4v",
  "name": "四層抽屜櫃",
  "layoutType": "grid",
  "columns": 1,
  "rows": 4,
  "sections": [
    { "id": "d1", "name": "第 1 層抽屜", "row": 1, "column": 1, "rowSpan": 1, "columnSpan": 1, "type": "drawer" }
  ]
}
```

- `columns` / `rows`：Grid 的欄數與列數。
- 每個 `section` 用 `row`、`column`、`rowSpan`、`columnSpan` 定位，可跨列 / 跨欄。
- `type`：`drawer` / `shelf` / `hook` / `bin` / `area`（僅影響標籤文字）。

---

## 🔥 設定 Firebase（選用）

未填入設定時系統會自動使用示範資料，**可以完全不設定 Firebase 就正常使用**。
若要讓多人共用同一份資料，請設定 Firebase：

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案，並建立 **Cloud Firestore** 資料庫。
2. 專案設定 → 你的應用程式 → 複製 Web 設定值。
3. 打開 `js/firebase-config.js`，填入你的設定：

```js
export const firebaseConfig = {
  apiKey: "…",
  authDomain: "…",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…",
  measurementId: "…"
};
```

只要 `apiKey` 與 `projectId` 不再是 `YOUR_...`，系統就會自動切換到 Firestore。

### Firestore Collection 結構

使用單一 collection：`items`。每筆文件代表一個工具或材料：

```jsonc
{
  "name": "12V 電動起子",
  "category": "tool",          // "tool" | "material"
  "storageId": "cabinet-11",   // 對應 workshop-map.json 的區域 id
  "sectionId": "d1",           // 對應 structure 的 section id
  "status": "available",       // 工具狀態
  "quantity": 120,             // 材料數量（工具為 null）
  "quantityMode": "approximate",
  "unit": "顆",
  "minimumQuantity": 30,
  "tags": ["電動工具", "常用"],
  "description": "…",
  "imageUrl": "",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

`createdAt` / `updatedAt` 由前端寫入時自動加入（使用 Firestore `serverTimestamp()`）。

### ⚠️ Firestore Security Rules 注意事項

- Firebase **API Key 可以放在前端**，但它**不是**權限保護，任何人都看得到。真正的存取控制在 Security Rules。
- **請勿**將資料庫設定為永久公開讀寫，例如以下規則**僅供本機測試，切勿用於正式環境**：

  ```
  // ⚠️ 危險，僅供測試
  allow read, write: if true;
  ```

- 正式環境建議搭配 **Firebase Authentication**，例如：

  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /items/{itemId} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

- **不要**在前端放入 Firebase Admin SDK 或 Service Account JSON，本專案也未使用它們。
- 目前尚未實作登入，但程式架構已預留未來加入 Firebase Authentication 的空間。

---

## 卡片 / 列表顯示模式

櫃子詳細頁與首頁搜尋結果都可切換「卡片」與「列表」兩種檢視：

- **卡片模式**：資訊較完整（縮圖、名稱、類型、狀態/數量、完整位置、標籤、說明、最後更新時間、操作）。
- **列表模式**：一列一項，較緊湊，一次看更多物品。

切換不會重新載入資料、不會清除搜尋或篩選。偏好記在 `localStorage`：

| key | 用途 | 允許值 | 預設 |
| --- | --- | --- | --- |
| `workshop-storage-view-mode` | 櫃子詳細頁顯示模式 | `card` / `list` | `card` |
| `workshop-search-view-mode` | 搜尋結果顯示模式 | `card` / `list` | `list` |
| `workshop-manager-items` | 示範模式下的物品資料 | — | — |

---

## ♻️ 重設示範資料

在示範模式（未設定 Firebase）下：

1. 首次開啟會將 `data/demo-items.json` 寫入 `localStorage`（key：`workshop-manager-items`）。
2. 之後所有新增 / 修改 / 刪除都會存回 `localStorage`，重新整理後仍保留。
3. 想還原成內建示範資料時，點擊左側導覽的「**重設示範資料**」或資料模式橫幅上的按鈕，
   確認後即會清除變更並重新載入。

---

## 🧩 未來可擴充

架構已預留（目前未完整實作）：使用者登入、管理員權限、借用 / 歸還紀錄、
QR Code / 條碼、圖片上傳、操作紀錄、採購清單、多培訓室、即時同步、平面圖圖形化編輯器。
