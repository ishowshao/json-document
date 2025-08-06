import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

import tailwindcss from '@tailwindcss/vite'

// Custom plugin to copy type definitions
const copyTypesPlugin = () => ({
  name: 'copy-types',
  writeBundle() {
    copyFileSync(
      resolve(__dirname, 'src/index.d.ts'),
      resolve(__dirname, 'dist/index.d.ts')
    )
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), copyTypesPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      // 库的入口文件
      entry: resolve(__dirname, 'src/index.js'),
      name: 'JsonDocument',
      // 输出文件名
      fileName: (format) => `json-document.${format}.js`,
      formats: ['es', 'umd', 'cjs']
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'pinia'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          pinia: 'Pinia'
        },
        // 禁用named和default export混合的警告
        exports: 'named',
        // 为每种格式提供单独的输出配置
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'vue-json-document.css'
          }
          return assetInfo.name
        }
      }
    },
    // 生成 source map
    sourcemap: true,
    // 清空输出目录
    emptyOutDir: true,
    // 输出目录
    outDir: 'dist'
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0')
  }
})