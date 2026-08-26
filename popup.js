document.querySelector('#scan').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) { try { await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_DASHBOARD' }); window.close(); } catch { document.querySelector('#scan').textContent = 'این صفحه قابل دسترسی نیست'; } }
});
document.querySelector('#options').addEventListener('click', () => chrome.runtime.openOptionsPage());
