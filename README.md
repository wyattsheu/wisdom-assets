# 每日智慧小語 · 手機桌面小工具

每天在手機桌面自動顯示一張佛法小語卡片，**每天換一張**，不用手動操作。

- 支援 **iPhone / iPad** 與 **Android**
- 共 **729 張**卡片，隨機挑選，同一天固定同一張
- 圖片存在雲端，手機只在換日時抓一次，**平常不耗網路、不耗電**
- 完全免費，沒有廣告、不需註冊、不收集任何個人資料

## 📷 實際效果

<table>
<tr>
<td align="center" width="50%"><b>Android</b></td>
<td align="center" width="50%"><b>iPhone</b></td>
</tr>
<tr>
<td><img src="https://wyattsheu.github.io/wisdom-assets/screenshots/android.png" width="100%"></td>
<td><img src="https://wyattsheu.github.io/wisdom-assets/screenshots/ios.png" width="100%"></td>
</tr>
</table>

---

## 📱 iPhone / iPad 安裝

iOS 需要透過免費的 **Scriptable** App 來顯示（Apple 不允許直接安裝第三方小工具）。

### 步驟 1：安裝 Scriptable

App Store 搜尋 **Scriptable**（作者 Simon Støvring，圖示是黑底白色摺紙），免費下載。

> 👉 [App Store 連結](https://apps.apple.com/app/scriptable/id1405459188)

### 步驟 2：建立腳本

1. 打開 **Scriptable**
2. 點右上角 **➕**
3. 打開 👉 **[widget.js](widget.js)**，全選複製裡面全部的程式碼
4. 回到 Scriptable，貼上
5. 點左上角 **完成**
6. 點一下腳本名稱（預設是 Untitled Script），改名為 **智慧小語**

### 步驟 3：加到桌面

1. 回到桌面，**長按空白處**直到圖示開始晃動
2. 點左上角 **➕**
3. 搜尋並選擇 **Scriptable**
4. 左右滑動選 **大尺寸（Large）** ← 建議用最大的，卡片文字才清楚
5. 點 **加入小工具**
6. **長按剛加入的小工具** → 點 **編輯小工具**
7. `Script` 選 **智慧小語**
8. `When Interacting` 選 **Run Script**
9. 點桌面空白處完成

完成！第一次會需要幾秒下載圖片。

---

## 🤖 Android 安裝

### 步驟 1：下載安裝檔

用**手機瀏覽器**打開下面連結，下載 `app-debug.apk`：

> 👉 **https://github.com/wyattsheu/wisdom-android/releases/latest**

（在 Assets 區塊裡點 `app-debug.apk`）

### 步驟 2：允許安裝

因為不是從 Google Play 下載，手機會跳出提醒：

1. 點下載完成的通知，或到「檔案 / 下載」資料夾點 `app-debug.apk`
2. 出現「基於安全考量，你的手機不允許安裝來源不明的應用程式」→ 點 **設定**
3. 開啟 **允許此來源的應用程式**
4. 返回，點 **安裝**

> 這是正常現象。因為這是自己編譯的 App，沒有上架 Google Play，所以會有這個提示。

### 步驟 3：加到桌面

1. 回到桌面，**長按空白處**
2. 點 **小工具 / Widgets**
3. 找到 **每日智慧小語**
4. **長按拖曳**到桌面，建議放大到 **4×4 格**（可自由調整大小）

完成！

**系統需求**：Android 7.0 以上

---

## 💡 使用說明

| 問題 | 說明 |
|---|---|
| 多久換一張？ | **每天換一張**。同一天內不管看幾次都是同一張。 |
| 幾點換？ | iOS 約每天凌晨 **00:05** 更新；Android 每 6 小時檢查一次，跨日就換。 |
| 可以手動換嗎？ | iOS：點一下小工具會重新執行。Android：移除小工具再重新加入。 |
| 沒網路會怎樣？ | 會**繼續顯示上一張**，不會變空白。有網路時自動恢復。 |
| 很耗網路嗎？ | 不會。每天只下載一張約 **120 KB** 的圖，一個月約 3.6 MB。 |
| 很耗電嗎？ | 不會。平常完全不執行，只在換日時抓一次圖。 |
| 圖片會模糊嗎？ | 不會。素材已預先放大到 1320×1840，手機是在**縮小**顯示，所以清晰。 |

### 常見問題排除

**小工具一直顯示「載入中」或空白**
- 確認手機有網路
- iOS：點一下小工具強制重新執行
- Android：移除小工具後重新加入

**iOS 找不到 Scriptable 小工具**
- 確認 Scriptable App 已安裝，且**至少打開過一次**

**Android 裝不起來**
- 確認 Android 版本 7.0 以上
- 確認已允許「安裝未知來源應用程式」
- 若顯示「無法剖析套件」，代表下載不完整，請重新下載

---

## 📖 關於素材

卡片內容出自**福智文化**《希望·新生》系列（心之勇士、四季法語等），版權屬原出版社所有。

本專案僅供**個人使用與親友分享**，請勿用於商業用途或公開營利推廣。
若您喜歡這些內容，歡迎支持出版社的正式出版品。

> 出版社網站：[bwpublish.com](https://www.bwpublish.com/)

---

## 🔧 給技術使用者

圖片與索引以靜態檔案形式託管於 GitHub Pages，無伺服器依賴：

- 索引：`https://wyattsheu.github.io/wisdom-assets/manifest.json`
- 圖片：`https://wyattsheu.github.io/wisdom-assets/images/<id>.webp`

`manifest.json` 格式：

```json
{
  "version": 1,
  "base": "https://wyattsheu.github.io/wisdom-assets/images/",
  "count": 729,
  "items": [
    { "id": "<md5>", "title": "warrior (68)", "w": 1320, "h": 1840 }
  ]
}
```

用戶端邏輯：manifest 每週更新一次（有快取），每日依日期挑一張圖下載並快取，離線時回退到最後一張成功的圖。

- Android 原始碼：[wyattsheu/wisdom-android](https://github.com/wyattsheu/wisdom-android)
- iOS 腳本：[widget.js](widget.js)（Scriptable）
