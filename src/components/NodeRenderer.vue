<template>
  <div
    style="position: relative"
    @mouseenter="!readonly && (isHovering = true)"
    @mouseleave="!readonly && (isHovering = false)"
  >
    <ArrayControl
      v-if="!readonly && isHovering && arrayContext"
      :array-path="arrayContext.arrayPath"
      :item-path="arrayContext.itemPath"
      @patch="handleUpdate"
    />

    <component :is="renderTag" v-bind="tagAttributes">
      <!-- Static content before -->
      <template v-for="item in staticBefore" :key="`before-${item.tag}-${item.content}`">
        <component :is="item.tag">{{ item.content }}</component>
      </template>

      <!-- Main content -->
      <template v-if="isLeaf">
        <EditableField
          :path="path"
          :value="dataNode"
          :editor-config="matchingRule?.editor"
          @update="handleUpdate"
        />
      </template>

      <template v-else-if="isArray">
        <NodeRenderer
          v-for="(item, index) in dataNode"
          :key="index"
          :path="path === '/' ? `/${index}` : `${path}/${index}`"
          :schema="schema"
          @update="handleUpdate"
        />
      </template>

      <template v-else-if="isObject">
        <NodeRenderer
          v-for="(value, key) in dataNode"
          :key="key"
          :path="path === '/' ? `/${key}` : `${path}/${key}`"
          :schema="schema"
          @update="handleUpdate"
        />
      </template>

      <!-- Static content after -->
      <template v-for="item in staticAfter" :key="`after-${item.tag}-${item.content}`">
        <component :is="item.tag">{{ item.content }}</component>
      </template>
    </component>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import JSONPath from 'jsonpath'
import EditableField from './EditableField.vue'
import ArrayControl from './ArrayControl.vue'

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
  schema: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update'])

const documentStore = inject('documentStore')
const readonly = inject('readonly', ref(false))
const isHovering = ref(false)

// Get the data node at the current path
const dataNode = computed(() => {
  return documentStore.getNodeByPointer(props.path)
})

// Type checking utilities
const isLeaf = computed(() => {
  const node = dataNode.value
  return node !== null && node !== undefined && typeof node !== 'object'
})

const isArray = computed(() => {
  return Array.isArray(dataNode.value)
})

const isObject = computed(() => {
  const node = dataNode.value
  return node !== null && typeof node === 'object' && !Array.isArray(node)
})

// Find matching rule from presentation schema
const matchingRule = computed(() => {
  if (!props.schema.rules || !documentStore.document) return null

  // Find the first rule that matches
  for (const [rulePattern, rule] of Object.entries(props.schema.rules)) {
    if (matchesPattern(rulePattern, props.path)) {
      return rule
    }
  }

  return null
})

// Find layout rule
const layoutRule = computed(() => {
  return props.schema.layout?.[props.path] || null
})

// Determine the render tag
const renderTag = computed(() => {
  return matchingRule.value?.tag || layoutRule.value?.tag || 'div'
})

// Compute tag attributes
const tagAttributes = computed(() => {
  const attributes = {}

  // Handle special attributes like img src
  if (matchingRule.value?.useValueAs && isLeaf.value) {
    attributes[matchingRule.value.useValueAs] = dataNode.value
  }

  return attributes
})

// Static content
const staticBefore = computed(() => {
  return layoutRule.value?.static?.before || []
})

const staticAfter = computed(() => {
  return layoutRule.value?.static?.after || []
})

// Array context detection
const arrayContext = computed(() => {
  // Case 1: The current node is an array.
  if (isArray.value) {
    return { arrayPath: props.path, itemPath: null }
  }

  // Case 2: The parent of the current node is an array.
  const pathSegments = props.path.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const parentPath = '/' + pathSegments.slice(0, -1).join('/')
    const parentNode = documentStore.getNodeByPointer(parentPath)
    if (Array.isArray(parentNode)) {
      return { arrayPath: parentPath, itemPath: props.path }
    }
  }

  return null
})

// Helper functions
function matchesPattern(rulePattern, pointer) {
  if (!documentStore.document) return false

  try {
    // The `jsonpath` library's `nodes` method returns an array of nodes,
    // each with a `path` property like ['$', 'prop', 0, 'name'].
    // We need to convert this array to a standard JSON Pointer string like '/prop/0/name'.
    const jsonPathToJSONPointer = (pathArray) => {
      if (!pathArray || pathArray.length <= 1) {
        return '/'
      }
      return '/' + pathArray.slice(1).join('/')
    }

    const matchingNodes = JSONPath.nodes(documentStore.document, rulePattern)
    const matchingPointers = matchingNodes.map((node) => jsonPathToJSONPointer(node.path))

    return matchingPointers.includes(pointer)
  } catch (error) {
    console.warn(`Error matching JSONPath rule '${rulePattern}' for pointer '${pointer}':`, error)
    return false
  }
}

function handleUpdate(patch) {
  emit('update', patch)
}
</script>

<style scoped>
/* Basic styling for rendered elements */
</style>
