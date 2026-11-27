// ═══════════════════════════════════════════════════════════
//  每日智慧小語 · Scriptable Widget  v1.2
//  v1.2：垂直取景調整（FOCUS_Y 0.5 → 0.4），卡片文字位置較舒服
//  v1.1：修正桌面小工具顯示全黑（圖片超過 WidgetKit 像素上限）
//  https://github.com/wyattsheu/wisdom-assets
//
//  用法：整段複製 → Scriptable 新增腳本 → 貼上 → 命名為「智慧小語」
//        桌面長按 → ➕ → Scriptable → Large → 編輯小工具 → 選此腳本
// ═══════════════════════════════════════════════════════════

const MANIFEST = "https://wyattsheu.github.io/wisdom-assets/manifest.json";

// ── 可調整的設定 ────────────────────────────────────────────

// 取景倍率：1.0 = 完整填滿；調大會裁掉更多卡片留白、讓文字變大
// 覺得文字太小不好讀就往上調（建議 1.15 ~ 1.5）
const ZOOM = 1.15;

// 垂直對焦位置：0 = 對齊頂部，0.5 = 置中，1 = 對齊底部
const FOCUS_Y = 0.4;

// 改這個數字會強制清除本機快取（換版本或想重抓時用）
const CACHE_VERSION = 15;

// 在 Scriptable App 內執行時印出診斷資訊（不影響桌面小工具）
const DEBUG = false;

// ── 以下不需要修改 ──────────────────────────────────────────

const CARD_BG = "#f7f4ef";        // 卡片底色，用於填補任何縫隙

const fm = FileManager.local();
const dir = fm.joinPath(fm.documentsDirectory(), "wisdom");
if (!fm.fileExists(dir)) fm.createDirectory(dir);
const manPath  = fm.joinPath(dir, "manifest.json");
const metaPath = fm.joinPath(dir, "meta.json");
const imgPath  = fm.joinPath(dir, "today.webp");
const lastPath = fm.joinPath(dir, "last.webp");

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const log = (...a) => { if (DEBUG) console.log(...a); };

// 版本升級時清掉舊快取，避免沿用到舊格式或舊畫質的圖
let meta = {};
if (fm.fileExists(metaPath)) {
  try { meta = JSON.parse(fm.readString(metaPath)); } catch (e) {}
}
if (meta.v !== CACHE_VERSION) {
  log(`清除舊快取（v${meta.v || "?"} → v${CACHE_VERSION}）`);
  for (const f of ["manifest.json", "meta.json", "today.webp", "last.webp",
                   "today.png", "last.png"]) {
    const p = fm.joinPath(dir, f);
    if (fm.fileExists(p)) fm.remove(p);
  }
  meta = {};
}

/**
 * ⚠️ 重要：Request.loadImage() 在「小工具環境」會被 Scriptable 限制在
 *    最大 500x500px，但在 App 內執行卻是完整解析度。這正是許多人遇到
 *    「App 內清楚、桌面模糊」的原因。
 *    解法：全程以原始位元組 (Data) 下載與讀檔，再用 Image.fromData()
 *    還原，完全不碰 loadImage() / readImage()。
 */
async function loadData(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = new Request(url);
      r.timeoutInterval = 12;
      return await r.load();
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(res => Timer.schedule(900, false, res));
    }
  }
}

async function loadJSON(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = new Request(url);
      r.timeoutInterval = 12;
      return await r.loadJSON();
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(res => Timer.schedule(900, false, res));
    }
  }
}

const readImageRaw = (path) => Image.fromData(Data.fromFile(path));

/**
 * 小工具的實際點數尺寸。
 * 注意：Large 不是正方形！它的寬度與 Medium 相同，只有高度較高。
 * 例：390pt 螢幕 → small 158x158 / medium 338x158 / large 338x354
 * 這裡若算錯，iOS 會為了塞進實際尺寸再縮放一次，畫面就會糊掉。
 */
function widgetPointSize() {
  const family = config.widgetFamily || "large";
  const scr = Device.screenSize();
  const w = Math.min(scr.width, scr.height);
  let sq, wide, tall;
  if (w >= 428)      { sq = 170; wide = 364; tall = 382; }
  else if (w >= 414) { sq = 169; wide = 360; tall = 379; }
  else if (w >= 390) { sq = 158; wide = 338; tall = 354; }
  else if (w >= 375) { sq = 155; wide = 329; tall = 345; }
  else               { sq = 141; wide = 292; tall = 311; }
  if (family === "small")  return new Size(sq,   sq);
  if (family === "medium") return new Size(wide, sq);
  return new Size(wide, tall);
}

