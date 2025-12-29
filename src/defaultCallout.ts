/**
 * 原生 Callout 功能模块
 * 负责管理原生 Callout 的配置和功能
 */

import { registerSettingTab } from "./settings";

// Callout 类型定义
export interface CalloutTypeConfig {
  subtype: string;
  label: string;
  defaultTitle: string;
  defaultTitleZh: string;
  colorVar: string; // CSS 变量名
  slashMenuId: string; // 斜杠菜单中的 ID
}

// 原生 Callout 类型配置
export const CALLOUT_TYPES: CalloutTypeConfig[] = [
  { subtype: "NOTE", label: "Note", defaultTitle: "Note", defaultTitleZh: "注意", colorVar: "var(--b3-callout-note)", slashMenuId: "calloutNote" },
  { subtype: "TIP", label: "Tip", defaultTitle: "Tip", defaultTitleZh: "提示", colorVar: "var(--b3-callout-tip)", slashMenuId: "calloutTip" },
  { subtype: "IMPORTANT", label: "Important", defaultTitle: "Important", defaultTitleZh: "重要", colorVar: "var(--b3-callout-important)", slashMenuId: "calloutImportant" },
  { subtype: "WARNING", label: "Warning", defaultTitle: "Warning", defaultTitleZh: "警告", colorVar: "var(--b3-callout-warning)", slashMenuId: "calloutWarning" },
  { subtype: "CAUTION", label: "Caution", defaultTitle: "Caution", defaultTitleZh: "谨慎", colorVar: "var(--b3-callout-caution)", slashMenuId: "calloutCaution" }
];

/**
 * 注册原生 Callout 相关的设置项
 */
export function registerDefaultCalloutSettings(): void {
  const items: any[] = [];
  
  // 在开头添加标题和描述
  items.push({
    key: "callout_header",
    title: "原生 Callout 固定标题文本",
    description: "注意，固定标题文本会覆盖自定义标题",
    type: "header"
  });
  
  // 为每个 Callout 类型添加配置项
  CALLOUT_TYPES.forEach(type => {
    items.push({
      key: `callout_${type.subtype}`,
      title: type.label,
      type: "textWithSwitch",
      defaultValue: {
        text: type.defaultTitleZh,
        switch: false
      },
      placeholder: `请输入 ${type.label} 的标题文本`
    });
  });
  
  // 原生 Callout 设置 Tab
  registerSettingTab({
    name: "原生 Callout",
    label: "原生 Callout 固定标题文本",
    items: items
  });
}

/**
 * 生成 CSS 样式来覆盖 Callout 标题
 * @param settingData 设置数据
 * @returns CSS 样式字符串
 */
export function generateCalloutTitleCSS(settingData: Record<string, any>): string {
  const cssRules: string[] = [];
  
  CALLOUT_TYPES.forEach(type => {
    const configKey = `callout_${type.subtype}`;
    const config = settingData[configKey];
    
    // 读取配置数据
    let enabled: boolean;
    let title: string;
    
    if (config && typeof config === "object" && "switch" in config) {
      enabled = config.switch === true;
      title = config.text || type.defaultTitleZh;
    } else {
      enabled = false;
      title = type.defaultTitleZh;
    }
    
    if (enabled && title) {
      // 使用 CSS 覆盖标题文本
      // 通过 ::before 伪元素显示新标题，隐藏原文本
      // 转义 CSS content 中的特殊字符
      const escapedTitle = title
        .replace(/\\/g, "\\\\")  // 转义反斜杠
        .replace(/"/g, '\\"')     // 转义双引号
        .replace(/\n/g, " ")      // 替换换行符为空格
        .replace(/\r/g, "");      // 移除回车符
      
      // 覆盖块本身的标题（隐藏原始标题、避免原始标题的宽度超过自定义文本的宽度）
      cssRules.push(`
        .callout[data-subtype="${type.subtype}"] .callout-title {
          color: transparent;
          width: 0;
          line-height: 0;
        }
        .callout[data-subtype="${type.subtype}"] .callout-title::before {
          content: "${escapedTitle}";
          color: ${type.colorVar};
          white-space: nowrap;
        }
      `);
      
      // 覆盖斜杠菜单中的标题
      cssRules.push(`
        .hint--menu button[data-id="${type.slashMenuId}"] .b3-list-item__text span {
          color: transparent !important;
        }
        .hint--menu button[data-id="${type.slashMenuId}"] .b3-list-item__text span::before {
          content: "${escapedTitle}";
          color: ${type.colorVar};
        }
      `);
    }
  });
  
  return cssRules.join("\n");
}

/**
 * 应用 Callout 标题样式
 * @param settingData 设置数据
 * @returns 样式元素 ID
 */
export function applyCalloutTitleStyles(settingData: Record<string, any>): string {
  const styleId = "snippetCSS-callout-title-styles";
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  const css = generateCalloutTitleCSS(settingData);
  styleElement.textContent = css;
  
  return styleId;
}

/**
 * 移除 Callout 标题样式
 */
export function removeCalloutTitleStyles(): void {
  const styleId = "snippetCSS-callout-title-styles";
  const styleElement = document.getElementById(styleId);
  if (styleElement) {
    styleElement.remove();
  }
}

