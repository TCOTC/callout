/**
 * 关于页面模块
 * 负责管理关于页面的配置和功能
 */

import { registerSettingTab } from "./settings";

/**
 * 注册关于页面的设置项
 */
export function registerAboutSettings(): void {
  // 关于页面 Tab
  registerSettingTab({
    name: "关于",
    label: "关于",
    items: [
      {
        key: "about_delete_config",
        title: "删除插件配置文件",
        description: "删除插件的所有配置数据，此操作不可恢复",
        type: "button",
        buttonText: "删除配置"
      }
    ]
  });
}

/**
 * 删除插件配置文件
 * @param plugin 插件实例
 * @param storageName 存储名称
 */
export async function deletePluginConfig(plugin: any, storageName: string): Promise<void> {
  try {
    await plugin.removeData(storageName);
    console.log(`[${plugin.name}] 配置已删除`);
  } catch (e) {
    console.error(`[${plugin.name}] 删除配置失败: `, e);
    throw e;
  }
}

