// 文档访问工具
// 让开发者可以程序化访问组件库文档

/**
 * 获取使用文档的路径
 * @returns {string} 使用文档的相对路径
 */
export function getUsageDocsPath() {
  return 'vue-json-document/docs/usage'
}

/**
 * 获取本地开发文档的路径
 * @returns {string} 本地开发文档的相对路径
 */
export function getDevDocsPath() {
  return 'vue-json-document/docs/development'
}

/**
 * 在浏览器中打开使用文档（仅Node.js环境）
 */
export async function openUsageDocs() {
  if (typeof window !== 'undefined') {
    console.warn('openUsageDocs() 仅在Node.js环境中可用')
    return
  }

  try {
    const { readFileSync } = await import('fs')
    const { resolve } = await import('path')

    // 尝试读取文档
    const docPath = resolve(process.cwd(), 'node_modules/vue-json-document/docs/LIB_USAGE.md')
    const content = readFileSync(docPath, 'utf-8')

    console.log('\n📚 Vue JSON Document 使用文档\n')
    console.log('文档路径:', docPath)
    console.log('\n内容预览:')
    console.log(content.substring(0, 500) + '...\n')
    console.log('💡 提示: 您可以在编辑器中打开上述路径查看完整文档')
  } catch (error) {
    console.error('无法读取文档:', error.message)
    console.log('💡 请确保已正确安装 vue-json-document 包')
  }
}

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

📖 查看文档:
   openUsageDocs()  // 显示使用文档

🔗 文档路径:
   getUsageDocsPath()     // 获取使用文档路径
   getDevDocsPath()       // 获取开发文档路径

💡 更多信息请访问: https://github.com/ishowshao/json-document
`)
}

// 导出所有函数
export default {
  getUsageDocsPath,
  getDevDocsPath,
  openUsageDocs,
  getQuickStartExample,
  showHelp,
}
