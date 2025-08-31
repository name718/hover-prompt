async function toggleInTab(tab) {
  if (!tab || !tab.id) {
    console.log('HoverPrompt: 无效的标签页');
    return false;
  }
  
  const url = tab.url || '';
  const isHttp = url.startsWith('http://') || url.startsWith('https://');
  
  if (!isHttp) {
    console.log('HoverPrompt: 非HTTP页面，不支持');
    try {
      await chrome.action.setBadgeText({ tabId: tab.id, text: 'NA' });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#ef4444' });
      setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1600);
    } catch (e) {
      console.log('HoverPrompt: 设置徽章失败', e);
    }
    return false;
  }

  try {
    // 首先尝试发送消息
    await chrome.tabs.sendMessage(tab.id, { type: 'HOVER_PROMPT_TOGGLE' });
    console.log('HoverPrompt: 消息发送成功');
  } catch (err) {
    console.log('HoverPrompt: 首次发送消息失败，尝试注入脚本', err);
    
    try {
      // 如果失败，尝试注入content script
      await chrome.scripting.executeScript({ 
        target: { tabId: tab.id }, 
        files: ['content.js'] 
      });
      console.log('HoverPrompt: 脚本注入成功');
      
      // 等待一小段时间让脚本加载
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 再次尝试发送消息
      await chrome.tabs.sendMessage(tab.id, { type: 'HOVER_PROMPT_TOGGLE' });
      console.log('HoverPrompt: 重新发送消息成功');
    } catch (e) {
      console.log('HoverPrompt: 脚本注入或消息发送失败', e);
      try {
        await chrome.action.setBadgeText({ tabId: tab.id, text: 'ERR' });
        await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#ef4444' });
        setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1600);
      } catch (badgeErr) {
        console.log('HoverPrompt: 设置错误徽章失败', badgeErr);
      }
      return false;
    }
  }

  try {
    await chrome.action.setBadgeText({ tabId: tab.id, text: 'ON' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#10b981' });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 1200);
  } catch (e) {
    console.log('HoverPrompt: 设置成功徽章失败', e);
  }
  
  return true;
}

chrome.action.onClicked.addListener(async (tab) => {
  console.log('HoverPrompt: 扩展图标被点击', tab);
  await toggleInTab(tab);
});

// 添加安装时的处理
chrome.runtime.onInstalled.addListener(() => {
  console.log('HoverPrompt: 扩展已安装');
});

