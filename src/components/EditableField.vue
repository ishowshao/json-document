<template>
  <span
    v-if="!isEditing"
    class="inline-block min-w-5 min-h-5 rounded-sm"
    :class="{
      'cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:outline hover:outline-1 hover:outline-blue-300':
        !readonly,
      'bg-blue-50 outline outline-1 outline-blue-300': isHovering && !readonly,
      'json-document-highlight': isHighlighted,
    }"
    @click="!readonly && startEditing()"
    @mouseenter="!readonly && (isHovering = true)"
    @mouseleave="!readonly && (isHovering = false)"
  >
    {{ displayValue }}
  </span>

  <component
    v-else
    :is="editorComponent"
    ref="editorRef"
    :value="internalValue"
    @input="internalValue = $event.target.value"
    class="border-2 border-blue-500 rounded px-2 py-1 font-inherit text-inherit outline-none bg-white min-w-25 focus:border-blue-700 focus:shadow-lg focus:shadow-blue-100"
    :class="{ 'resize-y w-50': editorComponent === 'textarea' }"
    @blur="finishEditing"
    @keydown.enter.prevent="finishEditing"
    @keydown.esc="cancelEditing"
    v-bind="editorProps"
  />
</template>

<script setup>
import { ref, computed, nextTick, watch, inject } from 'vue'

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number, Boolean],
    required: true,
  },
  editorConfig: {
    type: String,
    default: 'input',
  },
})

const emit = defineEmits(['update'])

// Inject readonly state and highlighted paths
const readonly = inject('readonly', ref(false))
const highlightedPaths = inject('highlightedPaths', ref(new Set()))

// Component state
const isEditing = ref(false)
const isHovering = ref(false)
const internalValue = ref(props.value) // Initialize with current value
const editorRef = ref(null)

// Display value
const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return ''
  }
  return String(props.value)
})

// Check if this field is highlighted in preview mode
const isHighlighted = computed(() => {
  return highlightedPaths.value.has(props.path)
})

// Editor component mapping
const editorComponent = computed(() => {
  switch (props.editorConfig) {
    case 'textarea':
      return 'textarea'
    case 'input':
    default:
      return 'input'
  }
})

// Editor props
const editorProps = computed(() => {
  const baseProps = {
    type: 'text',
  }

  switch (props.editorConfig) {
    case 'textarea':
      return {
        ...baseProps,
        rows: 3,
      }
    case 'input':
    default:
      return baseProps
  }
})

// Editing functions
function startEditing() {
  // Do nothing if in readonly mode
  if (readonly.value) return

  // Ensure internal value is set to current prop value
  internalValue.value = displayValue.value
  isEditing.value = true
  isHovering.value = false

  nextTick(() => {
    if (editorRef.value) {
      editorRef.value.focus()
      // Select all text for easy replacement
      if (editorRef.value.select) {
        editorRef.value.select()
      }
    }
  })
}

function finishEditing() {
  if (internalValue.value !== props.value) {
    // Create JSON Patch operation
    const patch = {
      op: 'replace',
      path: props.path,
      value: convertValue(internalValue.value),
    }

    console.log('📝 EditableField - Generated JSON Patch:', patch)
    emit('update', patch)
  }

  isEditing.value = false
}

function cancelEditing() {
  internalValue.value = props.value
  isEditing.value = false
}

// Convert string input to appropriate type
function convertValue(stringValue) {
  const originalType = typeof props.value

  if (originalType === 'number') {
    const numValue = Number(stringValue)
    return isNaN(numValue) ? props.value : numValue
  }

  if (originalType === 'boolean') {
    return stringValue.toLowerCase() === 'true'
  }

  return stringValue
}

// Reset internal value when props change
watch(
  () => props.value,
  (newValue) => {
    if (!isEditing.value) {
      internalValue.value = newValue
    }
  },
  { immediate: true },
)
</script>

<style scoped></style>
