# 📚 包内文档访问指南

vue-json-document 包含了完整的文档，安装后即可访问。

## 🗂️ 包含的文档文件

安装后，以下文档会包含在您的 `node_modules/vue-json-document/` 中：

- `docs/LIB_USAGE.md` - 详细使用指南
- `docs/LOCAL_DEVELOPMENT.md` - 本地开发指南  
- `README.md` - 项目介绍

## 🔍 访问文档的方式

### 1. 直接文件访问

```bash
# 查看使用文档
cat node_modules/vue-json-document/docs/LIB_USAGE.md

# 在编辑器中打开
code node_modules/vue-json-document/docs/LIB_USAGE.md
```

### 2. 程序化访问

```javascript
import { docs } from 'vue-json-document'

// 显示帮助信息
docs.showHelp()

// 获取快速开始示例
const example = docs.getQuickStartExample()
console.log(example.template)
console.log(example.script)

// 在Node.js环境中显示文档内容
await docs.openUsageDocs()

// 获取文档路径（用于构建工具或脚本）
const usagePath = docs.getUsageDocsPath()    // 'vue-json-document/docs/usage'
const devPath = docs.getDevDocsPath()        // 'vue-json-document/docs/development'
```

### 3. ES模块直接导入

```javascript
// 直接导入文档文件（某些构建工具支持）
import usageDocs from 'vue-json-document/docs/usage'
import devDocs from 'vue-json-document/docs/development'
```

## 🛠️ 在构建工具中使用

### Vite

```javascript
// vite.config.js
export default {
  resolve: {
    alias: {
      '@docs': 'vue-json-document/docs/'
    }
  }
}
```

### Webpack

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      '@docs': path.resolve(__dirname, 'node_modules/vue-json-document/docs/')
    }
  }
}
```

## 📋 实际使用示例

### 在开发工具中显示帮助

```javascript
// 在项目的开发脚本中
import { docs } from 'vue-json-document'

console.log('🚀 开始使用 Vue JSON Document')
docs.showHelp()

// 获取并显示快速开始代码
const example = docs.getQuickStartExample()
console.log('\n📝 快速开始模板:')
console.log(example.template)
console.log(example.script)
```

### 在项目文档中引用

```markdown
<!-- 在您的项目README中 -->
## 使用的组件库文档

本项目使用了 vue-json-document 组件库。

详细使用说明请查看：`node_modules/vue-json-document/docs/LIB_USAGE.md`

或者通过程序访问：
\`\`\`javascript
import { docs } from 'vue-json-document'
docs.showHelp()
\`\`\`
```

### 在IDE扩展或开发工具中

```javascript
// 在VSCode扩展或其他开发工具中
import { docs } from 'vue-json-document'
import { readFileSync } from 'fs'

// 读取文档内容用于智能提示或帮助面板
const usagePath = docs.getUsageDocsPath()
const docContent = readFileSync(`node_modules/${usagePath}`, 'utf-8')

// 解析并在开发工具中显示
displayHelp(docContent)
```

## 🎯 优势

✅ **离线可用** - 文档随包安装，无需网络连接  
✅ **版本一致** - 文档与安装的包版本完全匹配  
✅ **程序化访问** - 可以在工具和脚本中自动化使用  
✅ **多种访问方式** - 支持文件系统、模块导入、程序API等方式  
✅ **构建工具友好** - 支持在各种构建工具中引用

这样，任何安装了 vue-json-document 的项目都能轻松访问到最新、最准确的使用文档！