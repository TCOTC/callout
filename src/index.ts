import {
  Plugin,
  Dialog,
  getFrontend,
  Setting,
  fetchPost
} from "siyuan";
import "./index.scss";
import {
  registerSettingTab,
  generateSettingHTML,
  bindSettingEvents,
  bindTabSwitchEvents,
  getSettingTabs
} from "./settings";

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
    }).catch((e) => {
      console.log(`[${this.name}] load data [${STORAGE_NAME}] fail: `, e);
      this.settingData = this.getDefaultSettingData();
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
    // 基础设置 Tab
    registerSettingTab({
      name: "基础设置",
      label: "基础设置",
      items: [
        {
          key: "basicSetting",
          title: "基础设置项",
          description: "这是基础设置的描述信息",
          type: "text",
          defaultValue: "",
          placeholder: "请输入基础设置值"
        }
      ]
    });

    // 高级设置 Tab
    registerSettingTab({
      name: "高级设置",
      label: "高级设置",
      items: [
        {
          key: "advancedSetting",
          title: "高级设置项",
          description: "这是高级设置的描述信息",
          type: "checkbox",
          defaultValue: false
        }
      ]
    });

    // 自定义设置 Tab
    registerSettingTab({
      name: "自定义设置",
      label: "自定义设置",
      items: [
        {
          key: "customSetting",
          title: "自定义设置项",
          description: "这是自定义设置的描述信息",
          type: "textarea",
          defaultValue: "",
          placeholder: "请输入自定义设置值",
          rows: 5
        }
      ]
    });
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
    bindSettingEvents(dialogElement, this.settingData);
  }

  // onDataChanged() {
  // }
}
