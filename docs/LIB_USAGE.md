# Vue JSON Document

一个 Vue 3 组件库，用于动态 JSON 文档渲染和内联编辑功能。该库实现了数据与表现分离的架构，通过 JSON Patch (RFC 6902) 进行原子化状态管理，支持实时协同编辑和预览模式。

**核心特性：**

- 🎯 **动态内容渲染** - 通过 JSONPath 规则映射 JSON 数据到 HTML 元素
- ✏️ **内联编辑** - 悬停激活、点击编辑的交互体验
- 🔄 **JSON Patch 操作** - 符合 RFC 6902 标准的原子化更新
- 🤖 **AI 协同编辑** - 支持预览模式，在应用变更前进行高亮显示
- 🛡️ **Zod 验证** - 集成 Zod 进行数据结构验证
- 📱 **只读模式** - 支持纯展示场景，禁用所有编辑功能

## 安装

```bash
npm install vue-json-document
```

## 依赖要求

该组件库需要以下 peer dependencies：

```bash
npm install vue@^3.5.0 pinia@^3.0.0
```

## 引入样式

为了确保组件样式正确加载，你需要在你的主入口文件中引入预编译的 CSS：

```javascript
// main.js 或类似文件
import 'vue-json-document/dist/style.css'
```

## 快速开始

### 1. 注册 Pinia Store

该组件库使用 Pinia 进行状态管理，确保在你的 Vue 应用中正确设置了 Pinia：

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

### 2. 基本使用

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
import { JsonDocument } from 'vue-json-document'
import { z } from 'zod'

const jsonDocRef = ref(null) // 创建一个 ref 来访问组件实例

const jsonData = ref({
  title: '文档标题',
  content: '这是原始内容。',
  author: {
    name: '作者姓名',
    email: 'author@example.com',
  },
  tags: ['标签1', '标签2'],
})

const presentationSchema = ref({
  rules: {
    '$.title': { tag: 'h1', editor: 'input' },
    '$.content': { tag: 'p', editor: 'textarea' },
    '$.author.name': { tag: 'span', editor: 'input' },
    '$.author.email': { tag: 'span', editor: 'input' },
    '$.tags[*]': { tag: 'span', editor: 'input' },
  },
  layout: {
    '/author': {
      tag: 'div',
      static: {
        before: [{ tag: 'h3', content: '作者信息' }],
      },
    },
  },
})

// 可选的 Zod 验证 schema
const documentSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  tags: z.array(z.string()),
})

function handleDocChange(newDocument) {
  console.log('文档已变更:', newDocument)
  // 在这里处理文档变更，例如保存到服务器
}

