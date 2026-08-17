// ─────────────────────────────────────────────
// 每日智慧小語 Widget v11
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
const CACHE_VERSION = 14;         // 改這個數字會強制清快取
const DEBUG = true;               // 在 Scriptable 內執行時印出診斷資訊
const FILL_MODE = "fill";         // "fill" = 填滿並裁掉上下（預設，畫面飽滿）
                                  // "fit"  = 完整顯示整張卡片，四周留底色

// 渲染路徑：
//   "background" = 鋪滿整個 widget 外框（預設）
//   "image"      = widget.addImage()，會受 iOS 17+ 內容邊界限制 → 四周出現黑邊
const RENDER_MODE = "background";

// 過取樣倍率。1 = 剛好等於螢幕像素。widget 有記憶體上限，別調太高。
const OVERSAMPLE = 1;

// 取景（決定文字看起來多大，這是「桌面上清不清楚」的關鍵）
//   預設 1.0 / 0.5 = 等比填滿並置中（與 v10 相同，實測最耐看）
//   ZOOM    想讓文字更大可調 1.2~1.5，代價是裁掉更多卡片內容
//   FOCUS_Y 垂直對焦 0=最上 0.5=正中 1=最下
const ZOOM = 1.15;
const FOCUS_Y = 0.5;

// 在小工具上直接印出實際解析度（widget 執行時看不到 console，只能畫在圖上）
// 確認畫質正常後改成 false 即可移除。
const SHOW_OVERLAY = false;

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

// ⚠️ 關鍵：Request.loadImage() 在 widget 環境會被砍到最大 500x500px，
//    在 App 內卻是完整解析度 —— 這就是「App 內清晰、桌面糊」的真正原因。
//    繞法：一律以原始位元組 (Data) 下載／讀檔，再用 Image.fromData() 還原，
//    完全不碰 loadImage() / readImage()。
async function get(url, kind) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = new Request(url);
      r.timeoutInterval = 12;
      if (kind === "image") return Image.fromData(await r.load());   // 不用 loadImage
      if (kind === "json")  return await r.loadJSON();
      return await r.loadString();
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(res => Timer.schedule(900, false, res));
    }
  }
}

/** 以原始位元組讀檔還原圖片，避開 readImage() 可能的降階 */
function readImageRaw(path) {
  return Image.fromData(Data.fromFile(path));
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
  const base = FILL_MODE === "fit"
    ? Math.min(pw / sw, ph / sh)      // 完整顯示
    : Math.max(pw / sw, ph / sh);     // 填滿裁切
  const scale = base * (FILL_MODE === "fit" ? 1 : ZOOM);
  const dw = sw * scale, dh = sh * scale;

  // 水平置中；垂直依 FOCUS_Y 對焦，並夾住避免露出畫布外的底色
  const dx = (pw - dw) / 2;
  let dy = (ph / 2) - (dh * FOCUS_Y);
  if (dh >= ph) dy = Math.min(0, Math.max(ph - dh, dy));
  else dy = (ph - dh) / 2;

  ctx.drawImageInRect(src, new Rect(dx, dy, dw, dh));

  // widget 執行時看不到 console，把實際解析度直接畫在圖上
  if (SHOW_OVERLAY) {
    const label = `src ${sw}x${sh} → out ${pw}x${ph}`;
    ctx.setFillColor(new Color("#000000", 0.65));
    ctx.fillRect(new Rect(0, ph - 34, pw, 34));
    ctx.setTextColor(Color.white());
    ctx.setFont(Font.mediumSystemFont(20));
    ctx.drawText(label, new Point(10, ph - 29));
  }
  return ctx.getImage();
}

const widget = new ListWidget();
widget.setPadding(0, 0, 0, 0);
widget.backgroundColor = new Color("#f7f4ef");   // 縫隙用卡片底色，不要露出黑底
let image = null, offline = false;

try {
  if (meta.date === today && fm.fileExists(imgPath)) {
    image = readImageRaw(imgPath);
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

    // 存「原始 webp 位元組」而不是用 writeImage()（那會重新編碼，且可能已降階）
    const raw = await (async () => {
      for (let i = 0; i < 3; i++) {
        try {
          const r = new Request(man.base + pick.id + ".webp");
          r.timeoutInterval = 12;
          return await r.load();
        } catch (e) {
          if (i === 2) throw e;
          await new Promise(res => Timer.schedule(900, false, res));
        }
      }
    })();
    fm.write(imgPath, raw);
    fm.write(lastPath, raw);
    image = Image.fromData(raw);
    fm.writeString(metaPath, JSON.stringify({ v: CACHE_VERSION, date: today, id: pick.id, title: pick.title }));
    log(`⬇️  下載：${pick.title}`);
  }
} catch (err) {
  console.error(err);
  if (fm.fileExists(lastPath)) { image = readImageRaw(lastPath); offline = true; }
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
