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
const CACHE_VERSION = 8;          // 改這個數字會強制清快取
const DEBUG = true;               // 在 Scriptable 內執行時印出診斷資訊
const FILL_MODE = "fill";         // "fill" = 填滿並裁掉上下（預設，畫面飽滿）
                                  // "fit"  = 完整顯示整張卡片，四周留底色

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

// ── 以裝置實際像素渲染，讓 WidgetKit 完全不必再縮放 ──────
function renderExact(src, box) {
  const ctx = new DrawContext();
  ctx.size = box;
  ctx.respectScreenScale = true;   // 關鍵：實際輸出 = 點數 x 螢幕倍率
  ctx.opaque = true;
  ctx.setFillColor(new Color("#f7f4ef"));          // 卡片底色，fit 模式的留白
  ctx.fillRect(new Rect(0, 0, box.width, box.height));

  const sw = src.size.width, sh = src.size.height;
  const scale = FILL_MODE === "fit"
    ? Math.min(box.width / sw, box.height / sh)     // 完整顯示
    : Math.max(box.width / sw, box.height / sh);    // 填滿裁切
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImageInRect(src, new Rect((box.width - dw) / 2, (box.height - dh) / 2, dw, dh));
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

  const rendered = renderExact(image, box);
  log(`🖼  實際輸出 ${rendered.size.width}x${rendered.size.height} px（應等於上面的 px 值）`);
  widget.backgroundImage = rendered;
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