// --- 预览模式事件处理 ---
function handlePreviewStart(event) {
  console.log('预览模式已开始:', event.patch)
  console.log('高亮路径:', event.highlightedPaths)
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

## 详细配置说明

### Presentation Schema（展示模式配置）

Presentation Schema 定义了如何将 JSON 数据映射到 HTML 元素和编辑控件。它包含两个主要部分：

#### 1. Rules（规则）

使用 JSONPath 表达式来匹配 JSON 数据中的字段：

```javascript
const presentationSchema = {
  rules: {
    // 基础字段映射
    '$.title': {
      tag: 'h1', // 渲染为 h1 标签
      editor: 'input', // 编辑时使用 input 控件
    },

    // 嵌套对象字段
    '$.author.name': {
      tag: 'span',
      editor: 'input',
    },

    // 数组元素（通配符）
    '$.tags[*]': {
      tag: 'span',
      editor: 'input',
    },

    // 特定数组索引
    '$.items[0].name': {
      tag: 'h3',
      editor: 'input',
    },

    // 图片字段（使用 useValueAs 属性）
    '$.avatar': {
      tag: 'img',
      useValueAs: 'src', // 将字段值作为 src 属性
    },
  },
}
```

**支持的编辑器类型：**

- `"input"` - 单行文本输入框
- `"textarea"` - 多行文本输入框

**支持的 HTML 标签：**

- 任何有效的 HTML 标签（h1, h2, p, span, div, img 等）

#### 2. Layout（布局）

定义容器元素和静态内容：

```javascript
const presentationSchema = {
  layout: {
    '$.author': {
      tag: 'div',
      static: {
        before: [
          { tag: 'h3', content: '作者信息' },
          { tag: 'hr', content: '' },
        ],
        after: [{ tag: 'small', content: '最后更新时间：2024-01-01' }],
      },
    },
  },
}
```

### Document Schema（文档验证模式）

使用 Zod 定义数据结构和验证规则：

```javascript
import { z } from 'zod'

const documentSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题长度不能超过100字符'),

  content: z.string().min(10, '内容至少需要10个字符'),

  author: z.object({
    name: z.string().min(1, '作者姓名不能为空'),
    email: z.string().email('请输入有效的邮箱地址'),
  }),

  tags: z.array(z.string()).min(1, '至少需要一个标签'),

  publishDate: z.string().datetime('请输入有效的日期时间'),

  status: z.enum(['draft', 'published', 'archived']),
})
```

### 数组操作

组件自动为数组提供添加和删除功能：

```javascript
const jsonData = {
  items: [
    { name: '项目1', value: 100 },
    { name: '项目2', value: 200 },
  ],
}

const presentationSchema = {
  rules: {
    '$.items[*].name': { tag: 'h4', editor: 'input' },
    '$.items[*].value': { tag: 'span', editor: 'input' },
  },
}
```

- **添加项目**：悬停在数组或数组项上时显示 `+` 按钮
- **删除项目**：悬停在数组项上时显示 `-` 按钮
- **自动类型推断**：新添加的项目会根据 Zod Schema 生成默认值

## 高级功能：AI协同与预览模式

为了支持更复杂的场景，如人机协同编辑，组件提供了一套预览模式的 API。它允许你接收一个 `JSON Patch` 变更集，在UI上高亮显示这些变更，然后由用户决定是接受还是拒绝。

### 工作流程

1.  **获取组件实例**: 使用 `ref` 标记 `<JsonDocument>` 组件。
2.  **触发预览**: 当你的应用从外部（例如 AI 服务）获得一个 `JSON Patch` 后，调用组件实例的 `previewChanges(patch)` 方法。
3.  **进入预览模式**:
    - 组件会触发 `@preview-start` 事件。
    - 所有被 `patch` 影响的字段将在UI上高亮显示。
    - 此时，原始数据**不会**被修改。
4.  **用户决策**:
    - 如果用户决定**接受**，你调用 `acceptChanges()` 方法。组件会触发 `@preview-accept` 和 `@change` 事件，并将变更应用到原始数据。
    - 如果用户决定**拒绝**，你调用 `rejectChanges()` 方法。组件会触发 `@preview-reject` 事件，UI恢复到原始状态。

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
import { ref } from 'vue'

const jsonDocRef = ref(null)
const isInPreview = ref(false)

const jsonData = ref({
  title: 'AI协同编辑器',
  description: '点击按钮，模拟AI提出的修改建议。',
})

const presentationSchema = ref({
  rules: {
    '$.title': { tag: 'h1', editor: 'input' },
    '$.description': { tag: 'p', editor: 'textarea' },
  },
})

// 模拟从 AI 服务获取 patch
function triggerAIEdit() {
  if (!jsonDocRef.value) return

  const aiGeneratedPatch = [
    { op: 'replace', path: '/title', value: 'AI 增强的标题' },
    { op: 'replace', path: '/description', value: '这段描述由 AI 进行了优化，使其更具吸引力。' },
  ]

  // 调用组件方法，进入预览模式
  jsonDocRef.value.previewChanges(aiGeneratedPatch)
}

function accept() {
  jsonDocRef.value?.acceptChanges()
}

function reject() {
  jsonDocRef.value?.rejectChanges()
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

## 组件 API 参考

### Props

| 属性名                | 类型        | 必需 | 默认值  | 说明                                           |
| --------------------- | ----------- | ---- | ------- | ---------------------------------------------- |
| `json-data`           | `Object`    | ✅   | -       | 要渲染的 JSON 数据，作为单一数据源             |
| `presentation-schema` | `Object`    | ✅   | -       | 展示模式配置，定义 JSONPath 到 HTML 的映射规则 |
| `document-schema`     | `ZodSchema` | ❌   | `null`  | Zod 验证模式，用于数据验证和默认值生成         |
| `readonly`            | `Boolean`   | ❌   | `false` | 是否为只读模式，禁用所有编辑和预览功能         |

### 暴露的方法 (Exposed Methods)

通过组件 `ref` 调用这些方法：

| 方法名             | 参数                              | 返回值                  | 说明                                                 |
| ------------------ | --------------------------------- | ----------------------- | ---------------------------------------------------- |
| `previewChanges`   | `patch: JSONPatch \| JSONPatch[]` | `void`                  | 进入预览模式，高亮显示变更但不应用到原始数据         |
| `acceptChanges`    | -                                 | `void`                  | 接受当前预览的变更，应用到原始数据并触发 change 事件 |
| `rejectChanges`    | -                                 | `void`                  | 拒绝当前预览的变更，恢复到原始状态                   |
| `isPreviewing`     | -                                 | `ComputedRef<boolean>`  | 只读属性，指示是否处于预览模式                       |
| `highlightedPaths` | -                                 | `ComputedRef<string[]>` | 只读属性，返回当前高亮显示的路径数组                 |

### 事件 (Events)

| 事件名            | 载荷类型                                             | 触发时机                     | 说明                                         |
| ----------------- | ---------------------------------------------------- | ---------------------------- | -------------------------------------------- |
| `@change`         | `newDocument: Record<string, any>`                   | 文档数据永久变更时           | 用户编辑或接受预览变更后触发，可用于保存数据 |
| `@preview-start`  | `{ patch: JSONPatch[], highlightedPaths: string[] }` | 调用 `previewChanges` 成功后 | 进入预览模式，可显示接受/拒绝按钮            |
| `@preview-accept` | `{ patch: JSONPatch[] }`                             | 调用 `acceptChanges` 后      | 用户接受预览变更，可隐藏预览相关UI           |
| `@preview-reject` | -                                                    | 调用 `rejectChanges` 后      | 用户拒绝预览变更，可隐藏预览相关UI           |

### JSON Patch 格式

组件使用符合 RFC 6902 标准的 JSON Patch 操作：

```javascript
// 添加操作
{ op: "add", path: "/items/-", value: { name: "新项目" } }

// 替换操作
{ op: "replace", path: "/title", value: "新标题" }

// 删除操作
{ op: "remove", path: "/items/0" }

// 移动操作
{ op: "move", from: "/items/0", path: "/items/1" }

// 复制操作
{ op: "copy", from: "/template", path: "/items/-" }

// 测试操作
{ op: "test", path: "/status", value: "published" }
```

**路径说明：**

- 使用 JSON Pointer 格式（RFC 6901）
- `/` 表示根对象
- `/title` 表示根对象的 title 属性
- `/items/0` 表示 items 数组的第一个元素
- `/items/-` 表示在 items 数组末尾添加

## 只读模式

当设置 `readonly: true` 时，文档将以只读模式渲染，所有编辑和预览功能都将被禁用。

```vue
<template>
  <JsonDocument :json-data="jsonData" :presentation-schema="presentationSchema" :readonly="true" />
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

## 实际应用场景

### 1. 博客文章编辑器

```vue
<template>
  <div class="blog-editor">
    <JsonDocument
      :json-data="article"
      :presentation-schema="blogSchema"
      :document-schema="articleSchema"
      @change="saveArticle"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { z } from 'zod'

const article = ref({
  title: '我的博客文章',
  content: '文章内容...',
  tags: ['Vue', '前端'],
  metadata: {
    author: '作者姓名',
    publishDate: '2024-01-01',
    category: '技术',
  },
})

const blogSchema = {
  rules: {
    '$.title': { tag: 'h1', editor: 'input' },
    '$.content': { tag: 'div', editor: 'textarea' },
    '$.tags[*]': { tag: 'span', editor: 'input' },
    '$.metadata.author': { tag: 'span', editor: 'input' },
    '$.metadata.category': { tag: 'span', editor: 'input' },
  },
  layout: {
    '$.metadata': {
      tag: 'aside',
      static: {
        before: [{ tag: 'h3', content: '文章信息' }],
      },
    },
  },
}

const articleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(50),
  tags: z.array(z.string()).min(1),
  metadata: z.object({
    author: z.string().min(1),
    publishDate: z.string(),
    category: z.string(),
  }),
})

