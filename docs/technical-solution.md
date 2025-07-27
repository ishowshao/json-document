# JSON Document - 技术方案

## 1. 概述

本文档阐述了构建 JSON Document 系统的技术方案。这是一个完全基于 Vue 3 生态系统构建的前端应用。其目标是为 JSON 数据创建一个动态的、由模式驱动的渲染器，并支持丰富的内联编辑功能。

## 2. 技术栈

*   **框架**: [Vue 3](https://vuejs.org/) (使用组合式 API)
*   **状态管理**: [Pinia](https://pinia.vuejs.org/) 用于对 JSON 文档进行集中式、响应式的状态管理。
*   **数据查询**: [JSONPath](https://datatracker.ietf.org/doc/html/rfc9535) 将用于在 Presentation Schema 中定义规则，以声明式地选取 JSON 数据中的节点。
*   **数据变更**: [JSON Patch (RFC 6902)](https://tools.ietf.org/html/rfc6902) 及其库实现（如 [fast-json-patch](https://github.com/Starcounter-Jack/JSON-Patch)）将用于生成对文档的原子化更新。

## 3. 架构设计

本架构围绕数据、展现规则和渲染视图分离的核心理念进行设计。它将由以下几个关键部分组成：

![架构图](https://fake-image.com/architecture.png) <!-- 未来图表的占位符 -->

### 3.1. 核心组件

*   **`JsonDocument.vue` (总调度器)**
    *   **职责**: 最外层的容器组件。
    *   **输入**: 接收源 `json-data` 对象和 `presentation-schema` 对象作为 props。
    *   **功能**:
        *   使用 `json-data` 初始化一个 Pinia store。
        *   将数据和 schema 向下传递给渲染器。
        *   监听编辑事件，并向 store 分发 action。

*   **`NodeRenderer.vue` (递归渲染器)**
    *   **职责**: 根据 Presentation Schema 递归地遍历 JSON 数据，并渲染出对应的 HTML 元素。
    *   **输入**: 指向 JSON 对象内部的 `path` (JSON Pointer 路径，例如 `/paragraphs/0/title`) 和 `schema` (模式)。
    *   **功能**:
        *   遍历 schema 中的所有规则，使用节点的 JSON Pointer 路径去匹配规则中定义的 JSONPath 表达式，从而找到对应的渲染规则。
        *   渲染出合适的 HTML 标签。
        *   如果当前数据是一个对象或数组，它会为每个子属性/子项递归调用自身。
        *   如果数据是一个叶子节点 (字符串、数字)，它会渲染 `EditableField` 组件。

*   **`EditableField.vue` (内联编辑器)**
    *   **职责**: 管理单个值的编辑交互。
    *   **输入**: 要显示的 `value` (值)，指向该值的 `path` (路径)，以及从 schema 中获取的具体 `editor-config` (编辑器配置)。
    *   **功能**:
        *   以纯文本形式显示值。
        *   `hover` (悬浮) 时，显示一个视觉提示 (例如边框)。
        *   `click` (点击) 时，根据 `editor-config` 动态挂载正确的编辑组件 (例如 `<input>`, `textarea`, `ImageUploader.vue`)。
        *   `blur` (失焦) 或按下 `Enter` 键时，触发一个 `update` 事件，该事件包含一个针对其路径和新值的 [JSON Patch](https://tools.ietf.org/html/rfc6902) `replace` 操作。

### 3.2. 状态管理 (Pinia)

Pinia store 将作为 JSON 文档的唯一事实来源 (Single Source of Truth)。

*   **State (状态)**: `document: { ... }` - JSON 对象的当前状态。
*   **Actions (操作)**:
    *   `setDocument(newDocument)`: 用于加载一份新文档。
    *   `applyPatch(patch)`: 接收一个 JSON Patch 对象并将其应用到 `document` 状态上。这是唯一的变更机制，确保了状态变更的可预测性。

### 3.3. 数据流

1.  **渲染流**: `JsonDocument.vue` -> `NodeRenderer.vue` 递归渲染节点 -> `EditableField.vue` 渲染叶子节点的值。
2.  **编辑流**:
    1.  用户点击一个 `EditableField`。
    2.  该字段进入激活的编辑状态。
    3.  用户完成编辑。
    4.  `EditableField` 创建一个 JSON Patch 对象 (例如 `{ op: 'replace', path: '/title', value: 'New Title' }`)。
    5.  该 patch 被逐级向上传递到 `JsonDocument.vue`。
    6.  `JsonDocument.vue` 调用 Pinia store 的 `applyPatch` action。
    7.  Pinia 更新状态。由于系统是响应式的，变更后的值会自动反映在视图上。

## 4. 展现模式 (Presentation Schema) 设计

Presentation Schema 是一个 JSON 对象，它定义了数据与其表现形式之间的映射关系。它由一系列规则组成，这些规则的键是 [JSONPath](https://datatracker.ietf.org/doc/html/rfc9535) 表达式，用于从数据中选取目标节点。

**示例 Schema 结构:**

```json
{
  "rules": {
    "$.title": {
      "tag": "h1",
      "editor": "input"
    },
    "$.authors[*]": {
      "tag": "li",
      "editor": "input"
    },
    "$.paragraphs[*]": {
      "tag": "section"
    },
    "$.paragraphs[*].title": {
        "tag": "h2",
        "editor": "input"
    },
    "$.paragraphs[*].description": {
        "tag": "p",
        "editor": "textarea"
    },
    "$.paragraphs[*].imageUrl": {
        "tag": "img",
        "useValueAs": "src",
        "editor": "image-uploader"
    }
  },
  "layout": {
      "/authors": {
          "tag": "ul",
          "static": {
              "before": [{ "tag": "h2", "content": "作者" }]
          }
      }
  }
}
```

*   **`rules`**: 一个对象，其键是 JSONPath 表达式。
    *   `tag`: 要为匹配到的每个节点渲染的 HTML 标签。
    *   `editor`: 一个用于映射到已注册的编辑器组件的键。
    *   `useValueAs`: 对于像 `<img>` 这样的标签，指定用节点的值去填充哪个属性 (例如 `src`)。
*   **`layout`**: 定义非节点本身（如容器、静态内容）的布局和结构。其键是标准的 JSON Pointer。
    *   `tag`: 为该路径下的内容创建一个容器标签 (例如为 `authors` 数组创建一个 `<ul>`)。
    *   `static`: 定义在给定路径的 `before` (之前) 或 `after` (之后) 注入的静态内容。 