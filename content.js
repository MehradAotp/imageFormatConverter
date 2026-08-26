const DEFAULTS = { webpQuality: 0.92, jpgQuality: 0.9, avifQuality: 0.8, filenameMode: 'original', maxWidth: 0, maxHeight: 0, jpegBackground: '#ffffff' };

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CONVERT_IMAGE') {
    convertImage(message.srcUrl, message.format).then(sendResponse).catch((error) => sendResponse({ error: error.message }));
    return true;
  }
  if (message?.type === 'OPEN_DASHBOARD') openDashboard();
  return undefined;
});

async function convertImage(srcUrl, format) {
  const settings = await chrome.storage.local.get(DEFAULTS);
  const source = await loadImage(srcUrl);
  const size = fitSize(source.width, source.height, settings.maxWidth, settings.maxHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size.width; canvas.height = size.height;
  const ctx = canvas.getContext('2d', { alpha: format !== 'jpg' });
  if (!ctx) throw new Error('Canvas is unavailable.');
  if (format === 'jpg') { ctx.fillStyle = settings.jpegBackground; ctx.fillRect(0, 0, size.width, size.height); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, size.width, size.height);
  const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  const quality = format === 'jpg' ? settings.jpgQuality : format === 'webp' ? settings.webpQuality : format === 'avif' ? settings.avifQuality : undefined;
  const dataUrl = await canvasToDataUrl(canvas, mime, quality);
  return { dataUrl, filename: getFilename(srcUrl, settings.filenameMode), width: size.width, height: size.height };
}

async function loadImage(srcUrl) {
  const response = await fetch(srcUrl, { credentials: 'include' });
  if (!response.ok) throw new Error(`Image request failed (${response.status}).`);
  const bitmap = await createImageBitmap(await response.blob());
  return bitmap;
}
function canvasToDataUrl(canvas, mime, quality) {
  return new Promise((resolve, reject) => { try { resolve(canvas.toDataURL(mime, quality)); } catch (error) { reject(error); } });
}
function fitSize(width, height, maxWidth, maxHeight) {
  const w = Number(maxWidth) || width, h = Number(maxHeight) || height;
  const ratio = Math.min(1, w / width, h / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}
function getFilename(srcUrl, mode) {
  if (mode === 'timestamp') return `converted-${new Date().toISOString().replace(/[.:]/g, '-')}`;
  try { return decodeURIComponent(new URL(srcUrl).pathname.split('/').pop() || 'image').replace(/\.[^.]+$/, '') || 'image'; } catch { return 'image'; }
}

function getPageImages() {
  const seen = new Set();
  return [...document.images].map((image, index) => {
    const src = image.currentSrc || image.src;
    if (!src || seen.has(src)) return null;
    seen.add(src);
    return { id: index, src, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height, alt: image.alt || '' };
  }).filter(Boolean);
}

function openDashboard() {
  if (document.querySelector('#image-converter-pro-dashboard')) return;
  const root = document.createElement('div'); root.id = 'image-converter-pro-dashboard';
  root.innerHTML = `<div class="icp-backdrop"></div><section class="icp-panel" role="dialog" aria-label="Image Converter Pro"><header><div><strong>Image Converter Pro</strong><small id="icp-count"></small></div><button id="icp-close" aria-label="Close">×</button></header><div class="icp-toolbar"><select id="icp-format"><option value="webp">WebP</option><option value="png">PNG</option><option value="jpg">JPG</option><option value="avif">AVIF</option><option value="bmp">BMP</option><option value="tiff">TIFF</option></select><button id="icp-select-all">Select all</button><button id="icp-export">Export selected</button></div><div id="icp-grid"></div><p id="icp-status"></p></section>`;
  const style = document.createElement('style'); style.textContent = dashboardCSS; root.append(style); document.documentElement.append(root);
  const images = getPageImages(), selected = new Set(images.map((image) => image.id));
  const grid = root.querySelector('#icp-grid'); root.querySelector('#icp-count').textContent = `${images.length} images found`;
  images.forEach((image) => { const card = document.createElement('label'); card.className = 'icp-card'; card.innerHTML = `<input type="checkbox" checked data-id="${image.id}"><img loading="lazy" src="${escapeAttr(image.src)}"><span>${image.width}×${image.height}</span>`; card.querySelector('input').addEventListener('change', (event) => event.target.checked ? selected.add(image.id) : selected.delete(image.id)); grid.append(card); });
  root.querySelector('#icp-close').onclick = () => root.remove(); root.querySelector('.icp-backdrop').onclick = () => root.remove();
  root.querySelector('#icp-select-all').onclick = () => { images.forEach((image) => selected.add(image.id)); grid.querySelectorAll('input').forEach((input) => { input.checked = true; }); };
  root.querySelector('#icp-export').onclick = async () => { const button = root.querySelector('#icp-export'); button.disabled = true; root.querySelector('#icp-status').textContent = 'Converting…'; const files = []; for (const image of images.filter((item) => selected.has(item.id))) { try { const result = await convertImage(image.src, root.querySelector('#icp-format').value); files.push({ dataUrl: result.dataUrl, filename: `${result.filename}.${root.querySelector('#icp-format').value}` }); } catch {} } const response = await chrome.runtime.sendMessage({ type: 'DOWNLOAD_BATCH', files }); root.querySelector('#icp-status').textContent = response?.ok ? `${files.length} files exported.` : (response?.error || 'Export failed.'); button.disabled = false; };
}
function escapeAttr(value) { return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
const dashboardCSS = `#image-converter-pro-dashboard{all:initial;font-family:system-ui,sans-serif;color:#f8fafc}#image-converter-pro-dashboard .icp-backdrop{position:fixed;inset:0;background:#020617aa;z-index:2147483646}#image-converter-pro-dashboard .icp-panel{position:fixed;z-index:2147483647;inset:5vh 5vw;background:#111827;border:1px solid #475569;border-radius:20px;box-shadow:0 24px 80px #000b;overflow:hidden;display:flex;flex-direction:column}#image-converter-pro-dashboard header{padding:18px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155}#image-converter-pro-dashboard strong{font-size:20px}#image-converter-pro-dashboard small{display:block;color:#94a3b8;margin-top:3px}#image-converter-pro-dashboard button,#image-converter-pro-dashboard select{background:#2563eb;color:white;border:0;border-radius:8px;padding:9px 13px;font-weight:650;cursor:pointer}#image-converter-pro-dashboard select{background:#1e293b;border:1px solid #475569}.icp-toolbar{display:flex;gap:8px;padding:14px 24px;border-bottom:1px solid #334155}.icp-toolbar button:first-of-type{background:#334155}.icp-toolbar button:disabled{opacity:.6}.icp-toolbar button:last-child{margin-left:auto}.icp-toolbar+div{padding:20px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.icp-card{position:relative;background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden;cursor:pointer}.icp-card img{width:100%;height:125px;display:block;object-fit:cover;background:#0f172a}.icp-card input{position:absolute;z-index:1;top:8px;left:8px;width:18px;height:18px}.icp-card span{display:block;padding:8px;font-size:12px;color:#cbd5e1}.icp-panel>p{padding:0 24px;color:#86efac;min-height:20px}#icp-close{background:transparent!important;font-size:25px;padding:0 8px}`;