function saveArticle(updatedArticle) {
  // 保存到服务器或本地存储
  console.log('保存文章:', updatedArticle)
}
</script>
```

### 2. 配置管理界面

```vue
<template>
  <div class="config-panel">
    <JsonDocument
      :json-data="appConfig"
      :presentation-schema="configSchema"
      :document-schema="configValidation"
      @change="updateConfig"
    />
  </div>
</template>

<script setup>
const appConfig = ref({
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_db',
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
  features: ['analytics', 'notifications'],
})

const configSchema = {
  rules: {
    '$.database.host': { tag: 'code', editor: 'input' },
    '$.database.port': { tag: 'code', editor: 'input' },
    '$.database.name': { tag: 'code', editor: 'input' },
    '$.cache.enabled': { tag: 'span', editor: 'input' },
    '$.cache.ttl': { tag: 'span', editor: 'input' },
    '$.features[*]': { tag: 'span', editor: 'input' },
  },
}
</script>
```

## TypeScript 支持

库提供完整的 TypeScript 类型定义：

```typescript
import type {
  JsonDocumentProps,
  PresentationSchema,
  JsonPatch,
  JsonDocumentExposedMethods,
} from 'vue-json-document'
import { ref } from 'vue'

const jsonDocRef = ref<JsonDocumentExposedMethods | null>(null)

