// ─────────────────────────────────────────────
// 每日智慧小語 Widget v6（自架 CDN 版）
// 素材已離線放大 → iOS 是在「縮小」而非放大 → 清晰
// 渲染路徑維持原版：原圖直接給 backgroundImage
// ─────────────────────────────────────────────

const MANIFEST = "https://wyattsheu.github.io/wisdom-assets/manifest.json";

const fm = FileManager.local();
const dir = fm.joinPath(fm.documentsDirectory(), "wisdom");
if (!fm.fileExists(dir)) fm.createDirectory(dir);
const manPath  = fm.joinPath(dir, "manifest.json");
const metaPath = fm.joinPath(dir, "meta.json");
const imgPath  = fm.joinPath(dir, "today.webp");
const lastPath = fm.joinPath(dir, "last.webp");

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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

const widget = new ListWidget();
let image = null, offline = false;

try {
  let meta = {};
  if (fm.fileExists(metaPath)) { try { meta = JSON.parse(fm.readString(metaPath)); } catch (e) {} }

  if (meta.date === today && fm.fileExists(imgPath)) {
    image = fm.readImage(imgPath);                       // 今天抽過了，零連線
  } else {
    // manifest 一週抓一次就好
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
    fm.writeString(metaPath, JSON.stringify({ date: today, id: pick.id, title: pick.title }));
    console.log(`📐 ${image.size.width}x${image.size.height}｜${pick.title}`);
  }
} catch (err) {
  console.error(err);
  if (fm.fileExists(lastPath)) { image = fm.readImage(lastPath); offline = true; }
}

if (image) {
  widget.backgroundImage = image;      // 不做任何處理，交給 iOS 縮放
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
