(function () {
  const STATE = {
    inspectMode: false,
    hoveredEl: null,
    selectedEl: null,
    multiSelectMode: false,
    selectedElements: [], // 多选模式下的选中元素数组
    maxSelectCount: 10 // 最大选择数量限制
  };

  // 优化的颜色和样式配置 - 液态玻璃效果
  const STYLES = {
    colors: {
      primary: '#667eea',
      primaryHover: '#5a67d8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      border: 'rgba(0, 0, 0, 0.1)',
      borderHover: 'rgba(0, 0, 0, 0.2)',
      background: 'rgba(255, 255, 255, 0.9)',
      backgroundHover: 'rgba(255, 255, 255, 0.95)',
      text: '#1f2937',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      mask: 'rgba(102, 126, 234, 0.1)',
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
  let inputPopup = null;
  let toastEl = null;
  let tooltipEl = null;
  let helpTipEl = null;
  let numberLabels = []; // 存储序号标签元素
  let multiSelectHighlights = []; // 存储多选模式下的高亮框

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



      highlightBox = document.createElement('div');
      highlightBox.style.position = 'absolute';
      highlightBox.style.border = `2px solid ${STYLES.colors.primary}`;
      highlightBox.style.background = `rgba(102, 126, 234, 0.1)`;
      highlightBox.style.boxSizing = 'border-box';
      highlightBox.style.pointerEvents = 'none';
      highlightBox.style.transition = STYLES.transitions.fast;
      highlightBox.style.borderRadius = STYLES.borderRadius.sm;
      highlightBox.style.boxShadow = `0 0 0 1px rgba(102, 126, 234, 0.3), 0 4px 12px rgba(102, 126, 234, 0.2)`;

      // 创建选中元素的高亮框
      selectedHighlightBox = document.createElement('div');
      selectedHighlightBox.style.position = 'absolute';
      selectedHighlightBox.style.border = `3px solid ${STYLES.colors.success}`;
      selectedHighlightBox.style.background = `rgba(16, 185, 129, 0.15)`;
      selectedHighlightBox.style.boxSizing = 'border-box';
      selectedHighlightBox.style.pointerEvents = 'none';
      selectedHighlightBox.style.transition = STYLES.transitions.fast;
      selectedHighlightBox.style.borderRadius = STYLES.borderRadius.sm;
      selectedHighlightBox.style.boxShadow = `0 0 0 2px rgba(16, 185, 129, 0.4), 0 8px 20px rgba(16, 185, 129, 0.3)`;
      selectedHighlightBox.style.display = 'none';

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
    clearNumberLabels();
    clearMultiSelectHighlights();
    hideKeyboardHelp();
  }

  // 创建序号标签
  function createNumberLabel(number, element) {
    const label = document.createElement('div');
    label.textContent = number;
    label.style.position = 'absolute';
    label.style.background = `linear-gradient(135deg, ${STYLES.colors.primary}, ${STYLES.colors.primaryHover})`;
    label.style.color = 'white';
    label.style.width = '24px';
    label.style.height = '24px';
    label.style.borderRadius = '50%';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.justifyContent = 'center';
    label.style.fontSize = '12px';
    label.style.fontWeight = '600';
    label.style.zIndex = '2147483648';
    label.style.pointerEvents = 'none';
    label.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    label.style.border = '2px solid white';
    label.style.transition = STYLES.transitions.fast;
    
    // 存储元素引用，用于更新位置
    label.__element = element;
    label.__number = number;
    
    return label;
  }

  // 更新序号标签位置
  function updateNumberLabelPosition(label) {
    if (!label.__element) return;
    const rect = label.__element.getBoundingClientRect();
    label.style.left = `${rect.right + window.scrollX - 12}px`;
    label.style.top = `${rect.top + window.scrollY - 12}px`;
  }

  // 显示所有序号标签
  function showNumberLabels() {
    clearNumberLabels();
    STATE.selectedElements.forEach((element, index) => {
      const label = createNumberLabel(index + 1, element);
      updateNumberLabelPosition(label);
      overlayContainer.appendChild(label);
      numberLabels.push(label);
    });
  }

  // 清除所有序号标签
  function clearNumberLabels() {
    numberLabels.forEach(label => {
      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    numberLabels = [];
  }

  // 更新序号标签位置（用于滚动和窗口大小变化）
  function updateAllNumberLabels() {
    numberLabels.forEach(updateNumberLabelPosition);
  }

  // 创建多选高亮框
  function createMultiSelectHighlight(element) {
    const highlight = document.createElement('div');
    highlight.style.position = 'absolute';
    highlight.style.border = `3px solid ${STYLES.colors.success}`;
    highlight.style.background = `rgba(16, 185, 129, 0.15)`;
    highlight.style.boxSizing = 'border-box';
    highlight.style.pointerEvents = 'none';
    highlight.style.transition = STYLES.transitions.fast;
    highlight.style.borderRadius = STYLES.borderRadius.sm;
    highlight.style.boxShadow = `0 0 0 2px rgba(16, 185, 129, 0.4), 0 8px 20px rgba(16, 185, 129, 0.3)`;
    highlight.style.display = 'block';
    
    // 存储元素引用，用于更新位置
    highlight.__element = element;
    
    return highlight;
  }

  // 更新多选高亮框位置
  function updateMultiSelectHighlightPosition(highlight) {
    if (!highlight.__element) return;
    const rect = highlight.__element.getBoundingClientRect();
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
  }

  // 显示所有多选高亮框
  function showMultiSelectHighlights() {
    clearMultiSelectHighlights();
    STATE.selectedElements.forEach((element) => {
      const highlight = createMultiSelectHighlight(element);
      updateMultiSelectHighlightPosition(highlight);
      overlayContainer.appendChild(highlight);
      multiSelectHighlights.push(highlight);
    });
  }

  // 清除所有多选高亮框
  function clearMultiSelectHighlights() {
    multiSelectHighlights.forEach(highlight => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    });
    multiSelectHighlights = [];
  }

  // 更新所有多选高亮框位置（用于滚动和窗口大小变化）
  function updateAllMultiSelectHighlights() {
    multiSelectHighlights.forEach(updateMultiSelectHighlightPosition);
  }

  function ensurePopup() {
    if (inputPopup) return;
    inputPopup = document.createElement('div');
    inputPopup.style.position = 'fixed';
    inputPopup.style.maxWidth = '400px';
    inputPopup.style.width = '400px';
    inputPopup.style.background = STYLES.colors.background;
    inputPopup.style.boxShadow = `0 25px 50px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)`;
    inputPopup.style.borderRadius = STYLES.borderRadius.lg;
    inputPopup.style.padding = STYLES.spacing.md;
    inputPopup.style.zIndex = '2147483647';
    inputPopup.style.display = 'none';
    inputPopup.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,Apple Color Emoji,Segoe UI Emoji';
    inputPopup.style.border = `1px solid ${STYLES.colors.border}`;
    inputPopup.style.transition = STYLES.transitions.normal;




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
    input.style.background = 'rgba(255, 255, 255, 0.1)';
    input.style.color = STYLES.colors.text;


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
    generateBtn.style.background = `linear-gradient(135deg, ${STYLES.colors.primary}, ${STYLES.colors.primaryHover})`;
    generateBtn.style.color = 'white';
    generateBtn.style.border = 'none';
    generateBtn.style.borderRadius = STYLES.borderRadius.md;
    generateBtn.style.fontSize = '14px';
    generateBtn.style.fontWeight = '600';
    generateBtn.style.cursor = 'pointer';
    generateBtn.style.transition = STYLES.transitions.fast;
    generateBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';


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
    cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
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
      const userDemand = input.value.trim();
      if (!userDemand) {
        showToast('请输入修改需求', 'warning');
        return;
      }

      let prompt;
      if (STATE.multiSelectMode && STATE.selectedElements.length > 0) {
        // 多选模式
        prompt = buildMultiSelectPrompt(STATE.selectedElements, userDemand);
      } else if (STATE.selectedEl) {
        // 单选模式
        const selector = buildStableSelector(STATE.selectedEl);
        const styleSummary = summarizeStyles(STATE.selectedEl);
        prompt = buildPrompt(selector, styleSummary, userDemand);
      } else {
        showToast('请先选择元素', 'warning');
        return;
      }

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

    // 创建多选信息显示区域
    const multiSelectInfo = document.createElement('div');
    multiSelectInfo.style.fontSize = '12px';
    multiSelectInfo.style.color = STYLES.colors.primary;
    multiSelectInfo.style.marginBottom = STYLES.spacing.sm;
    multiSelectInfo.style.padding = `${STYLES.spacing.xs} ${STYLES.spacing.sm}`;
    multiSelectInfo.style.background = 'rgba(102, 126, 234, 0.1)';
    multiSelectInfo.style.borderRadius = STYLES.borderRadius.sm;
    multiSelectInfo.style.border = `1px solid rgba(102, 126, 234, 0.3)`;
    multiSelectInfo.style.fontWeight = '500';
    multiSelectInfo.style.display = 'none';

    inputPopup.__updateStyle = (text) => {
      currentStyle.textContent = text ? `当前样式: ${text}` : '';
    };

    inputPopup.__updateMultiSelectInfo = (isMultiSelect, count) => {
      if (isMultiSelect) {
        multiSelectInfo.textContent = `多选模式 - 已选择 ${count} 个元素`;
        multiSelectInfo.style.display = 'block';
      } else {
        multiSelectInfo.style.display = 'none';
      }
    };

    inputPopup.__focusInput = () => input.focus();

    // 将多选信息插入到样式信息之后
    currentStyle.parentNode.insertBefore(multiSelectInfo, currentStyle.nextSibling);
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
    inputPopup.__updateMultiSelectInfo(false, 0); // 单选模式
    hideKeyboardHelp(); // 弹窗打开时隐藏键盘帮助
    setTimeout(() => inputPopup.__focusInput(), 0);
  }

  function showMultiSelectPopup(rect, styleBrief) {
    ensurePopup();
    inputPopup.style.display = 'block';
    positionPopupNearRect(rect);
    inputPopup.__updateStyle(styleBrief);
    inputPopup.__updateMultiSelectInfo(true, STATE.selectedElements.length);
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
    tooltipEl.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    tooltipEl.style.zIndex = '2147483646';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.transition = STYLES.transitions.fast;

      document.documentElement.appendChild(tooltipEl);
    }

    const tagName = el.tagName.toLowerCase();
    
    // 安全地获取 className，处理 SVG 元素等特殊情况
    let className = '';
    try {
      if (el.className && typeof el.className === 'string') {
        className = `.${el.className.split(' ').slice(0, 2).join('.')}`;
      } else if (el.className && el.className.baseVal && typeof el.className.baseVal === 'string') {
        // 处理 SVG 元素
        className = `.${el.className.baseVal.split(' ').slice(0, 2).join('.')}`;
      }
    } catch (error) {
      console.warn('HoverPrompt: 获取 className 失败', error);
      className = '';
    }
    
    const id = el.id ? `#${el.id}` : '';
    const text = el.textContent?.trim().slice(0, 30) || '';
    
    // 检查元素状态
    let statusText = '';
    if (isElementDisabled(el)) {
      statusText = ' [已禁用]';
    } else if (hasPointerEventsNone(el)) {
      statusText = ' [无点击事件]';
    }
    
    const displayText = `${tagName}${id}${className}${text ? ` - "${text}${text.length > 30 ? '...' : ''}"` : ''}${statusText}`;
    
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
      toastEl.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
      toastEl.style.zIndex = '2147483647';
      toastEl.style.display = 'flex';
      toastEl.style.alignItems = 'center';
      toastEl.style.gap = STYLES.spacing.xs;
      toastEl.style.transition = STYLES.transitions.normal;

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
    updateKeyboardHelp();
  }

  function updateKeyboardHelp() {
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
      helpTipEl.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      helpTipEl.style.zIndex = '2147483646';
      helpTipEl.style.pointerEvents = 'none';
      helpTipEl.style.transition = STYLES.transitions.fast;

      helpTipEl.style.maxWidth = '220px';
      helpTipEl.style.lineHeight = '1.4';
      document.documentElement.appendChild(helpTipEl);
    }
    
    const modeText = STATE.multiSelectMode ? '多选模式' : '单选模式';
    const modeColor = STATE.multiSelectMode ? STYLES.colors.primary : STYLES.colors.text;
    
    helpTipEl.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; color: ${STYLES.colors.text};">键盘快捷键</div>
      <div style="color: ${modeColor}; font-weight: 500; margin-bottom: 4px;">当前: ${modeText}</div>
      <div>ESC - 退出检查模式</div>
      <div>M - 切换多选模式</div>
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
    
    // 使用更智能的元素检测，处理禁用元素和pointer-events:none的情况
    const el = getSelectableElement(e.clientX, e.clientY);
    if (!el) return;
    
    STATE.hoveredEl = el;
    setHighlightForElement(el);
    showTooltip(e.clientX, e.clientY, el);
  }

  // 获取可选择的元素，处理禁用状态和pointer-events:none
  function getSelectableElement(x, y) {
    // 首先尝试直接获取元素
    let el = document.elementFromPoint(x, y);
    
    // 如果元素不可选择，尝试向上查找可选择的父元素
    while (el && el !== document.documentElement && el !== document.body) {
      // 跳过扩展自己的元素
      if (el === overlayContainer || el === inputPopup || el === tooltipEl || 
          overlayContainer?.contains(el) || inputPopup?.contains(el) || tooltipEl?.contains(el)) {
        el = el.parentElement;
        continue;
      }
      
      // 确保元素是有效的 DOM 元素
      if (!(el instanceof Element)) {
        el = el.parentElement;
        continue;
      }
      
      // 检查元素是否被禁用
      if (isElementDisabled(el)) {
        el = el.parentElement;
        continue;
      }
      
      // 检查元素是否有pointer-events:none
      if (hasPointerEventsNone(el)) {
        el = el.parentElement;
        continue;
      }
      
      // 如果元素可选择，返回它
      return el;
    }
    
    return null;
  }

  // 检查元素是否被禁用
  function isElementDisabled(el) {
    // 检查disabled属性
    if (el.disabled === true) return true;
    
    // 检查aria-disabled属性
    if (el.getAttribute('aria-disabled') === 'true') return true;
    
    // 检查是否有disabled类名
    if (el.classList.contains('disabled')) return true;
    
    return false;
  }

  // 检查元素是否有pointer-events:none
  function hasPointerEventsNone(el) {
    const style = window.getComputedStyle(el);
    return style.pointerEvents === 'none';
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
    
    // 确保选中的元素是有效的 DOM 元素
    if (!(STATE.hoveredEl instanceof Element)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (STATE.multiSelectMode) {
      // 多选模式
      handleMultiSelect(STATE.hoveredEl);
    } else {
      // 单选模式
      handleSingleSelect(STATE.hoveredEl);
    }
  }

  // 处理单选
  function handleSingleSelect(element) {
    STATE.selectedEl = element;
    STATE.selectedElements = [element]; // 单选时也更新多选数组
    
    // 设置选中元素的高亮
    setSelectedHighlightForElement(STATE.selectedEl);
    
    const rect = STATE.selectedEl.getBoundingClientRect();
    const styleBrief = summarizeStyles(STATE.selectedEl);
    showPopup(rect, styleBrief);
  }

  // 处理多选
  function handleMultiSelect(element) {
    const existingIndex = STATE.selectedElements.findIndex(el => el === element);
    
    if (existingIndex !== -1) {
      // 如果元素已选中，则取消选择
      STATE.selectedElements.splice(existingIndex, 1);
      showToast(`已取消选择元素 ${existingIndex + 1}`, 'info');
    } else {
      // 如果元素未选中，则添加到选择列表
      if (STATE.selectedElements.length >= STATE.maxSelectCount) {
        showToast(`最多只能选择 ${STATE.maxSelectCount} 个元素`, 'warning');
        return;
      }
      STATE.selectedElements.push(element);
      showToast(`已选择元素 ${STATE.selectedElements.length}`, 'success');
    }
    
    // 更新序号标签显示和高亮框
    showNumberLabels();
    showMultiSelectHighlights();
    
    // 如果选择了元素，显示弹窗
    if (STATE.selectedElements.length > 0) {
      const rect = element.getBoundingClientRect();
      const styleBrief = summarizeStyles(element);
      showMultiSelectPopup(rect, styleBrief);
    } else {
      hidePopup();
    }
  }

  // 切换多选模式
  function toggleMultiSelectMode() {
    STATE.multiSelectMode = !STATE.multiSelectMode;
    
    if (STATE.multiSelectMode) {
      // 进入多选模式
      STATE.selectedElements = STATE.selectedEl ? [STATE.selectedEl] : [];
      showToast('已进入多选模式，点击元素进行多选 (M键切换模式)', 'info');
      showNumberLabels();
      showMultiSelectHighlights();
    } else {
      // 退出多选模式
      STATE.selectedElements = [];
      clearNumberLabels();
      clearMultiSelectHighlights();
      showToast('已退出多选模式', 'info');
    }
    
    // 更新帮助提示
    updateKeyboardHelp();
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
      
      // 安全地获取 classList，处理 SVG 元素等特殊情况
      try {
        if (current.classList && current.classList.length > 0) {
          const classList = Array.from(current.classList).slice(0, 2).map(cssEscape);
          if (classList.length) selector += `.${classList.join('.')}`;
        }
      } catch (error) {
        console.warn('HoverPrompt: 获取 classList 失败', error);
      }
      
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
    // 获取当前页面信息
    const currentUrl = window.location.href;
    const pageTitle = document.title?.trim() || '未知页面';
    
    // 构建包含用户需求、元素选择器和页面信息的Prompt
    const prompt = `页面：${pageTitle}
URL：${currentUrl}

需求：${demand}

元素选择器：${selector}

请根据以上信息，帮我修改这个元素的样式或功能。`;

    return prompt;
  }

  function buildMultiSelectPrompt(elements, demand) {
    // 获取当前页面信息
    const currentUrl = window.location.href;
    const pageTitle = document.title?.trim() || '未知页面';
    
    // 构建多选元素的描述
    const elementsInfo = elements.map((element, index) => {
      const selector = buildStableSelector(element);
      const styleSummary = summarizeStyles(element);
      return `元素 ${index + 1}：
选择器：${selector}
样式：${styleSummary}`;
    }).join('\n\n');
    
    // 构建包含用户需求、多个元素选择器和页面信息的Prompt
    const prompt = `页面：${pageTitle}
URL：${currentUrl}

需求：${demand}

已选择的元素（共 ${elements.length} 个）：

${elementsInfo}

请根据以上信息，帮我修改这些元素的样式或功能。你可以使用"1号元素"、"2号元素"等来指代具体的元素。`;

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
      if (STATE.multiSelectMode) {
        updateAllNumberLabels();
        updateAllMultiSelectHighlights();
      }
      hideTooltip();
    }, true);
    window.addEventListener('resize', () => {
      if (STATE.hoveredEl) setHighlightForElement(STATE.hoveredEl);
      if (STATE.selectedEl) setSelectedHighlightForElement(STATE.selectedEl);
      if (STATE.multiSelectMode) {
        updateAllNumberLabels();
        updateAllMultiSelectHighlights();
      }
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
        STATE.multiSelectMode = false;
        STATE.selectedElements = [];
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
      
      case 'm':
      case 'M':
        e.preventDefault();
        e.stopPropagation();
        console.log('HoverPrompt: M键被按下，切换多选模式');
        toggleMultiSelectMode();
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
    STATE.multiSelectMode = false;
    STATE.selectedElements = [];
    
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
    
    // 清除序号标签和多选高亮框
    clearNumberLabels();
    clearMultiSelectHighlights();
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

