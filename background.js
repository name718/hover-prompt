async function toggleInTab(tab) {
  if (!tab || !tab.id) return false;
  const url = tab.url || '';
  const isHttp = url.startsWith('http://') || url.startsWith('https://');
  if (!isHttp) {
    try {
      await chrome.action.setBadgeText({ tabId: tab.id, text: 'NA' });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#ef4444' });
      setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1600);
    } catch {}
    return false;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'HOVER_PROMPT_TOGGLE' });
  } catch (err) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await chrome.tabs.sendMessage(tab.id, { type: 'HOVER_PROMPT_TOGGLE' });
    } catch (e) {
      try {
        await chrome.action.setBadgeText({ tabId: tab.id, text: 'ERR' });
        await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#ef4444' });
        setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1600);
      } catch {}
      return false;
    }
  }
  try {
    await chrome.action.setBadgeText({ tabId: tab.id, text: 'ON' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#10b981' });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1200);
  } catch {}
  return true;
}

chrome.action.onClicked.addListener(async (tab) => {
  await toggleInTab(tab);
});

