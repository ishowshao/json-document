# Layout配置JSONPath支持调研报告

## 调研背景

当前系统的 `layout` 配置使用JSON Pointer语法，但JSON Pointer无法支持通配符模式，导致类似 `/paragraphs/*/content/features` 这样的配置无法生效。用户希望通过引入JSONPath支持来解决这个问题。

## 现状分析

### 当前架构中JSON Pointer的使用

**核心组件中的JSON Pointer应用：**

1. **document.js store**

   - `getNodeByPointer(pointer)`: 核心函数，用于根据JSON Pointer路径获取数据节点
   - 实现了标准JSON Pointer解析逻辑（RFC 6901）
   - 被多个组件广泛使用

2. **NodeRenderer.vue**

   - `dataNode = documentStore.getNodeByPointer(props.path)`: 获取当前路径的数据
   - `layoutRule = props.schema.layout?.[props.path]`: **当前layout配置查找逻辑**
   - `matchesPattern()`: 已经使用JSONPath进行rules匹配，并将结果转换为JSON Pointer

3. **JsonDocument.vue**

   - `getValueAtPath()`: 自实现的JSON Pointer路径解析函数
   - 预览模式中的路径计算和高亮

4. **ArrayControl.vue**
   - 使用 `getNodeByPointer()` 获取数组数据

### 当前JSONPath集成情况

系统已经部分集成了JSONPath：

- **依赖库**: `jsonpath@1.1.1` 已安装
- **Rules配置**: 已经在 `matchesPattern()` 中使用JSONPath语法（如 `$.paragraphs[*].title`）
- **转换机制**: 存在JSONPath到JSON Pointer的转换逻辑

## 方案2实施分析：全面采用JSONPath

### 需要修改的核心文件

#### 1. NodeRenderer.vue (核心修改)

**当前问题代码位置：**

```javascript
// 第117行: layout规则查找
const layoutRule = computed(() => {
  return props.schema.layout?.[props.path] || null // 只支持精确匹配
})
```

**修改方案：**

```javascript
const layoutRule = computed(() => {
  if (!props.schema.layout || !documentStore.document) return null

  // 遍历layout配置，使用JSONPath匹配
  for (const [layoutPattern, rule] of Object.entries(props.schema.layout)) {
    if (matchesJSONPath(layoutPattern, props.path)) {
      return rule
    }
  }
  return null
})

// 新增JSONPath匹配函数（复用现有matchesPattern逻辑）
function matchesJSONPath(jsonPathPattern, pointer) {
  // 复用现有的matchesPattern逻辑
  return matchesPattern(jsonPathPattern, pointer)
}
```

#### 2. document.js store (可选但推荐)

**考虑添加JSONPath支持：**

```javascript
// 新增方法
getNodesByJSONPath: (state) => (jsonPath) => {
  if (!state.document) return []
  try {
    return JSONPath.nodes(state.document, jsonPath)
  } catch (error) {
    console.warn(`Error querying JSONPath '${jsonPath}':`, error)
    return []
  }
}
```

#### 3. HomeView.vue (示例更新)

**配置语法统一：**

```javascript
// 将layout配置从JSON Pointer改为JSONPath语法
const schemaInput = ref(`{
  "rules": {
    // 保持现有JSONPath语法
    "$.title": { "tag": "h1", "editor": "input" },
    "$.paragraphs[*].title": { "tag": "h2", "editor": "input" }
  },
  "layout": {
    // 从JSON Pointer改为JSONPath语法
    "$.authors": {
      "tag": "ul",
      "static": { "before": [{ "tag": "h2", "content": "作者" }] }
    },
    "$.paragraphs[*].content.features": {  // 支持通配符
      "tag": "ul",
      "static": { "before": [{ "tag": "h3", "content": "特性" }] }
    },
    "$.paragraphs[*].content.metadata": {  // 支持通配符
      "tag": "div",
      "static": { 
        "before": [{ "tag": "h4", "content": "元数据" }],
        "after": [{ "tag": "small", "content": "版本: " }]
      }
    }
  }
}`)
```

### 实施复杂度评估

#### 低风险修改

- **NodeRenderer.vue的layoutRule查找逻辑**: 只需修改一个computed属性
- **示例配置更新**: 语法改动，向后兼容

#### 中等风险修改

- **类型定义更新**: `src/index.d.ts` 中的接口定义需要更新
- **文档更新**: 需要更新所有相关文档说明layout配置语法变化

#### 无需修改的部分

- **JSON Pointer核心逻辑**: `getNodeByPointer`等核心函数保持不变
- **Rules匹配逻辑**: 已经使用JSONPath，无需修改
- **JSON Patch应用**: 继续使用JSON Pointer路径
