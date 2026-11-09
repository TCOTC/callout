/**
 * 预览模式事件拦截模块
 * 负责拦截预览元素的 innerHTML 更新并在渲染完成后触发回调
 */

// 回调函数引用
let onPreviewRendered: ((element: Element) => void) | null = null;

/**
 * 设置预览内容渲染完成的回调
 * @param callback 预览内容渲染完成时的回调函数
 */
export function setPreviewRenderedCallback(callback: (element: Element) => void): void {
  onPreviewRendered = callback;
}

/**
 * 立即拦截指定元素的 innerHTML
 * @param element 要拦截的预览元素
 */
export function interceptElementInnerHTML(element: Element): void {
  if ((element as any).__jcco_intercepted) {
    return;
  }

  (element as any).__jcco_intercepted = true;

  // 拦截 innerHTML setter
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    Element.prototype,
    "innerHTML"
  );

  if (!originalDescriptor || !originalDescriptor.set || !originalDescriptor.get) {
    return;
  }

  Object.defineProperty(element, "innerHTML", {
    set: function (value: string) {
      // 先执行原始的 setter，设置 innerHTML
      originalDescriptor.set.call(this, value);

      // 只有在有回调的情况下，才检查是否是预览元素
      if (onPreviewRendered && this.classList.contains("b3-typography")) {
        // 检测到 innerHTML 被设置，说明预览内容重新渲染了
        // 注意：每次 innerHTML 设置都会完全替换 DOM，所以不需要标记来避免重复处理
        console.log("[Callout Plugin] Preview content re-rendered (innerHTML set):", this);
        
        // 立即同步触发回调，替换标题
        onPreviewRendered(this);
      }
    },
    get: function () {
      return originalDescriptor.get.call(this) || "";
    },
    configurable: true
  });
}

/**
 * 移除回调
 */
export function removePreviewRenderedCallback(): void {
  onPreviewRendered = null;
}