/**
 * 裁切並縮放到「小工具的實際像素」。
 *
 * ⚠️ WidgetKit 對小工具圖片有像素面積上限（約等於小工具本身的像素數），
 *    超過就整塊變黑（App 內預覽卻正常）。v1.0 只裁切不縮放，輸出約
 *    1148x1202，比 Large 的 1014x1062 大 → 桌面黑屏。
 *    所以這裡一定要自己縮到 widget 像素，並夾在上限以內。
 */
function renderToWidget(src, box) {
  const scale = Device.screenScale();
  let pw = Math.round(box.width * scale);
  let ph = Math.round(box.height * scale);

  // 保險：輸出面積不超過 widget 像素面積的 98%
  const limit = box.width * scale * box.height * scale * 0.98;
  if (pw * ph > limit) {
    const k = Math.sqrt(limit / (pw * ph));
    pw = Math.floor(pw * k);
    ph = Math.floor(ph * k);
  }

  const ctx = new DrawContext();
  ctx.size = new Size(pw, ph);
  ctx.respectScreenScale = false;
  ctx.opaque = true;
  ctx.setFillColor(new Color(CARD_BG));
  ctx.fillRect(new Rect(0, 0, pw, ph));

  // 等比填滿 × ZOOM；水平置中，垂直依 FOCUS_Y 對焦
  const sw = src.size.width, sh = src.size.height;
  const k = Math.max(pw / sw, ph / sh) * ZOOM;
  const dw = sw * k, dh = sh * k;
  ctx.drawImageInRect(src, new Rect(
    (pw - dw) / 2,
    -(dh - ph) * FOCUS_Y,
    dw, dh
  ));
  log(`輸出 ${pw}x${ph} px`);
  return ctx.getImage();
}

// ── 主流程 ──────────────────────────────────────────────────

const widget = new ListWidget();
widget.setPadding(0, 0, 0, 0);
widget.backgroundColor = new Color(CARD_BG);

let image = null, offline = false;

try {
  if (meta.date === today && fm.fileExists(imgPath)) {
    image = readImageRaw(imgPath);              // 今天抽過了，零連線
    log(`使用今日快取：${meta.title || ""}`);
  } else {
    // manifest 一週抓一次即可
    let man = null;
    const age = fm.fileExists(manPath)
      ? (Date.now() - fm.modificationDate(manPath).getTime())
      : Infinity;
    if (age < 7 * 86400000) {
      man = JSON.parse(fm.readString(manPath));
    } else {
      try {
        man = await loadJSON(MANIFEST);
        fm.writeString(manPath, JSON.stringify(man));
      } catch (e) {
        if (fm.fileExists(manPath)) man = JSON.parse(fm.readString(manPath));
        else throw e;
      }
    }

    const items = man.items || [];
    if (!items.length) throw new Error("manifest 是空的");
    const pick = items[Math.floor(Math.random() * items.length)];

    // 存原始 webp 位元組，不用 writeImage()（那會重新編碼一次）
    const raw = await loadData(man.base + pick.id + ".webp");
    fm.write(imgPath, raw);
    fm.write(lastPath, raw);
    image = Image.fromData(raw);
    fm.writeString(metaPath, JSON.stringify({
      v: CACHE_VERSION, date: today, id: pick.id, title: pick.title
    }));
    log(`下載：${pick.title}`);
  }
} catch (err) {
  console.error(err);
  if (fm.fileExists(lastPath)) {                // 離線就沿用上一張
    image = readImageRaw(lastPath);
    offline = true;
  }
}

if (image) {
  const box = widgetPointSize();
  log(`原圖 ${image.size.width}x${image.size.height}`);
  log(`widget ${box.width}x${box.height} pt @${Device.screenScale()}x`);
  widget.backgroundImage = renderToWidget(image, box);
} else {
  widget.backgroundColor = new Color("#1c1c1e");
  const t = widget.addText("暫時連不上網路 🌙");
  t.textColor = Color.white();
  t.centerAlignText();
}

// 正常情況每天凌晨換一張；離線或失敗則 30 分鐘後再試
const next = new Date();
if (offline || !image) next.setMinutes(next.getMinutes() + 30);
else { next.setDate(next.getDate() + 1); next.setHours(0, 5, 0, 0); }
widget.refreshAfterDate = next;

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentLarge();
Script.complete();
