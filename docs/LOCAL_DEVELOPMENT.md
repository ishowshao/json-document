# 本地开发和测试指南

## 使用 npm link 进行本地测试

`npm link` 让您可以在本地"发布"组件库，在其他项目中测试使用，无需发布到真正的 npm 仓库。

### 1. 创建全局链接

在组件库项目目录中：

```bash
# 构建组件库
npm run build:lib

# 创建全局链接
npm link
```

✅ **已完成！** 现在 `vue-json-document` 已在全局可用。

### 2. 在其他项目中使用

在您的测试项目中：

```bash
# 链接到本地组件库
npm link vue-json-document
```

### 3. 使用示例

在测试项目中创建 Vue 应用：

```vue
<!-- TestApp.vue -->
<template>
  <div>
    <h1>测试 Vue JSON Document</h1>
    <JsonDocument :json-data="jsonData" :presentation-schema="schema" />
  </div>
</template>

<script setup>
import { JsonDocument } from 'vue-json-document'
import 'vue-json-document/dist/vue-json-document.css'

const jsonData = {
  title: '本地测试文档',
  description: '这是使用 npm link 的测试',
  items: ['项目一', '项目二', '项目三'],
}

const schema = {
  rules: {
    '$.title': { tag: 'h2', editor: 'input' },
    '$.description': { tag: 'p', editor: 'textarea' },
    '$.items[*]': { tag: 'li', editor: 'input' },
  },
  layout: {
    '$.items': { tag: 'ul' },
  },
}
</script>
```

### 4. 开发工作流

1. **修改组件库代码**
2. **重新构建**：`npm run build:lib`
3. **测试项目自动更新**（无需重新链接）

### 5. 管理链接

```bash
# 查看全局链接
npm list -g --depth=0

# 在测试项目中取消链接
npm unlink vue-json-document

# 在组件库项目中移除全局链接
npm unlink -g vue-json-document
```

### 6. 常见问题

**Q: `npm link vue-json-document` 报错 404 Not Found？**
A: 这个错误通常出现但不影响功能！请检查：

- 是否有软链接：`ls -la node_modules/ | grep vue-json-document`
- 使用ES模块语法导入：`import { JsonDocument } from 'vue-json-document'`
- 如果是CommonJS项目，需要用动态导入：`const m = await import('vue-json-document')`

**Q: 修改代码后测试项目没有更新？**
A: 重新运行 `npm run build:lib` 构建最新版本。

**Q: 链接后找不到组件？**
A: 确保：

- 已运行 `npm run build:lib`
- package.json 中的 main/module/exports 路径正确
- 测试项目中正确导入了 CSS 文件
- 使用正确的模块语法（ES或CommonJS）

**Q: TypeScript 类型提示不工作？**
A: 确保 `dist/index.d.ts` 文件存在且 package.json 中 types 字段配置正确。

**Q: 导入时提示 Cannot read properties of undefined？**
A: 使用ES模块语法：

```javascript
// ✅ 正确
import { JsonDocument, docs } from 'vue-json-document'

// ❌ 错误（在ES模块项目中）
const { JsonDocument } = require('vue-json-document')
```

### 7. 推荐的测试项目结构

创建一个简单的测试项目：

```bash
mkdir test-vue-json-document
cd test-vue-json-document
npm init vue@latest . -- --typescript --router --pinia
npm install
npm link vue-json-document
```

然后创建测试页面验证所有功能。

## 自动化开发脚本

您可以添加开发脚本来简化工作流：

```json
{
  "scripts": {
    "dev:lib": "npm run build:lib && echo '组件库已更新'",
    "link:global": "npm run build:lib && npm link",
    "unlink:global": "npm unlink -g vue-json-document"
  }
}
```

这样就可以快速进行本地开发和测试了！
