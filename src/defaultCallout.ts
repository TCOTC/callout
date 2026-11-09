/**
 * 原生 Callout 功能模块
 * 负责管理原生 Callout 的配置和功能
 */

import { registerSettingTab } from "./settings";

// 样式元素 ID 常量
const STYLE_ID = "snippetCSS-plugin-callout-title-styles";

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
        }`
      );
      
      // 覆盖斜杠菜单中的标题
      cssRules.push(`
        .hint--menu button[data-id="${type.slashMenuId}"] .b3-list-item__text span {
          color: transparent !important;
        }
        .hint--menu button[data-id="${type.slashMenuId}"] .b3-list-item__text span::before {
          content: "${escapedTitle}";
          color: ${type.colorVar};
        }`
      );
      
      // 覆盖提示选择菜单中的标题
      // 菜单项顺序：Note(1), Tip(2), Important(3), Warning(4), Caution(5)
      const menuItemIndex = CALLOUT_TYPES.findIndex(t => t.subtype === type.subtype) + 1;
      // TODO 改为 Constants.MENU_CALLOUT_SELECT
      cssRules.push(`
        [data-name="callout-select"] .b3-menu__items > .b3-menu__item:nth-of-type(${menuItemIndex}) .b3-menu__label > span {
          color: transparent !important;
        }
        [data-name="callout-select"] .b3-menu__items > .b3-menu__item:nth-of-type(${menuItemIndex}) .b3-menu__label > span::before {
          content: "${escapedTitle}";
          color: ${type.colorVar};
        }`
      );
    }
  });
  
  const css = cssRules.join("\n") + "\n";
  // 去掉每行开头的 8 个空格（由代码缩进导致）
  return css.replaceAll(/^ {8}/gm, "");
}

/**
 * 应用 Callout 标题样式
 * @param settingData 设置数据
 * @returns 样式元素 ID
 */
export function applyCalloutTitleStyles(settingData: Record<string, any>): string {
  let styleElement = document.getElementById(STYLE_ID) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = STYLE_ID;
    document.head.appendChild(styleElement);
  }
  
  const css = generateCalloutTitleCSS(settingData);
  styleElement.textContent = css;
  
  return STYLE_ID;
}

/**
 * 移除 Callout 标题样式
 */
export function removeCalloutTitleStyles(): void {
  const styleElement = document.getElementById(STYLE_ID);
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * 在预览模式下替换 Callout 标题文本
 * @param previewElement 预览元素
 * @param settingData 设置数据
 */
export function replaceCalloutTitleInPreview(
  previewElement: Element,
  settingData: Record<string, any>
): void {
  // 检查是否是预览元素（类名为 b3-typography）
  if (!previewElement || !previewElement.classList.contains("b3-typography")) {
    return;
  }

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
      // 查找所有匹配的 Callout 块（blockquote[data-type="callout"][data-subtype]）
      const calloutBlocks = previewElement.querySelectorAll(
        `blockquote[data-type="callout"][data-subtype="${type.subtype}"]`
      );

      calloutBlocks.forEach((calloutBlock: Element) => {
        // 获取第一个 <p> 标签（包含标题）
        const firstParagraph = calloutBlock.querySelector("p:first-of-type");
        if (!firstParagraph) {
          return;
        }

        // 获取原始文本内容（去除首尾空白和换行符）
        const originalText = (firstParagraph.textContent || "").trim().replace(/\s+/g, " ");
        const originalHTML = firstParagraph.innerHTML;

        // 检查是否精确匹配默认标题
        // 默认标题可能带有 emoji 前缀（如 "✏️ Note"），需要精确匹配
        // 注意：原生 Callout 的默认标题是固定的英文，只匹配英文标题
        const defaultTitle = type.defaultTitle;

        // 检查是否精确匹配默认标题
        // 匹配规则：
        // 1. 可选的前导空白和 emoji（如 "✏️ "）
        // 2. 精确的默认标题（不能是 "Note1"、"Note book" 等）
        // 3. 可选的尾随空白
        const isExactMatch = (text: string, defaultTitleText: string): boolean => {
          const trimmedText = text.trim();
          const trimmedTitle = defaultTitleText.trim();
          
          // 方法1：使用更简单的方法 - 检查文本是否以默认标题结尾（前面可能有 emoji 和空格）
          // 检查是否以默认标题结尾（区分大小写，原生 Callout 使用首字母大写格式）
          if (trimmedText.endsWith(trimmedTitle)) {
            // 获取标题前的部分
            const beforeTitle = trimmedText.slice(0, -trimmedTitle.length).trim();
            
            // 如果 beforeTitle 为空，说明文本就是标题本身（没有 emoji 前缀）
            if (beforeTitle === "") {
              // 检查文本是否就是标题本身（精确匹配，区分大小写）
              if (trimmedText === trimmedTitle) {
                console.log(`[Callout Plugin] isExactMatch (exact): true`, {
                  text,
                  defaultTitleText
                });
                return true;
              }
              return false;
            }
            
            // 如果标题前有内容，检查是否只包含 emoji 和空格
            // 重要：不能包含字母、数字、中文或其他可见字符
            // 先检查是否包含不允许的字符
            const hasInvalidChars = /[a-zA-Z0-9\u4e00-\u9fa5\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(beforeTitle);
            
            if (hasInvalidChars) {
              // 包含不允许的字符，不是精确匹配
              console.log(`[Callout Plugin] isExactMatch (endsWith): false - has invalid chars`, {
                text,
                defaultTitleText,
                beforeTitle
              });
              return false;
            }
            
            // 检查是否只包含 emoji、变体选择器、零宽连接符和空格
            const beforeTitlePattern = /^[\p{Emoji}\uFE0F\u200D\s\u00A0]*$/iu;
            
            if (beforeTitlePattern.test(beforeTitle)) {
              console.log(`[Callout Plugin] isExactMatch (endsWith): true`, {
                text,
                defaultTitleText,
                beforeTitle
              });
              return true;
            }
          }
          
          // 方法2：直接使用正则表达式匹配（备用方法，区分大小写）
          const directMatchPattern = new RegExp(
            `^[\\p{Emoji}\\uFE0F\\u200D\\s\\u00A0]*${escapeRegExp(defaultTitleText)}\\s*$`,
            "u"
          );
          
          if (directMatchPattern.test(text)) {
            console.log(`[Callout Plugin] isExactMatch (direct): true`, {
              text,
              defaultTitleText
            });
            return true;
          }
          
          // 方法3：移除 emoji 后匹配
          // 移除前导的 emoji（包括变体选择器）和空白
          let textWithoutEmoji = text
            .replace(/^[\p{Emoji}\uFE0F\u200D\s\u00A0]+/u, "")
            .trim();
          
          // 如果移除后文本没有变化，说明没有 emoji，直接匹配
          if (textWithoutEmoji === text.trim()) {
            textWithoutEmoji = text.trim();
          } else {
            // 再次清理：移除可能残留的变体选择器和空白
            textWithoutEmoji = textWithoutEmoji.replace(/^[\uFE0F\s\u00A0]+/u, "").trim();
          }
          
          // 检查是否精确匹配默认标题（区分大小写，原生 Callout 使用首字母大写格式）
          // 重要：必须完全匹配，不能是部分匹配
          const exactMatchPattern = new RegExp(`^${escapeRegExp(defaultTitleText)}$`);
          const result = exactMatchPattern.test(textWithoutEmoji);
          
          // 调试日志
          console.log(`[Callout Plugin] isExactMatch (method3):`, {
            text,
            defaultTitleText,
            textWithoutEmoji,
            result
          });
          
          return result;
        };

        // 检查是否匹配英文默认标题（原生 Callout 的默认标题是固定的英文）
        const matchesDefaultTitle = isExactMatch(originalText, defaultTitle);

        // 调试日志（开发时使用）
        console.log(`[Callout Plugin] Checking ${type.subtype}:`, {
          originalText,
          originalHTML,
          defaultTitle,
          matchesDefaultTitle,
          enabled,
          title
        });

        if (matchesDefaultTitle) {
          // 确定要替换的原始标题文本（只匹配英文默认标题）
          const originalTitleText = defaultTitle;

          if (originalTitleText) {
            // 由于 isExactMatch 已经确认是精确匹配，我们可以安全地替换
            // 但为了确保只替换完整的标题（不替换部分匹配），我们需要更精确的匹配
            
            // 在 HTML 中查找并替换默认标题
            // 匹配模式：前面是 emoji/空格/换行符/开头，后面是空格/换行符/结束
            // 使用非贪婪匹配前缀，确保只匹配到第一个完整的标题
            let newHTML = originalHTML;
            
            // 构建匹配模式：确保前面是 emoji/空格/换行符或开头，后面是空格/换行符或结束
            // 对于英文标题，使用单词边界；对于中文标题，使用前后字符检查
            let titlePattern: RegExp;
            
            // 检查是否是英文标题（只包含字母）
            if (/^[a-zA-Z]+$/.test(originalTitleText)) {
              // 英文标题：使用单词边界确保精确匹配
              titlePattern = new RegExp(
                `([\\p{Emoji}\\uFE0F\\u200D\\s\\u00A0\\n]*?)\\b${escapeRegExp(originalTitleText)}\\b([\\s\\n]*|$)`,
                "iu"
              );
            } else {
              // 中文标题或其他：使用前后字符检查
              titlePattern = new RegExp(
                `([\\p{Emoji}\\uFE0F\\u200D\\s\\u00A0\\n]*?)(?<!\\S)${escapeRegExp(originalTitleText)}(?!\\S)([\\s\\n]*|$)`,
                "iu"
              );
            }
            
            // 检查是否匹配（确保是精确匹配，不是部分匹配）
            const match = newHTML.match(titlePattern);
            if (match) {
              // 提取匹配的前缀（emoji 和空格）
              const prefix = match[1] || "";
              const suffix = match[2] || "";
              
              // 替换：前缀 + 新标题 + 后缀
              newHTML = newHTML.replace(titlePattern, prefix + title + suffix);
              
              // 设置新的 HTML 内容（保留完整的 emoji 格式）
              firstParagraph.innerHTML = newHTML;
              
              console.log(`[Callout Plugin] Replaced ${type.subtype} title:`, {
                originalText,
                originalHTML,
                originalTitleText,
                newHTML,
                prefix,
                suffix
              });
            } else {
              console.log(`[Callout Plugin] Failed to match pattern for ${type.subtype}:`, {
                originalHTML,
                originalTitleText
              });
            }
          }
        }
      });
    }
  });
}

/**
 * 转义正则表达式特殊字符
 * @param str 要转义的字符串
 * @returns 转义后的字符串
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

