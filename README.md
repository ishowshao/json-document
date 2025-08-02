# Vue JSON Document

[![npm version](https://badge.fury.io/js/vue-json-document.svg)](https://badge.fury.io/js/vue-json-document)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个强大的 Vue 3 组件库，用于动态渲染 JSON 数据并提供内联编辑功能。基于内容与展示分离的核心理念，通过简单的映射规则将任何 JSON 对象转换为丰富的交互式文档。

## ✨ 特性

- 🎯 **内容与展示分离** - JSON 数据与展示逻辑完全解耦
- ✏️ **内联编辑** - 直接在渲染的内容上进行编辑
- 🔧 **JSONPath 映射** - 灵活的数据选择和展示规则
- 📦 **JSON Patch 支持** - 标准化的状态更新机制
- 🎨 **TailwindCSS 样式** - 现代化的默认样式
- 🔍 **TypeScript 支持** - 完整的类型定义
- 🧩 **Vue 3 + Composition API** - 现代化的 Vue 开发体验
- ⚡ **轻量级** - 核心功能，最小依赖

## 🚀 快速开始

### 安装

```bash
npm install vue-json-document
```

### 基本使用

```vue
<template>
  <JsonDocument
    :json-data="jsonData"
    :presentation-schema="schema"
  />
</template>

<script setup>
import { JsonDocument } from 'vue-json-document'
import 'vue-json-document/dist/vue-json-document.css'

const jsonData = {
  title: "我的文档",
  content: "这是文档内容"
}

const schema = {
  rules: {
    "$.title": { tag: "h1", editor: "input" },
    "$.content": { tag: "p", editor: "textarea" }
  }
}
</script>
```

## 📖 文档

- **使用指南**: [docs/LIB_USAGE.md](./docs/LIB_USAGE.md)
- **本地开发**: [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md)
- **包内文档**: [docs/PACKAGE_DOCS.md](./docs/PACKAGE_DOCS.md)

### 💡 快速访问帮助

```javascript
// 程序化访问文档
import { docs } from 'vue-json-document'

docs.showHelp()                    // 显示帮助信息
docs.getQuickStartExample()        // 获取快速开始示例
```

## 🏗️ 核心架构

系统基于三个核心概念构建：

### 1. JSON 数据
文档内容的唯一数据源，结构完全由您定义：

```json
{
  "title": "我的文档",
  "authors": ["张三", "李四"],
  "content": [
    {
      "title": "第一章",
      "description": "章节描述"
    }
  ]
}
```

### 2. 展示模式
定义数据到 HTML 的映射规则：

```json
{
  "rules": {
    "$.title": { "tag": "h1", "editor": "input" },
    "$.authors[*]": { "tag": "li", "editor": "input" },
    "$.content[*].title": { "tag": "h2", "editor": "input" }
  },
  "layout": {
    "/authors": { "tag": "ul" }
  }
}
```

### 3. 渲染文档
应用模式后生成的交互式 HTML，支持内联编辑。

## 🛠️ 开发

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建库文件
npm run build:lib
```

### 测试

```bash
# 单元测试
npm run test:unit

# E2E 测试（首次需要安装浏览器）
npx playwright install
npm run test:e2e
```

## 📦 发布

```bash
# 构建并发布到 npm
npm run build:lib
npm publish
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](./LICENSE)