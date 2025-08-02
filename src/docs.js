// 快速开始和帮助工具

/**
 * 获取快速开始示例
 * @returns {object} 包含示例代码的对象
 */
export function getQuickStartExample() {
  return {
    template: `<template>
  <JsonDocument
    :json-data="jsonData"
    :presentation-schema="schema"
  />
</template>`,

    script: `<script setup>
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
</script>`,

    install: 'npm install vue-json-document',

    description: '这是一个基本的使用示例，展示了如何设置JSON数据和展示模式',
  }
}

/**
 * 在控制台显示帮助信息
 */
export function showHelp() {
  console.log(`
📚 Vue JSON Document 帮助

🚀 快速开始:
   const example = getQuickStartExample()
   console.log(example.install)
   console.log(example.template)

💡 更多信息请访问: https://github.com/ishowshao/json-document
`)
}

// 导出所有函数
export default {
  getQuickStartExample,
  showHelp,
}
