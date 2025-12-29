/**
 * 设置菜单管理模块
 * 使用函数式编程，支持动态注册设置项
 */

// 设置项类型定义
export type SettingItemType = "text" | "textarea" | "checkbox" | "select" | "button" | "textWithSwitch" | "header";

export interface SettingItem {
    /** 设置项的 key，用于存储和读取配置 */
    key: string;
    /** 设置项标题 */
    title: string;
    /** 设置项描述 */
    description?: string;
    /** 设置项类型 */
    type: SettingItemType;
    /** 默认值 */
    defaultValue?: any;
    /** 占位符（用于 text 和 textarea） */
    placeholder?: string;
    /** 选项列表（用于 select） */
    options?: Array<{ label: string; value: any }>;
    /** 行数（用于 textarea） */
    rows?: number;
    /** 按钮文本（用于 button） */
    buttonText?: string;
    /** 按钮点击回调（用于 button） */
    onClick?: () => void;
}

export interface SettingTab {
    /** Tab 名称 */
    name: string;
    /** Tab 显示文本 */
    label: string;
    /** Tab 下的设置项列表 */
    items: SettingItem[];
}

// 设置项注册表
const settingTabs: SettingTab[] = [];

/**
 * 注册设置 Tab
 * @param tab 设置 Tab 配置
 */
export function registerSettingTab(tab: SettingTab): void {
  settingTabs.push(tab);
}

/**
 * 获取所有注册的设置 Tab
 */
export function getSettingTabs(): SettingTab[] {
  return settingTabs;
}

/**
 * HTML 转义工具函数
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 生成单个设置项的 HTML
 */
function generateSettingItemHTML(item: SettingItem, value: any): string {
  const escapedValue = value !== undefined && value !== null ? escapeHtml(String(value)) : "";
    
  switch (item.type) {
  case "text":
    return `
                <div class="fn__block">
                    <input class="b3-text-field fn__block" 
                           id="setting_${item.key}" 
                           placeholder="${item.placeholder || ""}" 
                           value="${escapedValue}">
                </div>
            `;
        
  case "textarea":
    return `
                <div class="fn__block">
                    <textarea class="b3-text-field fn__block" 
                              id="setting_${item.key}" 
                              placeholder="${item.placeholder || ""}" 
                              rows="${item.rows || 5}">${escapedValue}</textarea>
                </div>
            `;
        
  case "checkbox":
    return `
                <div class="fn__flex">
                    <input type="checkbox" class="b3-switch" 
                           id="setting_${item.key}" 
                           ${value ? "checked" : ""}>
                    <span class="fn__space"></span>
                    <span>${item.description || ""}</span>
                </div>
            `;
        
  case "select": {
    const optionsHTML = item.options?.map(opt => 
      `<option value="${escapeHtml(String(opt.value))}" ${value === opt.value ? "selected" : ""}>${escapeHtml(opt.label)}</option>`
    ).join("") || "";
    return `
                <div class="fn__block">
                    <select class="b3-select fn__block" id="setting_${item.key}">
                        ${optionsHTML}
                    </select>
                </div>
            `;
  }
        
  case "button":
    return `
                <div class="fn__block">
                    <button class="b3-button b3-button--outline fn__flex-center fn__size200" 
                            id="setting_${item.key}">
                        ${item.buttonText || "按钮"}
                    </button>
                </div>
            `;
        
  case "textWithSwitch": {
    const textKey = `${item.key}_text`;
    const switchKey = `${item.key}_switch`;
    // value 可能是对象 { text: string, switch: boolean } 或 undefined
    const configValue = value && typeof value === "object" ? value : (item.defaultValue || { text: "", switch: false });
    const textValue = configValue.text !== undefined ? escapeHtml(String(configValue.text)) : "";
    const switchValue = configValue.switch === true;
    return `
                <div class="fn__flex fn__flex-center" style="gap: 8px;">
                    <input class="b3-text-field fn__flex-1" 
                           id="setting_${textKey}" 
                           placeholder="${item.placeholder || ""}" 
                           value="${textValue}">
                    <input type="checkbox" class="b3-switch" 
                           id="setting_${switchKey}" 
                           ${switchValue ? "checked" : ""}>
                </div>
            `;
  }
        
  case "header":
    return `
                <div class="b3-label">
                    <div class="fn__flex b3-label__text">
                        <div class="fn__flex-1">${escapeHtml(item.title)}</div>
                    </div>
                    ${item.description ? `<div class="b3-label__text">${escapeHtml(item.description)}</div>` : ""}
                    <div class="fn__hr"></div>
                </div>
            `;
        
  default:
    return "";
  }
}

