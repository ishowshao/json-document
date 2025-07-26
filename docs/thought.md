我要做的是一个基于json的文档系统，
思路是这样的，文档的数据结构是json，这是底层结构，这个json可以渲染成为html结构，语义化的，
比如<h2>表示二级标题，<p>表示段落等。
可以内连编辑渲染后的文档。
我们设想这样一个场景。
有一个json
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
它渲染出来可以是这样的一段html结构
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

设想中，有一个Presentation Schema用于控制展现。Presentation Schema具体解决什么问题呢？你观察authors这个数组结构，并没有任何一个value对应<h2>作者</h2>，还有paragraphs[*].title渲染的是<h2>，然而paragraphs[*].description 渲染的是<p>

这有什么用呢？其实就是可以定义一个json结构，结构是有规范的，可以任意自定义，然后自己配置一个Presentation Schema，就可以展现为一个可编辑的文档了，这样既可以以文档形式呈现，又可以以json这种清晰的数据结构存储