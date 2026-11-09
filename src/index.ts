import {
  Plugin,
  Dialog,
  getFrontend,
  Setting,
  fetchPost,
  showMessage
} from "siyuan";
import "./index.scss";
import {
  registerSettingTab,
  generateSettingHTML,
  bindSettingEvents,
  bindTabSwitchEvents,
  getSettingTabs
} from "./settings";
import {
  registerDefaultCalloutSettings,
  applyCalloutTitleStyles,
  removeCalloutTitleStyles,
  replaceCalloutTitleInPreview
} from "./defaultCallout";
import { registerAboutSettings, deletePluginConfig } from "./about";
import {
  setPreviewRenderedCallback,
  removePreviewRenderedCallback,
  interceptElementInnerHTML
} from "./previewEvent";

const STORAGE_NAME = "callout-config";

export default class PluginCallout extends Plugin {
  private isMobile: boolean;
  private currentTab: string = "";
  private dialog: Dialog;
  private settingData: Record<string, any> = {};
  public setting: Setting;

  onload() {
    console.log(this.displayName, this.i18n.pluginOnload);
        
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        
    // 注册设置项
    this.registerSettings();
        
    // 初始化当前 Tab（使用第一个注册的 Tab）
    const tabs = getSettingTabs();
    if (tabs.length > 0) {
      this.currentTab = tabs[0].name;
    }
        
    // 加载配置数据
    this.loadData(STORAGE_NAME).then((data) => {
      if (data) {
        this.settingData = data;
      } else {
        // 初始化默认配置
        this.settingData = this.getDefaultSettingData();
      }
      // 应用 Callout 标题样式
      this.applyCalloutStyles();
      // 设置预览模式事件监听
      this.setupPreviewEventListener();
    }).catch((e) => {
      console.log(`[${this.name}] load data [${STORAGE_NAME}] fail: `, e);
      this.settingData = this.getDefaultSettingData();
      // 应用 Callout 标题样式
      this.applyCalloutStyles();
      // 设置预览模式事件监听
      this.setupPreviewEventListener();
    });

    // 初始化设置面板
    this.setting = new Setting({
      confirmCallback: () => {
        // 保存配置
        this.saveData(STORAGE_NAME, this.settingData).catch((e) => {
          console.error(`[${this.name}] save data [${STORAGE_NAME}] fail: `, e);
        });
      }
    });

    // 添加打开设置菜单的按钮
    const openSettingBtn = document.createElement("button");
    openSettingBtn.className = "b3-button b3-button--outline fn__flex-center fn__size200";
    openSettingBtn.textContent = "打开设置";
    openSettingBtn.addEventListener("click", () => {
      this.openSetting();
    });

    this.setting.addItem({
      title: "插件设置",
      description: "打开插件的详细设置菜单",
      actionElement: openSettingBtn
    });
  }

  /**
     * 注册设置项
     */
  private registerSettings(): void {
    // 优先注册原生 Callout 设置
    registerDefaultCalloutSettings();

    // 注册关于页面设置
    registerAboutSettings();
  }

  /**
     * 获取默认设置数据
     */
  private getDefaultSettingData(): Record<string, any> {
    const defaultData: Record<string, any> = {};
    const tabs = getSettingTabs();
        
    tabs.forEach(tab => {
      tab.items.forEach(item => {
        if (item.defaultValue !== undefined) {
          defaultData[item.key] = item.defaultValue;
        }
      });
    });
        
    return defaultData;
  }

  onLayoutReady() {
    // TODO: 移除 - 开发时临时使用的刷新按钮
    this.addTopBar({
      icon: "iconRefresh",
      title: "刷新界面",
      position: "right",
      callback: () => {
        fetchPost("/api/system/reloadUI", {}, () => {
          // 刷新成功
        });
      }
    });

    // TODO: 移除 - 开发时临时使用的配置菜单按钮
    this.addTopBar({
      icon: "iconSettings",
      title: "打开配置菜单",
      position: "right",
      callback: () => {
        this.openSetting();
      }
    });
  }

  onunload() {
    console.log(this.displayName, this.i18n.pluginOnunload);
    // 移除 Callout 标题样式
    removeCalloutTitleStyles();
    // 移除预览模式事件监听
    this.removePreviewEventListener();
  }

  uninstall() {
    console.log(this.displayName, this.i18n.pluginUninstall);
  }

  // 打开设置菜单
  openSetting(): void {
    this.dialog = new Dialog({
      title: this.displayName,
      content: generateSettingHTML(this.currentTab, this.settingData),
      width: this.isMobile ? "92vw" : "800px",
      height: "600px",
      destroyCallback: () => {
        // 保存配置
        this.saveData(STORAGE_NAME, this.settingData).catch((e) => {
          console.error(`[${this.name}] save data [${STORAGE_NAME}] fail: `, e);
        });
        // 应用更新后的 Callout 标题样式
        this.applyCalloutStyles();
        // 更新预览模式中的标题（如果预览窗口已打开）
        this.updatePreviewTitles();
      }
    });

    // 绑定事件
    this.bindSettingEvents();
  }

  // 绑定设置界面事件
  private bindSettingEvents(): void {
    if (!this.dialog || !this.dialog.element) {
      return;
    }
        
    const dialogElement = this.dialog.element;
        
    // 绑定 Tab 切换事件
    bindTabSwitchEvents(dialogElement, (tabName: string) => {
      this.currentTab = tabName;
    });

    // 绑定设置项输入事件
    bindSettingEvents(
      dialogElement,
      this.settingData,
      {
        about_delete_config: () => {
          this.handleDeleteConfig();
        }
      },
      () => {
        // 配置改变时实时更新样式
        this.applyCalloutStyles();
        // 更新预览模式中的标题（如果预览窗口已打开）
        this.updatePreviewTitles();
      }
    );
  }