/**
 * 生成设置 Tab 的 HTML
 */
function generateTabHTML(tab: SettingTab, currentTab: string, settingData: Record<string, any>): string {
  const isActive = tab.name === currentTab;
  const itemsHTML = tab.items.map(item => {
    // header 类型已经在 generateSettingItemHTML 中处理了完整的 HTML
    if (item.type === "header") {
      return generateSettingItemHTML(item, null);
    }
    
    const value = settingData[item.key] !== undefined ? settingData[item.key] : item.defaultValue;
    // checkbox 类型在控件旁边显示描述，其他类型在顶部显示标题和描述
    const isCheckbox = item.type === "checkbox";
    return `
            <div class="b3-label">
                ${!isCheckbox ? `
                <div class="fn__flex b3-label__text">
                    <div class="fn__flex-1">${escapeHtml(item.title)}</div>
                </div>
                ${item.description ? `<div class="b3-label__text">${escapeHtml(item.description)}</div>` : ""}
                <div class="fn__hr"></div>
                ` : `
                <div class="fn__flex b3-label__text">
                    <div class="fn__flex-1">${escapeHtml(item.title)}</div>
                </div>
                ${item.description ? `<div class="b3-label__text">${escapeHtml(item.description)}</div>` : ""}
                <div class="fn__hr"></div>
                `}
                ${generateSettingItemHTML(item, value)}
            </div>
        `;
  }).join("");
    
  return `
        <div class="config__tab-container ${isActive ? "" : "fn__none"}" data-name="${escapeHtml(tab.name)}">
            ${itemsHTML}
        </div>
    `;
}

/**
 * 生成左侧 Tab 列表的 HTML
 */
function generateTabListHTML(currentTab: string): string {
  const tabsHTML = settingTabs.map(tab => {
    const isActive = tab.name === currentTab;
    return `
            <li class="b3-list-item ${isActive ? "b3-list-item--focus" : ""}" data-tab="${escapeHtml(tab.name)}">
                <span class="b3-list-item__text">${escapeHtml(tab.label)}</span>
            </li>
        `;
  }).join("");
    
  return `
        <ul class="b3-tab-bar b3-list b3-list--background">
            ${tabsHTML}
        </ul>
    `;
}

/**
 * 生成完整的设置界面 HTML
 * @param currentTab 当前选中的 Tab 名称
 * @param settingData 设置数据对象
 */
export function generateSettingHTML(currentTab: string, settingData: Record<string, any>): string {
  const tabListHTML = generateTabListHTML(currentTab);
  const tabsContentHTML = settingTabs.map(tab => generateTabHTML(tab, currentTab, settingData)).join("");
    
  return `
<div class="fn__flex-1 fn__flex config__panel">
    <!-- 左侧：分组列表 -->
    ${tabListHTML}
    
    <!-- 右侧：设置内容区域 -->
    <div class="config__tab-wrap fn__flex-1" style="border-radius:0 0 var(--b3-border-radius-b) 0">
        ${tabsContentHTML}
    </div>
</div>
    `;
}

/**
 * 绑定设置项的事件监听器
 * @param dialogElement Dialog 元素
 * @param settingData 设置数据对象（会被修改）
 * @param onButtonClick 按钮点击回调函数映射
 * @param onChange 设置项改变时的回调函数
 */
