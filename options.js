const defaults = { webpQuality: 0.92, jpgQuality: 0.9, filenameMode: 'original' };
const webpQuality = document.querySelector('#webpQuality');
const jpgQuality = document.querySelector('#jpgQuality');
const filenameMode = document.querySelector('#filenameMode');
const status = document.querySelector('#status');

function updateLabels() {
  document.querySelector('#webpQualityValue').textContent = `${Math.round(Number(webpQuality.value) * 100)}%`;
  document.querySelector('#jpgQualityValue').textContent = `${Math.round(Number(jpgQuality.value) * 100)}%`;
}

async function load() {
  const settings = await chrome.storage.local.get(defaults);
  webpQuality.value = settings.webpQuality;
  jpgQuality.value = settings.jpgQuality;
  filenameMode.value = settings.filenameMode;
  updateLabels();
}

webpQuality.addEventListener('input', updateLabels);
jpgQuality.addEventListener('input', updateLabels);
document.querySelector('#save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    webpQuality: Number(webpQuality.value),
    jpgQuality: Number(jpgQuality.value),
    filenameMode: filenameMode.value
  });
  status.textContent = 'Settings saved.';
  setTimeout(() => { status.textContent = ''; }, 2200);
});

load();