  /**
   * 处理删除配置
   */
  private async handleDeleteConfig(): Promise<void> {
    const confirmDialog = new Dialog({
      title: "删除配置",
      content: `<div class="b3-dialog__content">
        <div class="b3-label">
          <div class="b3-label__text">确定要删除所有配置数据吗？此操作不可恢复。</div>
        </div>
      </div>
      <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel">取消</button>
        <div class="fn__space"></div>
        <button class="b3-button b3-button--text">确定</button>
      </div>`,
      width: this.isMobile ? "92vw" : "400px"
    });

    const btnElements = confirmDialog.element.querySelectorAll(".b3-button");
    btnElements[0].addEventListener("click", () => {
      confirmDialog.destroy();
    });

    btnElements[1].addEventListener("click", async () => {
      confirmDialog.destroy();
      try {
        await deletePluginConfig(this, STORAGE_NAME);
        // 先移除所有样式
        removeCalloutTitleStyles();
        // 重置配置数据为默认值（创建新对象，确保完全重置）
        this.settingData = this.getDefaultSettingData();
        // 确保所有 textWithSwitch 类型的配置都是关闭状态
        const tabs = getSettingTabs();
        tabs.forEach(tab => {
          tab.items.forEach(item => {
            if (item.type === "textWithSwitch" && this.settingData[item.key]) {
              this.settingData[item.key].switch = false;
            }
          });
        });
        // 重新应用样式（使用默认配置，应该不会生成任何样式）
        this.applyCalloutStyles();
        // 刷新设置界面 - 重新生成整个 Dialog 内容
        if (this.dialog && this.dialog.element) {
          const dialogBody = this.dialog.element.querySelector(".b3-dialog__body");
          if (dialogBody) {
            // 清空并重新生成内容
            dialogBody.innerHTML = generateSettingHTML(this.currentTab, this.settingData);
            // 重新绑定事件，确保事件处理函数使用最新的 settingData
            this.bindSettingEvents();
          }
        }
        // 显示成功消息
        showMessage("配置已删除");
      } catch (e) {
        console.error(`[${this.name}] 删除配置失败: `, e);
        showMessage("删除配置失败，请查看控制台", 0, "error");
      }
    });
  }

  /**
   * 应用 Callout 标题样式
   */
  private applyCalloutStyles(): void {
    applyCalloutTitleStyles(this.settingData);
  }

  /**
   * 设置预览模式事件监听
   */
  private setupPreviewEventListener(): void {
    // 设置预览内容渲染完成的回调
    const handlePreviewRendered = (previewElement: Element) => {
      console.log("[Callout Plugin] Preview content rendered:", previewElement);
      // 替换预览模式下的 Callout 标题
      replaceCalloutTitleInPreview(previewElement, this.settingData);
    };

    setPreviewRenderedCallback(handlePreviewRendered);

    // 保存回调函数引用
    (this as any).__previewRenderedHandler = handlePreviewRendered;

    // 监听思源笔记的 switch-protyle-mode 事件（切换到预览模式时触发）
    const handleSwitchMode = (event: CustomEvent<{ protyle: any }>) => {
      console.log("[Callout Plugin] switch-protyle-mode:", event);
      const protyle = event.detail?.protyle;
      if (!protyle) {
        return;
      }

      // 检查是否切换到预览模式
      const isPreviewMode = !protyle.preview.element.classList.contains("fn__none");
      
      if (isPreviewMode) {
        console.log("[Callout Plugin] Switched to preview mode:", protyle);
        
        // 立即拦截预览元素的 innerHTML（如果元素已存在）
        const previewElement = protyle.preview.previewElement;
        if (previewElement && previewElement.classList.contains("b3-typography")) {
          interceptElementInnerHTML(previewElement);
        }
        
        // 预览内容渲染是异步的，会在 protyle.options.preview.delay 后开始
        // 等待内容渲染完成后，innerHTML 拦截器会自动触发回调
      }
    };

    this.eventBus.on("switch-protyle-mode", handleSwitchMode);

    // 保存事件处理函数引用，以便后续移除
    (this as any).__switchModeHandler = handleSwitchMode;

    // 处理已存在的预览内容（如果预览窗口已经打开）
    // 设置拦截器并立即处理已存在的内容
    document.querySelectorAll(".b3-typography").forEach((previewElement) => {
      console.log("[Callout Plugin] Processing existing preview element:", previewElement);
      interceptElementInnerHTML(previewElement);
      replaceCalloutTitleInPreview(previewElement, this.settingData);
    });
  }

  /**
   * 移除预览模式事件监听
   */
  private removePreviewEventListener(): void {
    // 移除 switch-protyle-mode 事件监听器
    const switchModeHandler = (this as any).__switchModeHandler;
    if (switchModeHandler && this.eventBus) {
      this.eventBus.off("switch-protyle-mode", switchModeHandler);
      delete (this as any).__switchModeHandler;
    }

    // 移除回调
    removePreviewRenderedCallback();
  }

  /**
   * 更新预览模式中的标题
   */
  private updatePreviewTitles(): void {
    // 查找所有预览元素并更新标题
    document.querySelectorAll(".b3-typography").forEach((previewElement) => {
      replaceCalloutTitleInPreview(previewElement, this.settingData);
    });
  }

  // onDataChanged() {
  // }
}