export function bindSettingEvents(
  dialogElement: HTMLElement,
  settingData: Record<string, any>,
  onButtonClick?: Record<string, () => void>,
  onChange?: () => void
): void {
  // 绑定所有设置项的输入事件
  settingTabs.forEach(tab => {
    tab.items.forEach(item => {
      // header 类型不需要绑定事件
      if (item.type === "header") {
        return;
      }
      
      // textWithSwitch 类型需要特殊处理，跳过通用元素查找
      if (item.type === "textWithSwitch") {
        // 处理 textWithSwitch 类型
        const textKey = `${item.key}_text`;
        const switchKey = `${item.key}_switch`;
        
        // 初始化数据结构 - 如果不存在或不是对象，则使用默认值
        if (!settingData[item.key] || typeof settingData[item.key] !== "object" || !("text" in settingData[item.key]) || !("switch" in settingData[item.key])) {
          const defaultValue = item.defaultValue || { text: "", switch: false };
          settingData[item.key] = {
            text: defaultValue.text || "",
            switch: defaultValue.switch || false
          };
        }
        
        // 绑定文本框事件
        const textElement = dialogElement.querySelector(`#setting_${textKey}`) as HTMLInputElement;
        if (textElement) {
          textElement.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            settingData[item.key].text = target.value;
            if (onChange) {
              onChange();
            }
          });
        }
        
        // 绑定开关事件
        const switchElement = dialogElement.querySelector(`#setting_${switchKey}`) as HTMLInputElement;
        if (switchElement) {
          switchElement.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement;
            settingData[item.key].switch = target.checked;
            if (onChange) {
              onChange();
            }
          });
        }
        return;
      }
      
      const element = dialogElement.querySelector(`#setting_${item.key}`) as HTMLElement;
      if (!element) return;
            
      switch (item.type) {
      case "text":
      case "textarea":
        element.addEventListener("input", (e) => {
          const target = e.target as HTMLInputElement | HTMLTextAreaElement;
          settingData[item.key] = target.value;
          if (onChange) {
            onChange();
          }
        });
        break;
        
      case "select":
        element.addEventListener("change", (e) => {
          const target = e.target as HTMLSelectElement;
          settingData[item.key] = target.value;
          if (onChange) {
            onChange();
          }
        });
        break;
                
      case "checkbox":
        element.addEventListener("change", (e) => {
          const target = e.target as HTMLInputElement;
          settingData[item.key] = target.checked;
          if (onChange) {
            onChange();
          }
        });
        break;
                
      case "button":
        element.addEventListener("click", () => {
          if (onButtonClick && onButtonClick[item.key]) {
            onButtonClick[item.key]();
          } else if (item.onClick) {
            item.onClick();
          }
        });
        break;
      }
    });
  });
}

/**
 * 切换 Tab
 * @param dialogElement Dialog 元素
 * @param tabName 要切换到的 Tab 名称
 */
export function switchTab(dialogElement: HTMLElement, tabName: string): void {
  // 更新左侧 Tab 焦点状态
  const tabItems = dialogElement.querySelectorAll(".b3-list-item[data-tab]");
  tabItems.forEach((item) => {
    if (item.getAttribute("data-tab") === tabName) {
      item.classList.add("b3-list-item--focus");
    } else {
      item.classList.remove("b3-list-item--focus");
    }
  });

  // 显示对应的内容区域
  const tabContainers = dialogElement.querySelectorAll(".config__tab-container");
  tabContainers.forEach((container) => {
    if (container.getAttribute("data-name") === tabName) {
      container.classList.remove("fn__none");
    } else {
      container.classList.add("fn__none");
    }
  });
}

/**
 * 绑定 Tab 切换事件
 * @param dialogElement Dialog 元素
 * @param onTabChange Tab 切换回调函数
 */
export function bindTabSwitchEvents(dialogElement: HTMLElement, onTabChange: (tabName: string) => void): void {
  const tabItems = dialogElement.querySelectorAll(".b3-list-item[data-tab]");
  tabItems.forEach((item) => {
    item.addEventListener("click", () => {
      const tabName = item.getAttribute("data-tab");
      if (tabName) {
        switchTab(dialogElement, tabName);
        onTabChange(tabName);
      }
    });
  });
}

