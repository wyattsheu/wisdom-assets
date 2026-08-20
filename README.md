# 每日智慧小語 · 手機桌面小工具 

每天在手機桌面自動顯示一張佛法小語卡片，**每天換一張**，不用手動操作。

- 支援 **iPhone / iPad** 與 **Android**
- 共 **729 張**卡片，隨機挑選，同一天固定同一張
- 圖片存在雲端，手機只在換日時抓一次，**平常不耗網路、不耗電**
- 完全免費，沒有廣告、不需註冊、不收集任何個人資料
<img src="https://wyattsheu.github.io/wisdom-assets/screenshots/merge.png" width="100%">

## 實際效果

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

## iPhone / iPad 安裝

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

## Android 安裝

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

## 使用說明

| 問題 | 說明 |
|---|---|
| 多久換一張？ | **每天換一張**。同一天內不管看幾次都是同一張。 |
| 幾點換？ | iOS 約每天凌晨 **00:05** 更新；Android 每 6 小時檢查一次，跨日就換。 |
| 可以手動換嗎？ | iOS：點一下小工具會重新執行。Android：移除小工具再重新加入。 |
| 沒網路會怎樣？ | 會**繼續顯示上一張**，不會變空白。有網路時自動恢復。 |
| 很耗網路嗎？ | 不會。每天只下載一張約 **120 KB** 的圖，一個月約 3.6 MB。 |
| 很耗電嗎？ | 不會。平常完全不執行，只在換日時抓一次圖。 |
| 圖片會模糊嗎？ | 素材已預先放大到 1320×1840，手機是在**縮小**顯示。若覺得文字偏小，見下方調整方式。 |

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

**覺得文字太小、想放大**

iOS：打開 Scriptable 編輯「智慧小語」腳本，找到這一行把數字調大（建議 `1.4`），存檔後把桌面小工具移除再重新加入：

```js
const ZOOM = 1.15;   // 調大 → 裁掉更多留白，文字變大
```

Android：長按小工具拖拉調整大小即可，畫面會即時重新裁切。

---

## 關於素材版權

卡片內容出自**福智文化**《希望・新生》系列，為<u>真如</u>老師所著，版權屬原出版社所有。這個小工具只是我自己做來用、順便分享給親友的，請不要拿去做商業用途。

為了讓大家能安心使用，特此說明：依據 [福智文化官方著作權聲明](https://www.bwpublish.com/aboutBWP/aboutCopyright)，本工具的分享符合其「合理使用情形」之規範：

> 「本公司網站上之資訊，可為個人或團體之非營利目的而重製。」
> 「本公司網站上所刊載以本公司名義公開發表之著作……在合理範圍內，得重製、公開播送或公開傳輸，利用時請註明出處。」

請大家在享受這些美好文字的同時，共同遵守官方規範，**切勿將本工具或內容用於任何商業用途、故意增刪修改或斷章取義**。

---

喜歡這些內容的話，歡迎支持出版社的正式出版品 👉 [bwpublish.com](https://www.bwpublish.com/)

---

## 給技術使用者

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

### 素材處理管線

`660×920` 原圖 → Real-ESRGAN (`realesrgan-x4plus-anime`) 原生 4 倍放大 → Lanczos 降到 `1320×1840` → WebP q90。

放大的目的不是追求細節，而是讓**手機端變成「縮小」而非「放大」**——原圖只有 660×920，widget 需要約 1000×1100，直接使用會被 iOS 放大而糊掉。

### ios小工具的畫質天花板

小工具上的文字**不可能達到原圖的銳利度**，這是平台限制，不是設定問題。兩個限制：

**1. `Request.loadImage()` 在小工具環境被限制在 500×500px**
Scriptable 在 widget 環境（非 App 內）會把 `loadImage()` 載入的圖降到最大 500px，這是「App 內清楚、桌面模糊」最常見的原因。
本腳本的解法：全程改用 `Request.load()` 取得原始位元組，再以 `Image.fromData()` 還原，並用 `fm.write()` 存原始 bytes、`Data.fromFile()` 讀回，**完全不碰 `loadImage()` / `readImage()`**。

**2. 點陣圖 vs 向量文字（無法解決）**
系統內建小工具（如「設定」）的文字是 **SwiftUI 向量渲染**——字型引擎在顯示當下繪製，具備 hinting 與次像素抗鋸齒，永遠是螢幕原生解析度。
本專案的文字是**烘進圖片裡的像素**，必然經過縮放與 WidgetKit 快照壓縮。同樣 338pt 尺寸下，點陣圖就是追不上向量文字。

> 要根治只能取得純文字內容並改用 `addText()` 渲染，但來源 API 僅提供圖片、無文字欄位。

**實務建議**：畫質已達上限，若覺得文字不易閱讀，調高腳本中的 `ZOOM`（例如 `1.15` → `1.4`）讓文字物理變大，這是目前唯一還能改善可讀性的參數。

### 其他ios實作陷阱（踩過的坑）

- **Large widget 不是正方形**：寬度與 Medium 相同、只有高度較高（390pt 螢幕為 `338×354`）。若當成正方形計算，iOS 會再縮放一次而糊掉。
- **`addImage()` 會受 iOS 17+ 內容邊界限制**，四周露出底色（深色模式下為黑邊）；改用 `backgroundImage` 才能真正滿版。
- **只裁切、不縮放**：`DrawContext` 僅負責裁切（1:1 取出區域），縮放交給 iOS，讓整條路徑只經過一次重採樣。
- **`Image.size` 單位不一致**：檔案載入的圖回報「像素」，`DrawContext` 產生的回報「點數」，不可混用推論。
