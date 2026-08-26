const MENU_ID = 'image-converter-root';
const FORMAT_IDS = ['png', 'webp', 'jpg'];

chrome.runtime.onInstalled.addListener(async () => {
  await createMenus();
  const settings = await chrome.storage.local.get({ webpQuality: 0.92, jpgQuality: 0.9, filenameMode: 'original' });
  await chrome.storage.local.set(settings);
});

chrome.runtime.onStartup.addListener(createMenus);

async function createMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Convert image to…',
    contexts: ['image']
  });

  for (const format of FORMAT_IDS) {
    chrome.contextMenus.create({
      id: format,
      parentId: MENU_ID,
      title: format.toUpperCase(),
      contexts: ['image']
    });
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!FORMAT_IDS.includes(info.menuItemId) || !tab?.id || !info.srcUrl) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'CONVERT_IMAGE',
      srcUrl: info.srcUrl,
      format: info.menuItemId
    });

    if (!response?.dataUrl) throw new Error(response?.error || 'Conversion failed');

    const filename = sanitizeFilename(response.filename || 'image', info.menuItemId);
    await chrome.downloads.download({
      url: response.dataUrl,
      filename,
      saveAs: true
    });
  } catch (error) {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Image conversion failed',
      message: error instanceof Error ? error.message : 'The image could not be converted.'
    });
  }
});

function sanitizeFilename(value, format) {
  const cleaned = value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || 'image';
  const withoutExtension = cleaned.replace(/\.(png|jpe?g|webp)$/i, '');
  return `${withoutExtension}.${format === 'jpg' ? 'jpg' : format}`;
}
