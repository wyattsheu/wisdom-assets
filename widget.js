// ─────────────────────────────────────────────
// 每日智慧小語 Widget v7
//
// v7 相對 v6 的兩個關鍵修正：
//  1. 用 DrawContext 以「裝置實際像素」渲染，讓 WidgetKit 不必再縮放
//     （v6 直接把原圖丟給 backgroundImage，iOS 會再縮一次 + 快照壓縮 → 糊）
//  2. 加入 CACHE_VERSION，改版時自動清掉舊快取
//     （v6 的今日快取會讓舊的模糊圖沿用一整天）
//
// 素材為 1320x1840，遠大於 widget 需求 → 全程是「縮小」，不會失真。
// ─────────────────────────────────────────────

const MANIFEST = "https://wyattsheu.github.io/wisdom-assets/manifest.json";
const CACHE_VERSION = 10;         // 改這個數字會強制清快取
const DEBUG = true;               // 在 Scriptable 內執行時印出診斷資訊
const FILL_MODE = "fill";         // "fill" = 填滿並裁掉上下（預設，畫面飽滿）
                                  // "fit"  = 完整顯示整張卡片，四周留底色

// 渲染路徑：兩條路在 WidgetKit 裡的壓縮行為不同，糊的話就換另一個試
//   "image"      = widget.addImage()（預設，繞過背景圖壓縮）
//   "background" = widget.backgroundImage（舊路徑）
const RENDER_MODE = "image";

// 過取樣倍率。1 = 剛好等於螢幕像素。若仍糊可試 1.5 或 2，
// 讓 WidgetKit 壓縮時有更多資料可用（代價是記憶體與檔案變大）。
const OVERSAMPLE = 1;

const fm = FileManager.local();
const dir = fm.joinPath(fm.documentsDirectory(), "wisdom");
if (!fm.fileExists(dir)) fm.createDirectory(dir);
const manPath  = fm.joinPath(dir, "manifest.json");
const metaPath = fm.joinPath(dir, "meta.json");
const imgPath  = fm.joinPath(dir, "today.png");
const lastPath = fm.joinPath(dir, "last.png");

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function log(...a) { if (DEBUG) console.log(...a); }

// ── 版本升級 → 清掉所有舊快取（含 v6 留下的 .webp）────────
let meta = {};
if (fm.fileExists(metaPath)) { try { meta = JSON.parse(fm.readString(metaPath)); } catch (e) {} }
if (meta.v !== CACHE_VERSION) {
  log(`🧹 快取版本 ${meta.v || "無"} → ${CACHE_VERSION}，清除舊快取`);
  for (const f of ["manifest.json", "meta.json", "today.png", "last.png", "today.webp", "last.webp"]) {
    const p = fm.joinPath(dir, f);
    if (fm.fileExists(p)) fm.remove(p);
  }
  meta = {};
}

async function get(url, kind) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = new Request(url);
      r.timeoutInterval = 12;
      if (kind === "image") return await r.loadImage();
      if (kind === "json")  return await r.loadJSON();
      return await r.loadString();
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(res => Timer.schedule(900, false, res));
    }
  }
}

// ── widget 實際點數尺寸（依機型與家族）────────────────────
//  重要：Large widget 不是正方形！它的「寬度與 Medium 相同」，只有高度較高。
//  例：390pt 螢幕 → small 158x158 / medium 338x158 / large 338x354
//  若這裡算錯，iOS 會為了塞進實際尺寸再縮放一次 → 桌面上就糊掉。
function widgetPointSize() {
  const family = config.widgetFamily || "large";
  const scr = Device.screenSize();
  const w = Math.min(scr.width, scr.height);
  let sq, wide, tall;                       // sq=小方形邊長, wide=中/大寬度, tall=大高度
  if (w >= 428)      { sq = 170; wide = 364; tall = 382; }
  else if (w >= 414) { sq = 169; wide = 360; tall = 379; }
  else if (w >= 390) { sq = 158; wide = 338; tall = 354; }
  else if (w >= 375) { sq = 155; wide = 329; tall = 345; }
  else               { sq = 141; wide = 292; tall = 311; }
  if (family === "small")  return new Size(sq,   sq);
  if (family === "medium") return new Size(wide, sq);
  return new Size(wide, tall);              // large / extraLarge
}

