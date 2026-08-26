document.querySelector('#scan').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) { await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_DASHBOARD' }); window.close(); }
});
document.querySelector('#options').addEventListener('click', () => chrome.runtime.openOptionsPage());
