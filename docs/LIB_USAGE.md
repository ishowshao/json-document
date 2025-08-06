# Vue JSON Document

一个 Vue 3 组件库，用于动态 JSON 文档渲染和内联编辑功能。

**最新功能：AI 协同编辑与预览模式** - 现在支持由 AI 或其他系统生成 `JSON Patch`，在应用前进行高亮预览，并由用户决定接受或拒绝变更。

## 安装

```bash
npm install vue-json-document
```

## 引入样式

为了确保组件样式正确加载，你需要在你的主入口文件中引入预编译的 CSS：

```javascript
// main.js 或类似文件
import 'vue-json-document/dist/style.css'
```

## 基本使用

```vue
<template>
  <JsonDocument
    ref="jsonDocRef"
    :json-data="jsonData"
    :presentation-schema="presentationSchema"
    :document-schema="documentSchema"
    :readonly="false"
    @change="handleDocChange"
    @preview-start="handlePreviewStart"
    @preview-accept="handlePreviewAccept"
    @preview-reject="handlePreviewReject"
  />
</template>

<script setup>
import { ref } from 'vue'
import { z } from 'zod'

const jsonDocRef = ref(null) // 创建一个 ref 来访问组件实例

const jsonData = ref({
  title: "文档标题",
  content: "这是原始内容。"
})

const presentationSchema = ref({
  rules: {
    "$.title": { "tag": "h1", "editor": "input" },
    "$.content": { "tag": "p", "editor": "textarea" }
  }
})

// 可选的 Zod 验证 schema
const documentSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
})

function handleDocChange(newDocument) {
  console.log('文档已变更:', newDocument)
}

// --- 预览模式事件处理 ---
function handlePreviewStart(event) {
  console.log('预览模式已开始:', event.patch)
  // 在这里显示 "接受" / "拒绝" 按钮
}

function handlePreviewAccept(event) {
  console.log('变更已接受:', event.patch)
  // 在这里隐藏 "接受" / "拒绝" 按钮
}

function handlePreviewReject() {
  console.log('变更已拒绝')
  // 在这里隐藏 "接受" / "拒绝" 按钮
}
</script>
```

## 高级功能：AI协同与预览模式

为了支持更复杂的场景，如人机协同编辑，组件提供了一套预览模式的 API。它允许你接收一个 `JSON Patch` 变更集，在UI上高亮显示这些变更，然后由用户决定是接受还是拒绝。

### 工作流程

1.  **获取组件实例**: 使用 `ref` 标记 `<JsonDocument>` 组件。
2.  **触发预览**: 当你的应用从外部（例如 AI 服务）获得一个 `JSON Patch` 后，调用组件实例的 `previewChanges(patch)` 方法。
3.  **进入预览模式**:
    *   组件会触发 `@preview-start` 事件。
    *   所有被 `patch` 影响的字段将在UI上高亮显示。
    *   此时，原始数据**不会**被修改。
4.  **用户决策**:
    *   如果用户决定**接受**，你调用 `acceptChanges()` 方法。组件会触发 `@preview-accept` 和 `@change` 事件，并将变更应用到原始数据。
    *   如果用户决定**拒绝**，你调用 `rejectChanges()` 方法。组件会触发 `@preview-reject` 事件，UI恢复到原始状态。

### 示例代码

