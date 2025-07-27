<template>
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
        :path="`${path}/${index}`"
        :schema="schema"
        @update="handleUpdate"
      />
    </template>

    <template v-else-if="isObject">
      <NodeRenderer
        v-for="(value, key) in dataNode"
        :key="key"
        :path="`${path}/${key}`"
        :schema="schema"
        @update="handleUpdate"
      />
    </template>

    <!-- Static content after -->
    <template v-for="item in staticAfter" :key="`after-${item.tag}-${item.content}`">
      <component :is="item.tag">{{ item.content }}</component>
    </template>
  </component>
</template>

<script setup>
import { computed, inject } from 'vue'
import { JSONPath } from 'jsonpath'
import EditableField from './EditableField.vue'

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

// Helper functions
function pointerToJSONPath(pointer) {
  if (pointer === '/' || pointer === '') return '$'

  const segments = pointer.split('/').slice(1)
  let path = '$'

  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      path += `[${segment}]`
    } else {
      path += `.${segment}`
    }
  }

  return path
}

function matchesPattern(rulePattern, pointer) {
  try {
    // Convert JSON Pointer to JSONPath-like format for comparison
    let pathToCheck = pointerToJSONPath(pointer)

    // Handle array patterns like $.authors[*]
    if (rulePattern.includes('[*]')) {
      // Create a regex pattern that matches specific indices for [*]
      const regexPattern = rulePattern.replace(/\./g, '\\.').replace(/\[\*\]/g, '\\[\\d+\\]')
      const regex = new RegExp('^' + regexPattern + '$')
      return regex.test(pathToCheck)
    }

    // Direct pattern matching for exact paths
    return pathToCheck === rulePattern
  } catch (error) {
    console.warn('Pattern matching error:', error)
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
