# Vue JSON Document

一个 Vue 3 组件库，用于动态 JSON 文档渲染和内联编辑功能。

## 安装

```bash
npm install vue-json-document
```

## 基本使用

### 1. 全局注册（推荐）

```javascript
import { createApp } from 'vue'
import JsonDocumentSystem from 'vue-json-document'
import 'vue-json-document/dist/vue-json-document.css'

const app = createApp(App)
app.use(JsonDocumentSystem)
```

### 2. 按需导入

```javascript
import { JsonDocument } from 'vue-json-document'
import 'vue-json-document/dist/vue-json-document.css'

export default {
  components: {
    JsonDocument
  }
}
```

## 组件使用

### JsonDocument 主组件

```vue
<template>
  <JsonDocument
    :json-data="jsonData"
    :presentation-schema="presentationSchema"
    :document-schema="documentSchema"
  />
</template>

<script setup>
import { ref } from 'vue'

const jsonData = ref({
  title: "文档标题",
  authors: ["张三", "李四"],
  content: [
    {
      title: "章节一",
      description: "章节描述"
    }
  ]
})

const presentationSchema = ref({
  rules: {
    "$.title": {
      tag: "h1",
      editor: "input"
    },
    "$.authors[*]": {
      tag: "li",
      editor: "input"
    },
    "$.content[*].title": {
      tag: "h2",
      editor: "input"
    },
    "$.content[*].description": {
      tag: "p",
      editor: "textarea"
    }
  },
  layout: {
    "/authors": {
      tag: "ul",
      static: {
        before: [{ tag: "h2", content: "作者列表" }]
      }
    }
  }
})

// 可选：文档验证模式
import { z } from 'zod'
const documentSchema = z.object({
  title: z.string().min(1),
  authors: z.array(z.string()),
  content: z.array(z.object({
    title: z.string(),
    description: z.string().optional()
  }))
})
</script>
```

## 状态管理

### 使用 Pinia Store

```javascript
import { useDocumentStore } from 'vue-json-document'

export default {
  setup() {
    const documentStore = useDocumentStore()
    
    // 获取当前文档
    const currentDoc = documentStore.document
    
    // 检查是否有错误
    const hasErrors = documentStore.errors.length > 0
    
    return {
      documentStore,
      currentDoc,
      hasErrors
    }
  }
}
```

## 工具函数

### 模式工具

```javascript
import { schemaUtils } from 'vue-json-document'

// 从模式生成默认值
const defaultValue = schemaUtils.generateDefaultFromSchema(yourSchema)

// 获取路径对应的模式
const pathSchema = schemaUtils.getSchemaForPath(schema, ['path', 'segments'])
```

## TypeScript 支持

库提供完整的 TypeScript 类型定义：

```typescript
import type { 
  JsonDocumentProps,
  PresentationSchema,
  JsonPatch 
} from 'vue-json-document'

const schema: PresentationSchema = {
  rules: {
    "$.title": {
      tag: "h1",
      editor: "input"
    }
  }
}
```

## 高级配置

### 自定义编辑器

```javascript
const presentationSchema = {
  rules: {
    "$.description": {
      tag: "div",
      editor: "textarea"  // 支持 "input" | "textarea"
    }
  }
}
```

### 数组操作

系统自动为数组元素提供添加/删除控制：

```javascript
const presentationSchema = {
  rules: {
    "$.items[*]": {
      tag: "div",
      editor: "input"
    }
  }
}
```

### 自定义属性映射

```javascript
const presentationSchema = {
  rules: {
    "$.imageUrl": {
      tag: "img",
      useValueAs: "src"  // 将值作为 src 属性
    }
  }
}
```

## 事件处理

### 监听文档更新

```vue
<template>
  <JsonDocument
    :json-data="jsonData"
    :presentation-schema="presentationSchema"
    @update="handleDocumentUpdate"
  />
</template>

<script setup>
function handleDocumentUpdate(patch) {
  console.log('文档更新:', patch)
  // patch 是 JSON Patch 格式
  // { op: 'replace', path: '/title', value: 'new value' }
}
</script>
```

## 样式定制

库使用 TailwindCSS 构建，你可以：

1. 覆盖 CSS 变量
2. 使用自定义 TailwindCSS 配置
3. 直接覆盖组件样式

```css
/* 自定义编辑字段样式 */
.json-document .editable-field {
  /* 自定义样式 */
}
```

## 打包大小

- ES 模块: ~240KB (gzipped: ~56KB)
- UMD 模块: ~155KB (gzipped: ~48KB)  
- CJS 模块: ~155KB (gzipped: ~48KB)
- CSS: ~0.33KB (gzipped: ~0.25KB)

## 依赖要求

- Vue 3.5+
- Pinia 3.0+

## 浏览器支持

支持所有现代浏览器，包括：
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License