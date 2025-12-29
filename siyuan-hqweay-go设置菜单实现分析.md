# siyuan-hqweay-go 插件设置菜单实现分析

## 核心实现方式

该插件使用 **Svelte** 框架实现了一个左右布局的设置菜单。

## 主要组件结构

### 1. 主入口 (`index.ts`)

```typescript
openGlobalSetting(): void {
  let dialog = new Dialog({
    title: "设置",
    content: `<div id="hqweay-setting-pannel" style="height: 600px;"></div>`,
    width: "800px",
    destroyCallback: (options) => {
      pannel.$destroy();
    },
  });

  let pannel = new SettingPannel({
    target: dialog.element.querySelector("#hqweay-setting-pannel"),
  });
}
```

### 2. 设置面板组件 (`setting.svelte`)

**核心布局结构：**

```svelte
<div class="fn__flex-1 fn__flex config__panel">
  <!-- 左侧：分组列表 -->
  <ul class="b3-tab-bar b3-list b3-list--background">
    {#each groups as group}
      <li
        class:b3-list-item--focus={group === focusGroup}
        class="b3-list-item"
        on:click={() => { focusGroup = group; }}
      >
        <span class="b3-list-item__text">{group}</span>
      </li>
    {/each}
  </ul>
  
  <!-- 右侧：设置内容区域 -->
  <div class="config__tab-wrap">
    <SettingPanel
      group={focusGroup}
      settingItems={SettingItems[focusGroup]}
      on:changed={onChanged}
      on:click={onClick}
    />
  </div>
</div>
```

**关键样式：**

```scss
.config__panel {
  height: 100%;
}
.config__panel > ul > li {
  padding-left: 1rem;
}
```

## 布局实现原理

1. **使用思源笔记内置的 Flex 布局类：**
   - `fn__flex-1`：占据剩余空间
   - `fn__flex`：启用 Flex 布局（默认横向排列）

2. **左侧列表：**
   - 使用 `b3-tab-bar`、`b3-list`、`b3-list--background` 等思源笔记内置样式
   - 通过 `b3-list-item--focus` 类来标识当前选中的分组

3. **右侧内容区：**
   - `config__tab-wrap` 容器包裹设置面板
   - 根据 `focusGroup` 动态切换显示不同的设置项

## 数据流

1. **初始化：** `initData()` 函数生成动态设置项
2. **分组管理：** 通过 `focusGroup` 变量控制当前显示的分组
3. **事件处理：** 
   - `onChanged`：处理设置项值的变化
   - `onClick`：处理按钮点击等操作

## 关键特点

1. **左右布局：** 左侧是分组导航，右侧是对应的设置内容
2. **动态生成：** 设置项可以根据插件配置动态生成
3. **响应式：** 使用 Svelte 的响应式特性，设置变化时自动更新 UI
4. **复用思源样式：** 大量使用思源笔记内置的 CSS 类，保持界面一致性

## 实现建议

如果要实现类似的左右布局设置菜单，可以：

1. **使用 Dialog + 自定义组件：** 在 `openSetting()` 中创建 Dialog，然后挂载自定义组件
2. **采用 Flex 布局：** 使用 `fn__flex` 等思源内置类实现左右布局
3. **左侧导航：** 使用 `b3-list` 系列样式实现导航列表
4. **右侧内容：** 根据选中的分组动态渲染对应的设置项

## 注意事项

- 该插件使用了 Svelte 框架，如果项目使用 TypeScript + 原生 DOM，需要相应调整
- 样式类 `b3-*` 和 `fn__*` 是思源笔记的内置样式，可以直接使用
- 设置数据的持久化通过 `settings` 对象管理