```vue
<template>
  <div>
    <div class="controls">
      <button @click="triggerAIEdit" :disabled="isInPreview">模拟 AI 编辑</button>
      <button v-if="isInPreview" @click="accept">✅ 接受</button>
      <button v-if="isInPreview" @click="reject">❌ 拒绝</button>
    </div>
    
    <JsonDocument
      ref="jsonDocRef"
      :json-data="jsonData"
      :presentation-schema="presentationSchema"
      @preview-start="isInPreview = true"
      @preview-accept="isInPreview = false"
      @preview-reject="isInPreview = false"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const jsonDocRef = ref(null);
const isInPreview = ref(false);

const jsonData = ref({
  title: "AI协同编辑器",
  description: "点击按钮，模拟AI提出的修改建议。"
});

const presentationSchema = ref({
  rules: {
    "$.title": { "tag": "h1", "editor": "input" },
    "$.description": { "tag": "p", "editor": "textarea" }
  }
});

// 模拟从 AI 服务获取 patch
function triggerAIEdit() {
  if (!jsonDocRef.value) return;

  const aiGeneratedPatch = [
    { op: 'replace', path: '/title', value: 'AI 增强的标题' },
    { op: 'replace', path: '/description', value: '这段描述由 AI 进行了优化，使其更具吸引力。' }
  ];

  // 调用组件方法，进入预览模式
  jsonDocRef.value.previewChanges(aiGeneratedPatch);
}

function accept() {
  jsonDocRef.value?.acceptChanges();
}

function reject() {
  jsonDocRef.value?.rejectChanges();
}
</script>

<style>
/* 为高亮区域添加自定义样式 */
.json-document-highlight {
  background-color: #fffbe6; /* 淡黄色背景 */
  border: 1px dashed #f59e0b; /* 橙色虚线边框 */
  border-radius: 4px;
  transition: all 0.3s ease-in-out;
}
</style>
```

## 组件 API

### Props

| 属性名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `json-data` | `Object` | ✅ | - | 要渲染的 JSON 数据 |
| `presentation-schema` | `Object` | ✅ | - | 展示模式配置 |
| `document-schema` | `Object` | ❌ | `null` | 文档验证模式 (Zod Schema) |
| `readonly` | `Boolean` | ❌ | `false` | 是否为只读模式 |

### 方法 (Exposed Methods)

你需要通过 `ref` 来调用这些方法。

| 方法名 | 参数 | 返回值 | 说明 |
|--------------|-------------------------|----------|----------------------------------------------------|
| `previewChanges` | `patch: JSONPatch[]` | `void` | 接收一个 `JSON Patch` 数组，进入预览模式并高亮变更。 |
| `acceptChanges` | - | `void` | 接受当前预览的变更，并将其应用到文档。 |
| `rejectChanges` | - | `void` | 拒绝当前预览的变更，并退出预览模式。 |

### 事件 (Events)

| 事件名 | 载荷 (Payload) | 说明 |
|----------------|------------------------------------------------|----------------------------------------------------------|
| `@change` | `newDocument: Object` | 当文档内容发生永久性变更时触发（包括接受预览）。 |
| `@preview-start` | `{ patch: JSONPatch[], highlightedPaths: string[] }` | 调用 `previewChanges` 成功后触发。 |
| `@preview-accept`| `{ patch: JSONPatch[] }` | 调用 `acceptChanges` 成功后触发。 |
| `@preview-reject`| - | 调用 `rejectChanges` 后触发。 |

## 只读模式

当设置 `readonly: true` 时，文档将以只读模式渲染，所有编辑和预览功能都将被禁用。

```vue
<template>
  <JsonDocument
    :json-data="jsonData"
    :presentation-schema="presentationSchema"
    :readonly="true"
  />
</template>
```

## 样式定制

你可以通过覆盖 CSS 类来定制组件的外观。

```css
/* 自定义编辑字段的悬浮效果 */
.json-document .editable-field:hover {
  background-color: #f0f8ff;
}

/* 自定义预览模式下的高亮样式 */
.json-document-highlight {
  background-color: #fef3c7 !important; /* 建议使用 !important 确保覆盖 */
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}
```

## TypeScript 支持

库提供完整的 TypeScript 类型定义。

```typescript
import type { 
  JsonDocumentProps,
  PresentationSchema,
  JsonPatch,
  JsonDocumentExposedMethods // 新增类型
} from 'vue-json-document'
import { ref } from 'vue'

const jsonDocRef = ref<JsonDocumentExposedMethods | null>(null)

// 调用方法
jsonDocRef.value?.previewChanges([...])
```

---
*（文档的其余部分，如安装、依赖等保持不变）*
