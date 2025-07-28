# JSON Document - 技术方案

## 1. 概述

本文档阐述了构建 JSON Document 系统的技术方案。这是一个完全基于 Vue 3 生态系统构建的前端应用。其目标是为 JSON 数据创建一个动态的、由模式驱动的渲染器，并支持丰富的内联编辑功能。

### 1.1. 核心示例

为了更好地理解系统的目标，我们来看一个具体的例子。

**源数据 (JSON):**
```json
{
  "title": "文档系统",
  "authors": [
    "张三 (PM)"
  ],
  "paragraphs": [
    {
      "title": "概述",
      "description": "灵活的文档系统"
    },
    {
      "title": "快速上手",
      "description": "灵活的文档系统"
    }
  ]
}
```

**最终渲染效果 (HTML):**
```html
<article>
    <h1>文档系统</h1>
    <address>
      <h2>作者</h2>
      <ul class="authors">
        <li class="author">张三(PM)</li>
      </ul>
    </address>

  <section id="overview">
    <h2>概述</h2>
    <p>灵活的文档系统</p>
  </section>

  <section id="getting-started">
    <h2>快速上手</h2>
    <p>灵活的文档系统</p>
  </section>
</article>
```

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
    *   **输入**: 接收源 `json-data` 对象、`presentation-schema` 对象、一个用于校验整体数据结构的 `document-schema` (Zod Schema) 以及 `readonly` 布尔值作为 props。
    *   **功能**:
        *   使用 `json-data` 初始化一个 Pinia store。
        *   将数据和 schema 向下传递给渲染器。
        *   监听编辑事件，并向 store 分发 action。
        *   通过 `provide` 向子组件注入 `readonly` 状态，控制是否启用编辑功能。

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
        *   在非只读模式下，`hover` (悬浮) 时显示视觉提示 (例如边框)。
        *   在非只读模式下，`click` (点击) 时根据 `editor-config` 动态挂载正确的编辑组件 (例如 `<input>`, `textarea`)。
        *   `blur` (失焦) 或按下 `Enter` 键时，触发一个 `update` 事件，该事件包含一个针对其路径和新值的 [JSON Patch](https://tools.ietf.org/html/rfc6902) `replace` 操作。
        *   在只读模式下，禁用所有编辑交互和视觉提示。

### 3.2. 状态管理 (Pinia)

Pinia store 将作为 JSON 文档的唯一事实来源 (Single Source of Truth)。

*   **State (状态)**: `document: { ... }` - JSON 对象的当前状态。
*   **Actions (操作)**:
    *   `setDocument(newDocument)`: 用于加载一份新文档。
    *   `applyPatch(patch)`: 接收一个 JSON Patch 对象。这是保证数据结构完整性的核心。它的执行逻辑如下：
        1. 在内存中克隆当前的 `document` state，得到一个临时对象。
        2. 将传入的 `patch` 应用到这个临时对象上。
        3. 使用 `document-schema` (一个完整的 Zod schema) 对**整个临时对象**进行校验。
        4. **只有当**整个临时对象都通过了结构校验，才用它来替换当前的 `document` state。否则，变更将被拒绝，原始 state 保持不变。

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
    *   `validation`: (可选) 一个用于定义数据校验规则的对象，后续会基于它生成 Zod schema。
*   **`layout`**: 定义非节点本身（如容器、静态内容）的布局和结构。其键是标准的 JSON Pointer。
    *   `tag`: 为该路径下的内容创建一个容器标签 (例如为 `authors` 数组创建一个 `<ul>`)。
    *   `static`: 定义在给定路径的 `before` (之前) 或 `after` (之后) 注入的静态内容。

## 5. 核心算法设计

为了更好地指导开发，以下是核心组件的详细算法和逻辑。

### 5.1. `NodeRenderer.vue` (递归渲染器)

该组件是系统的渲染核心，其任务是根据给定的数据路径（`path`）和 schema 决定如何渲染节点。

**Props:**
*   `path`: `String` (必需) - 指向当前节点在JSON文档中的JSON Pointer路径 (例如 `/` 或 `/paragraphs/0/title`)。
*   `schema`: `Object` (必需) - 完整的 `presentation-schema` 对象。

**核心逻辑 (伪代码):**

```js
// setup() or <script setup>

// 1. 从 Store 获取当前路径的数据
const dataNode = store.getNodeByPointer(props.path);

// 2. 查找匹配的渲染规则 (关键)
// 遍历 schema.rules，找到第一个匹配当前节点路径的规则
const matchingRule = findFirst(schema.rules, (rule, jsonPath) => {
  // 使用 JSONPath 库测试节点的 Pointer 是否匹配 JSONPath 表达式
  return jsonPathLibrary.test(store.document, jsonPath, props.path);
});

// 3. 查找匹配的布局规则 (精确匹配)
const layoutRule = schema.layout[props.path];

// 4. 决定最终的 HTML 标签
const renderTag = matchingRule?.tag || layoutRule?.tag || 'div'; // 默认使用 'div'

// template

// 1. 渲染静态内容 (前置)
<template v-for="item in layoutRule?.static?.before">
  <component :is="item.tag">{{ item.content }}</component>
</template>

// 2. 渲染主内容
<component :is="renderTag">
  // 情况 A: 叶子节点 (string, number, boolean)
  <template v-if="isLeaf(dataNode)">
    <EditableField
      :path="props.path"
      :value="dataNode"
      :editor-config="matchingRule?.editor"
    />
  </template>

  // 情况 B: 数组
  <template v-else-if="isArray(dataNode)">
    <NodeRenderer
      v-for="(item, index) in dataNode"
      :key="index"
      :path="`${props.path}/${index}`"
      :schema="props.schema"
    />
  </template>

  // 情况 C: 对象
  <template v-else-if="isObject(dataNode)">
    <NodeRenderer
      v-for="(value, key) in dataNode"
      :key="key"
      :path="`${props.path}/${key}`"
      :schema="props.schema"
    />
  </template>
</component>

// 3. 渲染静态内容 (后置)
<template v-for="item in layoutRule?.static?.after">
  <component :is="item.tag">{{ item.content }}</component>
</template>
```

### 5.2. `EditableField.vue` (内联编辑器)

该组件负责管理单个值的“查看”和“编辑”两种状态的切换。

**Props:**
*   `path`: `String` (必需) - 值的JSON Pointer路径。
*   `value`: `any` (必需) - 要显示的叶子节点值。
*   `editor-config`: `String` (可选) - 定义要使用的编辑器 (如 `'input'`, `'textarea'`)。

**核心逻辑 (伪代码):**

```js
// state
const isEditing = ref(false);
const internalValue = ref(null);

// template
<template v-if="!isEditing">
  <span @click="startEditing" class="editable-region">
    {{ props.value }}
  </span>
</template>
<template v-else>
  <component
    :is="resolveEditorComponent(props.editorConfig)"
    v-model="internalValue"
    @blur="finishEditing"
    @keydown.enter.prevent="finishEditing"
    @keydown.esc="cancelEditing"
  />
</template>

// script
function startEditing() {
  internalValue.value = props.value;
  isEditing.value = true;
  nextTick(() => { /* focus the input */ });
}

function finishEditing() {
  if (internalValue.value !== props.value) {
    const patch = {
      op: 'replace',
      path: props.path,
      value: internalValue.value
    };
    emit('update', patch); // 向上层派发 patch
  }
  isEditing.value = false;
}

function cancelEditing() {
  isEditing.value = false;
}
```

### 5.3. 开发指导
*   **`NodeRenderer.vue` 的关键**: 找到一个能判断 JSON Pointer 是否匹配 JSONPath 表达式的库。
*   **`EditableField.vue` 的关键**: 使用动态组件 `<component :is="...">` 并处理好 `blur` 和键盘事件。
*   **数据流**: 建议使用 Vue 3 的 `provide/inject` 将 `applyPatch` 方法从顶层组件注入，避免多层事件传递。

## 6. 数据校验 (分层校验策略)

为了同时保证优秀的用户体验和绝对的数据安全，系统采用一种分层的校验策略，结合了对**字段值**的即时校验和对**文档结构**的最终校验。

### 6.1. 第一层：字段级校验 (用于 UI 反馈)

*   **目的**: 在用户输入时提供快速、即时的反馈。
*   **机制**: `EditableField.vue` 组件会利用 `presentation-schema` 中定义的 `validation` 规则。
*   **流程**:
    1.  当用户完成编辑时 (`finishEditing`)，组件会根据规则构建一个临时的 Zod schema 来校验**当前输入的值**。
    2.  如果校验失败（例如，email 字段格式错误），组件会立刻显示错误信息，并阻止生成 `patch` 指令。这确保了无效的**值**不会被提交。

**`presentation-schema` 中的字段校验定义示例:**
```json
{
  "$.paragraphs[*].title": {
    "tag": "h2",
    "editor": "input",
    "validation": { // 用于字段级校验
        "type": "string",
        "min": 3,
        "errorMessage": "标题至少需要3个字符。"
    }
  }
}
```

### 6.2. 第二层：文档级校验 (用于数据完整性)

*   **目的**: 保证任何变更（增、删、改）都不会破坏整个 JSON 文档的预定义结构。
*   **机制**: 一个独立的、定义了完整文档结构的 Zod schema (`documentSchema`) 会被传入系统，并由 Pinia store 在最终环节使用。
*   **流程**:
    1.  Pinia store 的 `applyPatch` action 接收到一个 `patch` 指令。
    2.  它首先在内存中克隆一份当前的 `document` state，并将 `patch` **预应用**到这份克隆上。
    3.  然后，它使用 `documentSchema` 来校验**整个被修改后的克隆对象**。
    4.  **只有当**克隆对象的整体结构完全合法时，这次变更才会被最终接受，并替换掉原始的 `document` state。
    5.  如果校验失败（例如，一个必需的字段被 `remove`），整个操作将被安全地中止，原始数据保持不变。

**`documentSchema` 示例 (一个独立的 Zod schema):**
```javascript
import { z } from 'zod';

const documentSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string()),
  paragraphs: z.array(z.object({
    title: z.string(),
    description: z.string().optional()
  })).min(1) // 例如，至少要有一个段落
});
```

通过这种方式，我们实现了关注点分离：`presentation-schema` 关心**表现和值的格式**，而 `documentSchema` 关心**最终的结构完整性**。

## 7. 只读模式功能

为了支持纯展示场景，系统提供了只读模式功能。

### 7.1. 功能特性

当 `JsonDocument` 组件的 `readonly` 属性设置为 `true` 时：

*   **禁用内联编辑**: `EditableField` 组件不会显示 hover 效果，点击也不会进入编辑状态
*   **隐藏数组控件**: `ArrayControl` 组件完全不显示，包括添加和删除按钮
*   **禁用交互反馈**: 所有编辑相关的视觉反馈和鼠标事件处理都被禁用
*   **保持渲染能力**: 文档内容正常渲染，只是去除了编辑功能

### 7.2. 使用方式

```vue
<template>
  <JsonDocument
    :json-data="documentData"
    :presentation-schema="schema"
    :readonly="true"
  />
</template>
```

### 7.3. 实现机制

*   `JsonDocument.vue` 通过 Vue 3 的 `provide/inject` 机制将 `readonly` 状态传递给所有子组件
*   `EditableField.vue` 根据 `readonly` 状态决定是否启用交互功能
*   `ArrayControl.vue` 在只读模式下完全不渲染
*   `NodeRenderer.vue` 在只读模式下不触发 hover 事件和显示数组控件

这种设计确保了在只读模式下文档可以正常显示和阅读，同时完全避免了意外的编辑操作。 