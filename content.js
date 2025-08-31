(function () {
  const STATE = {
    inspectMode: false,
    hoveredEl: null,
    selectedEl: null
  };

  // 优化的颜色和样式配置
  const STYLES = {
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: '#e5e7eb',
      borderHover: '#d1d5db',
      background: '#ffffff',
      backgroundHover: '#f9fafb',
      text: '#1f2937',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      mask: 'rgba(0, 0, 0, 0.4)',
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowHover: 'rgba(0, 0, 0, 0.15)'
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      xxl: '24px'
    },
    borderRadius: {
      sm: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    transitions: {
      fast: 'all 0.15s ease-in-out',
      normal: 'all 0.2s ease-in-out',
      slow: 'all 0.3s ease-in-out'
    }
  };

  let overlayContainer = null;
  let highlightBox = null;
  let selectedHighlightBox = null;
  let dimMask = null;
  let inputPopup = null;
  let toastEl = null;
  let tooltipEl = null;
  let helpTipEl = null;

  function ensureOverlay() {
    try {
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
      dimMask.style.background = STYLES.colors.mask;
      dimMask.style.pointerEvents = 'none';
      dimMask.style.transition = STYLES.transitions.normal;

      highlightBox = document.createElement('div');
      highlightBox.style.position = 'absolute';
      highlightBox.style.border = `2px solid ${STYLES.colors.primary}`;
      highlightBox.style.background = `${STYLES.colors.primary}10`;
      highlightBox.style.boxSizing = 'border-box';
      highlightBox.style.pointerEvents = 'none';
      highlightBox.style.transition = STYLES.transitions.fast;
      highlightBox.style.borderRadius = STYLES.borderRadius.sm;
      highlightBox.style.boxShadow = `0 0 0 1px ${STYLES.colors.primary}30`;

      // 创建选中元素的高亮框
      selectedHighlightBox = document.createElement('div');
      selectedHighlightBox.style.position = 'absolute';
      selectedHighlightBox.style.border = `3px solid ${STYLES.colors.success}`;
      selectedHighlightBox.style.background = `${STYLES.colors.success}15`;
      selectedHighlightBox.style.boxSizing = 'border-box';
      selectedHighlightBox.style.pointerEvents = 'none';
      selectedHighlightBox.style.transition = STYLES.transitions.fast;
      selectedHighlightBox.style.borderRadius = STYLES.borderRadius.sm;
      selectedHighlightBox.style.boxShadow = `0 0 0 2px ${STYLES.colors.success}40`;
      selectedHighlightBox.style.display = 'none';

      overlayContainer.appendChild(dimMask);
      overlayContainer.appendChild(highlightBox);
      overlayContainer.appendChild(selectedHighlightBox);
      document.documentElement.appendChild(overlayContainer);
      
      // 创建键盘快捷键提示
      showKeyboardHelp();
    } catch (error) {
      console.error('HoverPrompt: ensureOverlay 错误', error);
      throw error;
    }
  }

  function removeOverlay() {
    if (overlayContainer && overlayContainer.parentNode) {
      overlayContainer.parentNode.removeChild(overlayContainer);
    }
    overlayContainer = null;
    highlightBox = null;
    selectedHighlightBox = null;
    dimMask = null;
    hideKeyboardHelp();
  }

  function ensurePopup() {
    if (inputPopup) return;
    inputPopup = document.createElement('div');
    inputPopup.style.position = 'fixed';
    inputPopup.style.maxWidth = '400px';
    inputPopup.style.width = '400px';
    inputPopup.style.background = STYLES.colors.background;
    inputPopup.style.boxShadow = STYLES.shadows.xl;
    inputPopup.style.borderRadius = STYLES.borderRadius.lg;
    inputPopup.style.padding = STYLES.spacing.md;
    inputPopup.style.zIndex = '2147483647';
    inputPopup.style.display = 'none';
    inputPopup.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji';
    inputPopup.style.border = `1px solid ${STYLES.colors.border}`;
    inputPopup.style.transition = STYLES.transitions.normal;
    inputPopup.style.backdropFilter = 'blur(8px)';



    const currentStyle = document.createElement('div');
    currentStyle.style.fontSize = '12px';
    currentStyle.style.color = STYLES.colors.textSecondary;
    currentStyle.style.marginBottom = STYLES.spacing.sm;
    currentStyle.style.padding = `${STYLES.spacing.xs} ${STYLES.spacing.sm}`;
    currentStyle.style.background = STYLES.colors.backgroundHover;
    currentStyle.style.borderRadius = STYLES.borderRadius.sm;
    currentStyle.style.border = `1px solid ${STYLES.colors.border}`;
    currentStyle.style.fontFamily = 'monospace';
    currentStyle.style.wordBreak = 'break-all';

    const input = document.createElement('textarea');
    input.placeholder = '输入修改需求...';
    input.style.width = '100%';
    input.style.height = '80px';
    input.style.border = `1px solid ${STYLES.colors.border}`;
    input.style.borderRadius = STYLES.borderRadius.md;
    input.style.padding = '12px 16px';
    input.style.outline = 'none';
    input.style.resize = 'vertical';
    input.style.fontSize = '14px';
    input.style.fontFamily = 'inherit';
    input.style.transition = STYLES.transitions.fast;

    // 添加焦点效果
    input.addEventListener('focus', () => {
      input.style.borderColor = STYLES.colors.primary;
      input.style.boxShadow = `0 0 0 3px ${STYLES.colors.primary}20`;
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = STYLES.colors.border;
      input.style.boxShadow = 'none';
    });

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = STYLES.spacing.sm;
    buttonContainer.style.marginTop = STYLES.spacing.md;

    // 生成按钮
    const generateBtn = document.createElement('button');
    generateBtn.textContent = '生成 Prompt';
    generateBtn.style.flex = '1';
    generateBtn.style.padding = `${STYLES.spacing.sm} ${STYLES.spacing.md}`;
    generateBtn.style.background = STYLES.colors.primary;
    generateBtn.style.color = 'white';
    generateBtn.style.border = 'none';
    generateBtn.style.borderRadius = STYLES.borderRadius.md;
    generateBtn.style.fontSize = '14px';
    generateBtn.style.fontWeight = '600';
    generateBtn.style.cursor = 'pointer';
    generateBtn.style.transition = STYLES.transitions.fast;

    generateBtn.addEventListener('mouseenter', () => {
      generateBtn.style.background = STYLES.colors.primaryHover;
      generateBtn.style.transform = 'translateY(-1px)';
    });

    generateBtn.addEventListener('mouseleave', () => {
      generateBtn.style.background = STYLES.colors.primary;
      generateBtn.style.transform = 'translateY(0)';
    });

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.padding = `${STYLES.spacing.sm} ${STYLES.spacing.md}`;
    cancelBtn.style.background = 'transparent';
    cancelBtn.style.color = STYLES.colors.textSecondary;
    cancelBtn.style.border = `1px solid ${STYLES.colors.border}`;
    cancelBtn.style.borderRadius = STYLES.borderRadius.md;
    cancelBtn.style.fontSize = '14px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.transition = STYLES.transitions.fast;

    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = STYLES.colors.backgroundHover;
      cancelBtn.style.borderColor = STYLES.colors.borderHover;
    });

    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'transparent';
      cancelBtn.style.borderColor = STYLES.colors.border;
    });

    const handleGenerate = async () => {
      if (!STATE.selectedEl) return;
      const selector = buildStableSelector(STATE.selectedEl);
      const styleSummary = summarizeStyles(STATE.selectedEl);
      const userDemand = input.value.trim();
      if (!userDemand) {
        showToast('请输入修改需求', 'warning');
        return;
      }
      const prompt = buildPrompt(selector, styleSummary, userDemand);
      try {
        await navigator.clipboard.writeText(prompt);
        showToast('Prompt 已复制到剪贴板！', 'success');
      } catch (err) {
        showToast('复制失败，请手动复制', 'error');
      }
      hidePopup();
      hideSelectedHighlight();
      toggleInspectMode(false);
    };

    const handleCancel = () => {
      hidePopup();
      hideSelectedHighlight();
      toggleInspectMode(false);
    };

    generateBtn.addEventListener('click', handleGenerate);
    cancelBtn.addEventListener('click', handleCancel);
    
    // 为按钮添加键盘快捷键提示
    generateBtn.title = '快捷键: Enter';
    cancelBtn.title = '快捷键: Esc';

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleGenerate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancel();
      }
    });

    buttonContainer.appendChild(generateBtn);
    buttonContainer.appendChild(cancelBtn);

    inputPopup.appendChild(currentStyle);
    inputPopup.appendChild(input);
    inputPopup.appendChild(buttonContainer);
    document.documentElement.appendChild(inputPopup);

    inputPopup.__updateStyle = (text) => {
      currentStyle.textContent = text ? `当前样式: ${text}` : '';
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
    hideKeyboardHelp(); // 弹窗打开时隐藏键盘帮助
    setTimeout(() => inputPopup.__focusInput(), 0);
  }

  function hidePopup() {
    if (!inputPopup) return;
    inputPopup.style.display = 'none';
    // 重置选中状态
    STATE.selectedEl = null;
    if (STATE.inspectMode) {
      showKeyboardHelp(); // 弹窗关闭时重新显示键盘帮助
    }
  }

  function showTooltip(x, y, el) {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.style.position = 'fixed';
      tooltipEl.style.background = STYLES.colors.background;
      tooltipEl.style.border = `1px solid ${STYLES.colors.border}`;
      tooltipEl.style.borderRadius = STYLES.borderRadius.md;
      tooltipEl.style.padding = `${STYLES.spacing.xs} ${STYLES.spacing.sm}`;
      tooltipEl.style.fontSize = '12px';
      tooltipEl.style.color = STYLES.colors.textSecondary;
      tooltipEl.style.boxShadow = STYLES.shadows.md;
      tooltipEl.style.zIndex = '2147483646';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.transition = STYLES.transitions.fast;
      tooltipEl.style.backdropFilter = 'blur(4px)';
      document.documentElement.appendChild(tooltipEl);
    }

    const tagName = el.tagName.toLowerCase();
    const className = el.className ? `.${el.className.split(' ').slice(0, 2).join('.')}` : '';
    const id = el.id ? `#${el.id}` : '';
    const text = el.textContent?.trim().slice(0, 30) || '';
    const displayText = `${tagName}${id}${className}${text ? ` - "${text}${text.length > 30 ? '...' : ''}"` : ''}`;
    
    tooltipEl.textContent = displayText;
    tooltipEl.style.display = 'block';
    
    // 定位工具提示
    const rect = tooltipEl.getBoundingClientRect();
    let left = x + 10;
    let top = y - rect.height - 10;
    
    if (left + rect.width > window.innerWidth - 10) {
      left = x - rect.width - 10;
    }
    if (top < 10) {
      top = y + 20;
    }
    
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.style.display = 'none';
    }
  }

  function showToast(message, type = 'success') {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.position = 'fixed';
      toastEl.style.left = '50%';
      toastEl.style.top = '24px';
      toastEl.style.transform = 'translateX(-50%)';
      toastEl.style.background = STYLES.colors.background;
      toastEl.style.border = `1px solid ${STYLES.colors.border}`;
      toastEl.style.color = STYLES.colors.text;
      toastEl.style.padding = `${STYLES.spacing.sm} ${STYLES.spacing.md}`;
      toastEl.style.borderRadius = STYLES.borderRadius.full;
      toastEl.style.fontSize = '14px';
      toastEl.style.fontWeight = '500';
      toastEl.style.boxShadow = STYLES.shadows.lg;
      toastEl.style.zIndex = '2147483647';
      toastEl.style.display = 'flex';
      toastEl.style.alignItems = 'center';
      toastEl.style.gap = STYLES.spacing.xs;
      toastEl.style.transition = STYLES.transitions.normal;
      toastEl.style.backdropFilter = 'blur(8px)';
      document.documentElement.appendChild(toastEl);
    }

    // 根据类型设置样式
    const colors = {
      success: { border: STYLES.colors.success, icon: '✅' },
      warning: { border: STYLES.colors.warning, icon: '⚠️' },
      error: { border: STYLES.colors.error, icon: '❌' },
      info: { border: STYLES.colors.primary, icon: 'ℹ️' }
    };

    const color = colors[type] || colors.info;
    toastEl.style.borderColor = color.border;
    toastEl.innerHTML = `<span>${color.icon}</span><span>${message}</span>`;
    toastEl.style.display = 'flex';
    
    clearTimeout(toastEl.__t);
    toastEl.__t = setTimeout(() => {
      if (toastEl) toastEl.style.display = 'none';
    }, 3000);
  }

  function setHighlightForElement(el) {
    if (!el || !highlightBox) return;
    const rect = el.getBoundingClientRect();
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;
  }

  function setSelectedHighlightForElement(el) {
    if (!el || !selectedHighlightBox) return;
    const rect = el.getBoundingClientRect();
    selectedHighlightBox.style.left = `${rect.left + window.scrollX}px`;
    selectedHighlightBox.style.top = `${rect.top + window.scrollY}px`;
    selectedHighlightBox.style.width = `${rect.width}px`;
    selectedHighlightBox.style.height = `${rect.height}px`;
    selectedHighlightBox.style.display = 'block';
  }

  function hideSelectedHighlight() {
    if (selectedHighlightBox) {
      selectedHighlightBox.style.display = 'none';
    }
    // 确保状态也被重置
    if (STATE.selectedEl) {
      STATE.selectedEl = null;
    }
  }

  function showKeyboardHelp() {
    if (!helpTipEl) {
      helpTipEl = document.createElement('div');
      helpTipEl.style.position = 'fixed';
      helpTipEl.style.bottom = '20px';
      helpTipEl.style.right = '20px';
      helpTipEl.style.background = STYLES.colors.background;
      helpTipEl.style.border = `1px solid ${STYLES.colors.border}`;
      helpTipEl.style.borderRadius = STYLES.borderRadius.md;
      helpTipEl.style.padding = `${STYLES.spacing.sm} ${STYLES.spacing.md}`;
      helpTipEl.style.fontSize = '12px';
      helpTipEl.style.color = STYLES.colors.textSecondary;
      helpTipEl.style.boxShadow = STYLES.shadows.md;
      helpTipEl.style.zIndex = '2147483646';
      helpTipEl.style.pointerEvents = 'none';
      helpTipEl.style.transition = STYLES.transitions.fast;
      helpTipEl.style.backdropFilter = 'blur(4px)';
      helpTipEl.style.maxWidth = '200px';
      helpTipEl.style.lineHeight = '1.4';
      document.documentElement.appendChild(helpTipEl);
    }
    
    helpTipEl.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; color: ${STYLES.colors.text};">键盘快捷键</div>
      <div>ESC - 退出检查模式</div>
      <div>Ctrl+Shift+H - 切换检查模式</div>
    `;
    helpTipEl.style.display = 'block';
  }

  function hideKeyboardHelp() {
    if (helpTipEl) {
      helpTipEl.style.display = 'none';
    }
  }

  function onMouseMove(e) {
    if (!STATE.inspectMode) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === document.documentElement || el === document.body || el === overlayContainer || el === inputPopup || el === tooltipEl) return;
    STATE.hoveredEl = el;
    setHighlightForElement(el);
    showTooltip(e.clientX, e.clientY, el);
  }

  function onClick(e) {
    if (!STATE.inspectMode) return;
    if (!STATE.hoveredEl) return;
    
    // 检查是否点击了扩展自己的元素
    const target = e.target;
    if (target === inputPopup || inputPopup?.contains(target) || 
        target === tooltipEl || tooltipEl?.contains(target) ||
        target === overlayContainer || overlayContainer?.contains(target)) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    STATE.selectedEl = STATE.hoveredEl;
    
    // 设置选中元素的高亮
    setSelectedHighlightForElement(STATE.selectedEl);
    
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
    // 构建包含用户需求和元素选择器的Prompt
    const prompt = `${demand}（元素选择器：${selector}）`;
    
    return prompt;
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
      if (STATE.selectedEl) setSelectedHighlightForElement(STATE.selectedEl);
      hideTooltip();
    }, true);
    window.addEventListener('resize', () => {
      if (STATE.hoveredEl) setHighlightForElement(STATE.hoveredEl);
      if (STATE.selectedEl) setSelectedHighlightForElement(STATE.selectedEl);
      hideTooltip();
    });
  }

  function removeEventListeners() {
    window.removeEventListener('mousemove', onMouseMove, true);
    window.removeEventListener('click', onClick, true);
    hideTooltip();
    hideKeyboardHelp();
  }

  function toggleInspectMode(next) {
    try {
      const newValue = typeof next === 'boolean' ? next : !STATE.inspectMode;
      STATE.inspectMode = newValue;
      
      if (STATE.inspectMode) {
        ensureOverlay();
        addEventListeners();
        showToast('检查模式已开启，移动鼠标悬停并点击元素 (ESC退出)', 'info');
      } else {
        removeEventListeners();
        removeOverlay();
        hidePopup();
        hideSelectedHighlight();
        STATE.hoveredEl = null;
        STATE.selectedEl = null;
        showToast('检查模式已关闭', 'info');
      }
    } catch (error) {
      console.error('HoverPrompt: toggleInspectMode 错误', error);
      showToast('切换检查模式时发生错误', 'error');
    }
  }

  // 添加键盘快捷键支持
  document.addEventListener('keydown', (e) => {
    // 全局快捷键：Ctrl+Shift+H 切换检查模式
    if (e.ctrlKey && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      e.stopPropagation();
      toggleInspectMode();
      return;
    }

    // 只在检查模式下处理其他快捷键
    if (!STATE.inspectMode) {
      return;
    }

    // 检查模式下的快捷键
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        console.log('HoverPrompt: ESC键被按下');
        handleEscapeKey();
        break;
      
      case 'Enter':
        // 如果弹窗打开且输入框有焦点，不处理Enter键（让输入框自己处理）
        if (inputPopup && inputPopup.style.display !== 'none') {
          return;
        }
        break;
      
      case 'Tab':
        // 如果弹窗打开，允许Tab键在弹窗内导航
        if (inputPopup && inputPopup.style.display !== 'none') {
          return;
        }
        break;
    }
  }, true); // 添加 true 参数，使用捕获阶段

  // 处理ESC键的统一函数
  function handleEscapeKey() {
    if (inputPopup && inputPopup.style.display !== 'none') {
      // 如果弹窗打开，先关闭弹窗
      console.log('HoverPrompt: 关闭弹窗');
      hidePopup();
      hideSelectedHighlight();
      // 重置选中状态
      STATE.selectedEl = null;
    } else {
      // 否则退出检查模式
      console.log('HoverPrompt: 退出检查模式');
      // 强制重置所有状态
      forceResetState();
      toggleInspectMode(false);
    }
  }

  // 强制重置所有状态的函数
  function forceResetState() {
    console.log('HoverPrompt: 强制重置状态');
    STATE.hoveredEl = null;
    STATE.selectedEl = null;
    
    // 隐藏所有UI元素
    if (tooltipEl) tooltipEl.style.display = 'none';
    if (helpTipEl) helpTipEl.style.display = 'none';
    
    // 确保高亮框被隐藏
    if (selectedHighlightBox) {
      selectedHighlightBox.style.display = 'none';
    }
    if (highlightBox) {
      highlightBox.style.display = 'none';
    }
  }

  // 消息监听器
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('HoverPrompt: 收到消息', msg);
    if (msg && msg.type === 'HOVER_PROMPT_TOGGLE') {
      try {
        toggleInspectMode();
        sendResponse({ success: true });
      } catch (error) {
        console.error('HoverPrompt: 切换检查模式失败', error);
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // 保持消息通道开放
  });

  // 初始化时输出日志
  console.log('HoverPrompt: content script 已加载');
})();

