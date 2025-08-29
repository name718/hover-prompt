(function () {
  const STATE = {
    inspectMode: false,
    hoveredEl: null,
    selectedEl: null
  };

  const COLORS = {
    border: '#3b82f6',
    mask: 'rgba(0,0,0,0.25)',
    toast: '#16a34a'
  };

  let overlayContainer = null;
  let highlightBox = null;
  let dimMask = null;
  let inputPopup = null;
  let toastEl = null;

  function ensureOverlay() {
    if (overlayContainer) return;
    overlayContainer = document.createElement('div');
    overlayContainer.style.position = 'fixed';
    overlayContainer.style.left = '0';
    overlayContainer.style.top = '0';
    overlayContainer.style.right = '0';
    overlayContainer.style.bottom = '0';
    overlayContainer.style.pointerEvents = 'none';
    overlayContainer.style.zIndex = '2147483646';

    dimMask = document.createElement('div');
    dimMask.style.position = 'absolute';
    dimMask.style.left = '0';
    dimMask.style.top = '0';
    dimMask.style.right = '0';
    dimMask.style.bottom = '0';
    dimMask.style.background = COLORS.mask;
    dimMask.style.pointerEvents = 'none';

    highlightBox = document.createElement('div');
    highlightBox.style.position = 'absolute';
    highlightBox.style.border = `2px dashed ${COLORS.border}`;
    highlightBox.style.background = 'transparent';
    highlightBox.style.boxSizing = 'border-box';
    highlightBox.style.pointerEvents = 'none';

    overlayContainer.appendChild(dimMask);
    overlayContainer.appendChild(highlightBox);
    document.documentElement.appendChild(overlayContainer);
  }

  function removeOverlay() {
    if (overlayContainer && overlayContainer.parentNode) {
      overlayContainer.parentNode.removeChild(overlayContainer);
    }
    overlayContainer = null;
    highlightBox = null;
    dimMask = null;
  }

  function ensurePopup() {
    if (inputPopup) return;
    inputPopup = document.createElement('div');
    inputPopup.style.position = 'fixed';
    inputPopup.style.maxWidth = '360px';
    inputPopup.style.width = '360px';
    inputPopup.style.background = 'white';
    inputPopup.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
    inputPopup.style.borderRadius = '12px';
    inputPopup.style.padding = '12px';
    inputPopup.style.zIndex = '2147483647';
    inputPopup.style.display = 'none';
    inputPopup.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji';

    const title = document.createElement('div');
    title.textContent = '🛠️ 你想如何修改这个元素？';
    title.style.fontWeight = '600';
    title.style.marginBottom = '8px';

    const currentStyle = document.createElement('div');
    currentStyle.style.fontSize = '12px';
    currentStyle.style.color = '#475569';
    currentStyle.style.marginBottom = '8px';

    const input = document.createElement('textarea');
    input.placeholder = '输入需求... 按 Enter 生成Prompt';
    input.style.width = '100%';
    input.style.height = '84px';
    input.style.border = '1px solid #cbd5e1';
    input.style.borderRadius = '8px';
    input.style.padding = '8px 10px';
    input.style.outline = 'none';
    input.style.resize = 'vertical';

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!STATE.selectedEl) return;
        const selector = buildStableSelector(STATE.selectedEl);
        const styleSummary = summarizeStyles(STATE.selectedEl);
        const userDemand = input.value.trim();
        const prompt = buildPrompt(selector, styleSummary, userDemand);
        try {
          await navigator.clipboard.writeText(prompt);
          showToast('✅ 已生成Prompt！直接粘贴到Cursor即可');
        } catch (err) {
          showToast('❌ 复制失败，请手动复制');
        }
        hidePopup();
        toggleInspectMode(false);
      }
    });

    inputPopup.appendChild(title);
    inputPopup.appendChild(currentStyle);
    inputPopup.appendChild(input);
    document.documentElement.appendChild(inputPopup);

    inputPopup.__updateStyle = (text) => {
      currentStyle.textContent = text ? `[当前: ${text}]` : '';
    };

    inputPopup.__focusInput = () => input.focus();
  }

  function positionPopupNearRect(rect) {
    if (!inputPopup) return;
    const margin = 8;
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + margin;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popupWidth = 360;
    const popupHeight = 160;

    if (left + popupWidth > window.scrollX + vw - margin) {
      left = rect.right + window.scrollX - popupWidth;
    }
    if (top + popupHeight > window.scrollY + vh - margin) {
      top = rect.top + window.scrollY - popupHeight - margin;
    }

    inputPopup.style.left = `${Math.max(margin, left)}px`;
    inputPopup.style.top = `${Math.max(margin, top)}px`;
  }

  function showPopup(rect, styleBrief) {
    ensurePopup();
    inputPopup.style.display = 'block';
    positionPopupNearRect(rect);
    inputPopup.__updateStyle(styleBrief);
    setTimeout(() => inputPopup.__focusInput(), 0);
  }

  function hidePopup() {
    if (!inputPopup) return;
    inputPopup.style.display = 'none';
  }

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.position = 'fixed';
      toastEl.style.left = '50%';
      toastEl.style.top = '24px';
      toastEl.style.transform = 'translateX(-50%)';
      toastEl.style.background = 'white';
      toastEl.style.border = `1px solid ${COLORS.toast}`;
      toastEl.style.color = '#065f46';
      toastEl.style.padding = '8px 12px';
      toastEl.style.borderRadius = '999px';
      toastEl.style.fontSize = '13px';
      toastEl.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
      toastEl.style.zIndex = '2147483647';
      document.documentElement.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.style.display = 'block';
    clearTimeout(toastEl.__t);
    toastEl.__t = setTimeout(() => {
      if (toastEl) toastEl.style.display = 'none';
    }, 2200);
  }

  function setHighlightForElement(el) {
    if (!el || !highlightBox) return;
    const rect = el.getBoundingClientRect();
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
  }

  function onMouseMove(e) {
    if (!STATE.inspectMode) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === document.documentElement || el === document.body || el === overlayContainer || el === inputPopup) return;
    STATE.hoveredEl = el;
    setHighlightForElement(el);
  }

  function onClick(e) {
    if (!STATE.inspectMode) return;
    if (!STATE.hoveredEl) return;
    e.preventDefault();
    e.stopPropagation();
    STATE.selectedEl = STATE.hoveredEl;
    const rect = STATE.selectedEl.getBoundingClientRect();
    const styleBrief = summarizeStyles(STATE.selectedEl);
    showPopup(rect, styleBrief);
  }

  function summarizeStyles(el) {
    const style = window.getComputedStyle(el);
    const brief = {
      backgroundColor: style.backgroundColor,
      color: style.color,
      padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
      margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
      borderRadius: style.borderRadius,
      border: [style.borderTopWidth, style.borderTopStyle, style.borderTopColor].join(' ').trim()
    };
    const parts = [];
    if (brief.backgroundColor && brief.backgroundColor !== 'rgba(0, 0, 0, 0)') parts.push(`background-color: ${brief.backgroundColor}`);
    if (brief.color) parts.push(`color: ${brief.color}`);
    if (brief.padding && /[1-9]/.test(brief.padding)) parts.push(`padding: ${brief.padding}`);
    if (brief.margin && /[1-9]/.test(brief.margin)) parts.push(`margin: ${brief.margin}`);
    if (brief.borderRadius && brief.borderRadius !== '0px') parts.push(`border-radius: ${brief.borderRadius}`);
    if (brief.border && !/0px none/.test(brief.border)) parts.push(`border: ${brief.border}`);
    return parts.join('; ');
  }

  function buildStableSelector(el) {
    if (!(el instanceof Element)) return '';
    if (el.id) return `#${cssEscape(el.id)}`;
    const testId = el.getAttribute('data-testid');
    if (testId) return `[data-testid="${cssEscape(testId)}"]`;

    const parts = [];
    let current = el;
    while (current && current.nodeType === 1 && parts.length < 4) {
      const tag = current.tagName.toLowerCase();
      let selector = tag;
      const classList = Array.from(current.classList || []).slice(0, 2).map(cssEscape);
      if (classList.length) selector += `.${classList.join('.')}`;
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(ch => ch.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
      if (current && (current.id || current.getAttribute('data-testid'))) {
        if (current.id) parts.unshift(`#${cssEscape(current.id)}`);
        else parts.unshift(`[data-testid="${cssEscape(current.getAttribute('data-testid'))}"]`);
        break;
      }
    }
    return parts.join(' > ');
  }

  function cssEscape(text) {
    return String(text).replace(/([ !"#$%&'()*+,./:;<=>?@\[\]^`{|}~])/g, '\\$1');
  }

  function buildPrompt(selector, styleSummary, demand) {
    const locationHint = inferLocationHint(STATE.selectedEl);
    const lines = [];
    lines.push('请修改以下元素的样式：');
    lines.push(`- 定位: \`${selector}\`${locationHint ? ` (${locationHint})` : ''}`);
    if (styleSummary) lines.push(`- 当前样式: \`${styleSummary}\``);
    lines.push(`- 修改要求: ${demand || '请根据描述修改样式'}`);
    lines.push('');
    lines.push('请提供可直接使用的CSS代码，并确保符合当前项目的设计系统。');
    return '```markdown\n' + lines.join('\n') + '\n```';
  }

  function inferLocationHint(el) {
    try {
      const docTitle = document.title?.trim();
      const nearText = findNearestText(el, 60);
      const bits = [];
      if (docTitle) bits.push(`页面: ${docTitle}`);
      if (nearText) bits.push(`附近文本: ${nearText}`);
      return bits.join('，');
    } catch {
      return '';
    }
  }

  function findNearestText(el, maxLen) {
    let node = el;
    for (let i = 0; i < 4 && node; i++) {
      const text = node.innerText || node.textContent || '';
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean) return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
      node = node.parentElement;
    }
    return '';
  }

  function addEventListeners() {
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('scroll', () => {
      if (STATE.hoveredEl) setHighlightForElement(STATE.hoveredEl);
    }, true);
    window.addEventListener('resize', () => {
      if (STATE.hoveredEl) setHighlightForElement(STATE.hoveredEl);
    });
  }

  function removeEventListeners() {
    window.removeEventListener('mousemove', onMouseMove, true);
    window.removeEventListener('click', onClick, true);
  }

  function toggleInspectMode(next) {
    const newValue = typeof next === 'boolean' ? next : !STATE.inspectMode;
    STATE.inspectMode = newValue;
    if (STATE.inspectMode) {
      ensureOverlay();
      addEventListeners();
      showToast('🎯 检查模式已开启，移动鼠标悬停并点击元素');
    } else {
      removeEventListeners();
      removeOverlay();
      hidePopup();
      STATE.hoveredEl = null;
      STATE.selectedEl = null;
      showToast('👋 检查模式已关闭');
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'HOVER_PROMPT_TOGGLE') {
      toggleInspectMode();
    }
  });
})();
