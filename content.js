chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'CONVERT_IMAGE') return undefined;

  convertImage(message.srcUrl, message.format)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error instanceof Error ? error.message : 'Unable to convert image.' }));

  return true;
});

async function convertImage(srcUrl, format) {
  if (!['png', 'webp', 'jpg'].includes(format)) throw new Error('Unsupported output format.');

  const response = await fetch(srcUrl, { credentials: 'include' });
  if (!response.ok) throw new Error(`Image request failed (${response.status}).`);

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Canvas is not available in this page.');

  if (format === 'jpg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const settings = await chrome.storage.local.get({ webpQuality: 0.92, jpgQuality: 0.9, filenameMode: 'original' });
  const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  const quality = format === 'jpg' ? settings.jpgQuality : format === 'webp' ? settings.webpQuality : undefined;
  const dataUrl = canvas.toDataURL(mime, quality);

  return {
    dataUrl,
    filename: buildFilename(srcUrl, settings.filenameMode)
  };
}

function buildFilename(srcUrl, filenameMode) {
  if (filenameMode === 'timestamp') return `converted-${new Date().toISOString().replace(/[.:]/g, '-')}`;

  try {
    const url = new URL(srcUrl);
    const lastPart = decodeURIComponent(url.pathname.split('/').pop() || 'image');
    return lastPart.replace(/\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i, '') || 'image';
  } catch {
    return 'image';
  }
}
