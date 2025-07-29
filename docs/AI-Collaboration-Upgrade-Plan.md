# JsonDocument 组件升级技术方案：支持 AI 协同编辑

## 1. 背景

为了支持使用者提出的人机协同编辑新场景，我们的 `JsonDocument` 组件需要升级。核心需求是：由AI系统生成的 `JSON Patch` 变更集，在应用到文档之前，需要先在界面上进行“高亮预览”，并由用户手动“接受”或“拒绝”。

本文档旨在详细阐述实现此功能所需的组件内部架构变更和技术实现方案，作为开发团队的实施指南。

## 2. 核心设计思想：预览模式 (Preview Mode)

我们将引入一个“预览模式”作为核心机制。当组件进入此模式时，它会基于当前的文档状态，虚拟地应用一组 `JSON Patch`，并渲染出变更后的效果，但不会修改原始的文档数据。这个模式是完全可逆的，可以通过接受变更来固化它，也可以通过拒绝变更来无痕撤销。

## 3. 组件内部实现方案

为了实现预览模式，我们将对组件的状态管理、API、渲染逻辑和数据流进行升级。

### 3.1. 状态管理升级 (`JsonDocument.vue`)

我们需要在 `JsonDocument.vue` 的 `<script setup>` 中引入新的响应式状态来管理预览流程：

```javascript
import { ref, computed, provide } from 'vue';
import { applyPatch, deepClone } from 'fast-json-patch';

// ... 现有 props 和 state

// 新增状态
const isPreviewing = ref(false); // 是否处于预览模式
const previewPatch = ref(null); // 存储待预览的 JSON Patch 数组
const highlightedPaths = ref(new Set()); // 存储所有被 patch 影响的 JSON Pointer 路径，用于高亮

// 对原始数据源的引用
// 假设 props.jsonData 是传入的原始数据
const originalData = ref(deepClone(props.jsonData)); 

// 计算属性，决定最终渲染的数据
// 这是本次升级的关键，渲染器将始终从此 computed 获取数据
const renderedData = computed(() => {
  if (isPreviewing.value && previewPatch.value) {
    // 如果在预览模式，克隆原始数据并应用预览补丁
    const previewData = deepClone(originalData.value);
    return applyPatch(previewData, previewPatch.value);
  }
  // 否则，返回原始数据
  return originalData.value;
});
```

**关键变更**:
-   我们不再直接渲染 `props.jsonData`。所有渲染都将通过 `renderedData` 这个 `computed` 属性。
-   `originalData` 将作为我们稳定、不可变的“事实来源”。所有永久性变更都将应用在它上面。
-   `isPreviewing` 作为全局开关，控制整个组件的行为模式。

### 3.2. 新增组件 API

我们将通过 `defineExpose` 暴露新的方法，并定义新的事件来与外部使用者通信。

#### 3.2.1. 暴露方法 (Exposed Methods)

```javascript
// 在 JsonDocument.vue 的 <script setup> 中
defineExpose({
  previewChanges,
  acceptChanges,
  rejectChanges
});
```

-   **`previewChanges(patch: JSONPatch[])`**:
    1.  验证传入的 `patch` 是否为有效数组。
    2.  将 `patch` 存入 `previewPatch` ref。
    3.  解析 `patch` 数组，提取所有 `path` 字段，并填充到 `highlightedPaths` 这个 `Set` 中。
    4.  设置 `isPreviewing.value = true`。
    5.  触发 `@preview-start` 事件。

-   **`acceptChanges()`**:
    1.  检查当前是否处于预览模式，以及 `previewPatch` 是否存在。
    2.  使用 `applyPatch` 将 `previewPatch.value` **正式应用**到 `originalData.value` 上。
    3.  调用 `rejectChanges()` 的逻辑来清理所有预览状态。
    4.  触发 `@preview-accept` 事件。
    5.  触发已有的 `@change` 事件，并传递新的 `originalData`，以保持与现有行为的兼容性。

-   **`rejectChanges()`**:
    1.  重置所有预览状态：
        *   `isPreviewing.value = false`
        *   `previewPatch.value = null`
        *   `highlightedPaths.value.clear()`
    2.  触发 `@preview-reject` 事件。

#### 3.2.2. 新增事件 (Emits)

```javascript
// 在 JsonDocument.vue 的 <script setup> 中
const emit = defineEmits(['change', 'preview-start', 'preview-accept', 'preview-reject']);
```

-   `@preview-start`: 调用 `previewChanges` 成功后触发。
-   `@preview-accept`: 调用 `acceptChanges` 成功后触发。
-   `@preview-reject`: 调用 `rejectChanges` 后触发。

### 3.3. 高亮机制实现

高亮机制将通过 `provide`/`inject` 实现，以避免深层级的 props 钻透。

1.  **`JsonDocument.vue` (Provider)**:
    ```javascript
    // ...
    provide('highlightedPaths', highlightedPaths);
    // ...
    ```

2.  **`EditableField.vue` (Injector)**:
    `EditableField` 是最终渲染叶子节点的地方，也是应用高亮的最佳位置。
    ```javascript
    // 在 EditableField.vue 的 <script setup> 中
    import { inject, computed } from 'vue';

    const props = defineProps({
      path: String, // 组件已有的 path prop
      // ...其他 props
    });

    const highlightedPaths = inject('highlightedPaths', ref(new Set())); // 注入高亮路径集合

    const isHighlighted = computed(() => {
      return highlightedPaths.value.has(props.path);
    });

    // 在 <template> 中
    // <span :class="{ 'json-document-highlight': isHighlighted }"> ... </span>
    ```
    我们将定义一个全局的 `.json-document-highlight` CSS 类，使用者可以轻松地覆盖它来实现自定义高亮样式。

## 4. 总结

本次升级的核心是引入一个受控的、非破坏性的“预览模式”。通过增加新的内部状态、暴露控制方法、并利用 `provide`/`inject` 实现精确的高亮，我们可以用最小的架构侵入性来满足新的业务需求，同时保持了组件良好的封装性和可扩展性。
