# JSON document 需求文档

## 1. 愿景

本项目旨在创建一个灵活的、基于JSON的文档系统。核心思想是实现内容（数据）与表现（视图）的彻底分离。

用户可以通过自定义的JSON结构来存储文档内容，并通过一个独立的“展现模式”（Presentation Schema）来控制其最终渲染成的HTML形态。最终渲染出的文档将支持所见即所得的在线编辑功能。

## 2. 核心概念

系统主要由三个部分构成：数据层、表现层和映射层。

### 2.1. 数据层：JSON
文档的唯一事实来源（Single Source of Truth）是一个JSON对象。这个JSON对象的结构可以由用户根据需求自由定义。

例如，一个简单的文档可以用以下JSON表示：
```json
{
  "title": "文档系统",
  "authors": [
    "张三 (PM)"
  ],
  "paragraphs": [
    {
      "title": "概述",
      "description": "灵活的文档系统"
    },
    {
      "title": "快速上手",
      "description": "灵活的文档系统"
    }
  ]
}
```

### 2.2. 表现层：HTML
数据层的JSON最终会被渲染为语义化的HTML文档，用于在浏览器中展示给用户。

例如，上述JSON可以被渲染为如下HTML结构：
```html
<article>
    <h1>文档系统</h1>
    <address>
      <h2>作者</h2>
      <ul class="authors">
        <li class="author">张三(PM)</li>
      </ul>
    </address>

  <section id="overview">
    <h2>概述</h2>
    <p>灵活的文档系统</p>
  </section>

  <section id="getting-started">
    <h2>快速上手</h2>
    <p>灵活的文档系统</p>
  </section>
</article>
```

### 2.3. 映射层：Presentation Schema
"Presentation Schema" 是连接JSON数据和HTML视图的桥梁。它是一个可配置的规则集，定义了如何将JSON的键值对映射到HTML标签和结构。

它的主要职责包括：

*   **结构映射**: 定义JSON中的某个字段（如 `paragraphs` 数组）应如何渲染成一组HTML标签（如多个 `<section>`）。
*   **类型映射**: 定义同一个JSON对象内的不同字段（如 `title` 和 `description`）应分别渲染成何种HTML标签（如 `<h2>` 和 `<p>`）。
*   **静态内容注入**: 在渲染时添加JSON数据中不存在的静态内容（例如，HTML中的 `<h2>作者</h2>` 标题，这个文本在源JSON中并不存在）。

通过这种方式，任何结构的JSON都可以通过配置相应的Presentation Schema来转换成一份结构清晰、可编辑的文档。

## 3. 功能需求

1.  **动态渲染**: 系统必须能够接收一个JSON对象和一个Presentation Schema，并据此动态生成HTML文档。
2.  **在线编辑**: 用户可以直接在渲染后的HTML视图上进行内容编辑（所见即所得）。
3.  **数据同步**: 在HTML视图上的任何修改都必须能够实时、准确地同步回源JSON对象中。
4.  **模式可配置**: 系统应支持用户创建、修改和应用自定义的Presentation Schema，以适应不同的JSON数据结构。