// ── 直接以「像素」建立畫布，不依賴 respectScreenScale ──────
//  Scriptable 的 Image.size 單位不一致（載入的圖回報像素、DrawContext
//  產生的回報點數），所以不要靠它推論。這裡直接把畫布開成目標像素數，
//  產出的圖必然是 1014x1062 這種實際解析度，iOS 放進 338x354pt@3x 剛好 1:1。
function renderExact(src, box, scaleFactor) {
  const pw = Math.round(box.width * scaleFactor * OVERSAMPLE);
  const ph = Math.round(box.height * scaleFactor * OVERSAMPLE);

  const ctx = new DrawContext();
  ctx.size = new Size(pw, ph);
  ctx.respectScreenScale = false;   // 自己算像素，不讓它再乘一次
  ctx.opaque = true;
  ctx.setFillColor(new Color("#f7f4ef"));
  ctx.fillRect(new Rect(0, 0, pw, ph));

  const sw = src.size.width, sh = src.size.height;
  const scale = FILL_MODE === "fit"
    ? Math.min(pw / sw, ph / sh)      // 完整顯示
    : Math.max(pw / sw, ph / sh);     // 填滿裁切
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImageInRect(src, new Rect((pw - dw) / 2, (ph - dh) / 2, dw, dh));
  return ctx.getImage();
}

const widget = new ListWidget();
widget.setPadding(0, 0, 0, 0);
let image = null, offline = false;

try {
  if (meta.date === today && fm.fileExists(imgPath)) {
    image = fm.readImage(imgPath);
    log(`📦 使用今日快取：${meta.title || ""}`);
  } else {
    let man = null;
    const manAge = fm.fileExists(manPath)
      ? (Date.now() - fm.modificationDate(manPath).getTime()) : Infinity;
    if (manAge < 7 * 86400000) {
      man = JSON.parse(fm.readString(manPath));
    } else {
      try {
        man = await get(MANIFEST, "json");
        fm.writeString(manPath, JSON.stringify(man));
      } catch (e) {
        if (fm.fileExists(manPath)) man = JSON.parse(fm.readString(manPath));
        else throw e;
      }
    }

    const items = man.items || [];
    if (!items.length) throw new Error("manifest 是空的");
    const pick = items[Math.floor(Math.random() * items.length)];

    image = await get(man.base + pick.id + ".webp", "image");
    fm.writeImage(imgPath, image);
    fm.writeImage(lastPath, image);
    fm.writeString(metaPath, JSON.stringify({ v: CACHE_VERSION, date: today, id: pick.id, title: pick.title }));
    log(`⬇️  下載：${pick.title}`);
  }
} catch (err) {
  console.error(err);
  if (fm.fileExists(lastPath)) { image = fm.readImage(lastPath); offline = true; }
}

if (image) {
  const box = widgetPointSize();
  const scaleFactor = Device.screenScale();
  log(`📐 原圖 ${image.size.width}x${image.size.height}`);
  log(`📱 widget ${box.width}x${box.height} pt @${scaleFactor}x = ${box.width * scaleFactor}x${box.height * scaleFactor} px`);
  log(image.size.width >= box.width * scaleFactor
      ? "✅ 來源大於需求 → 縮小顯示（清晰）"
      : "⚠️ 來源小於需求 → 會被放大（模糊）");

  const rendered = renderExact(image, box, scaleFactor);
  // 可靠的驗證：寫入檔案再讀回來，讀回來的尺寸必定是「像素」
  if (DEBUG) {
    const probe = fm.joinPath(dir, "_probe.png");
    fm.writeImage(probe, rendered);
    const back = fm.readImage(probe);
    log(`🖼  實際輸出 ${back.size.width}x${back.size.height} px  ← 必須等於上一行的 px`);
    fm.remove(probe);
  }
  if (RENDER_MODE === "background") {
    widget.backgroundImage = rendered;
  } else {
    // addImage 路徑：imageSize 要用「點數」，圖本身是高解析度 → 顯示時 1:1
    const wi = widget.addImage(rendered);
    wi.imageSize = new Size(box.width, box.height);
    wi.applyFillingContentMode();
    wi.centerAlignImage();
  }
  log(`🎨 渲染路徑 = ${RENDER_MODE}，過取樣 = ${OVERSAMPLE}x`);
} else {
  widget.backgroundColor = new Color("#1c1c1e");
  const t = widget.addText("暫時連不上網路 🌙");
  t.textColor = Color.white();
  t.centerAlignText();
}

const next = new Date();
if (offline || !image) next.setMinutes(next.getMinutes() + 30);
else { next.setDate(next.getDate() + 1); next.setHours(0, 5, 0, 0); }
widget.refreshAfterDate = next;

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentLarge();
Script.complete();
