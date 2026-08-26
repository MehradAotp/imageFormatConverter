const MENU_ID = 'image-converter-root';
const QUICK_FORMATS = [
  ['png', 'PNG'],
  ['jpg', 'JPG'],
  ['webp', 'WebP'],
  ['avif', 'AVIF'],
  ['bmp', 'BMP'],
  ['tiff', 'TIFF']
];

chrome.runtime.onInstalled.addListener(async () => {
  await createMenus();
  await chrome.storage.local.set(await chrome.storage.local.get({
    webpQuality: 0.92,
    jpgQuality: 0.9,
    avifQuality: 0.8,
    filenameMode: 'original',
    maxWidth: 0,
    maxHeight: 0,
    jpegBackground: '#ffffff'
  }));
});
chrome.runtime.onStartup.addListener(createMenus);

async function createMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: MENU_ID, title: 'مبدل تصویر پرو · MrAOTP', contexts: ['image'] });
  for (const [id, title] of QUICK_FORMATS) {
    chrome.contextMenus.create({ id: `convert-${id}`, parentId: MENU_ID, title: `تبدیل به ${title}`, contexts: ['image'] });
  }
  chrome.contextMenus.create({ id: 'open-dashboard', parentId: MENU_ID, title: 'باز کردن داشبورد تصاویر صفحه', contexts: ['image', 'page'] });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  if (info.menuItemId === 'open-dashboard') {
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_DASHBOARD' });
    return;
  }
  const format = String(info.menuItemId).replace('convert-', '');
  if (!info.srcUrl || !QUICK_FORMATS.some(([id]) => id === format)) return;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'CONVERT_IMAGE', srcUrl: info.srcUrl, format });
    if (!response?.dataUrl) throw new Error(response?.error || 'Conversion failed.');
    await chrome.downloads.download({ url: response.dataUrl, filename: `${sanitize(response.filename || 'image')}.${format === 'jpg' ? 'jpg' : format}`, saveAs: true });
  } catch (error) {
    await notify(error instanceof Error ? error.message : 'The image could not be converted.');
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'DOWNLOAD_BATCH') return;
  Promise.all(message.files.map(async (file) => chrome.downloads.download({ url: file.dataUrl, filename: file.filename, saveAs: false })))
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

function sanitize(value) { return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'image'; }
async function notify(message) { await chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title: 'مبدل تصویر پرو · MrAOTP', message }); }