// 调用方法时享受完整的类型提示
jsonDocRef.value?.previewChanges([{ op: 'replace', path: '/title', value: '新标题' }])

// 类型安全的 Schema 定义
const schema: PresentationSchema = {
  rules: {
    '$.title': { tag: 'h1', editor: 'input' },
  },
}
```

## 故障排除

### 常见问题

**Q: 组件无法渲染内容**

```javascript
// ✅ 确保正确导入组件和样式
import { JsonDocument } from 'vue-json-document'
import 'vue-json-document/dist/style.css'

// ✅ 确保 Pinia 已正确设置
const app = createApp(App)
app.use(createPinia())
```

**Q: JSONPath 规则不生效**

```javascript
// ❌ 错误的 JSONPath 语法
"title": { "tag": "h1" }

// ✅ 正确的 JSONPath 语法
"$.title": { "tag": "h1" }
```

**Q: 数组操作按钮不显示**

```javascript
// ✅ 确保 readonly 为 false
<JsonDocument :readonly="false" />

// ✅ 确保悬停在数组或数组项上
// 按钮只在鼠标悬停时显示
```

**Q: Zod 验证错误**

```javascript
// ✅ 确保数据结构与 Schema 匹配
const data = { title: 'string' } // 与 z.object({ title: z.string() }) 匹配
```

### 调试技巧

1. **启用控制台日志**：组件内置了详细的调试日志
2. **检查 Store 状态**：使用 Vue DevTools 检查 DocumentStore 状态
3. **验证 JSONPath**：可使用在线工具测试 JSONPath 表达式
4. **检查事件流**：监听所有事件来了解数据流向

## 性能优化

### 大数据集处理

```javascript
// 对于大型 JSON 文档，考虑分页或虚拟滚动
const largeData = ref({
  items: [], // 避免一次加载过多数组项
})

// 使用计算属性来过滤显示的数据
const displayedData = computed(() => ({
  ...largeData.value,
  items: largeData.value.items.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
}))
```

### 减少重新渲染

```javascript
// 使用 readonly 模式来禁用编辑功能以提升性能
<JsonDocument :readonly="true" />

// 避免频繁的 Schema 变更
const presentationSchema = ref(schemaConfig) // 保持引用稳定
```
