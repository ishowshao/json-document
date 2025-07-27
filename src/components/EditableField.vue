<template>
  <span
    v-if="!isEditing"
    class="editable-field"
    :class="{ 'editable-hover': isHovering }"
    @click="startEditing"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    {{ displayValue }}
  </span>

  <component
    v-else
    :is="editorComponent"
    ref="editorRef"
    :value="internalValue"
    @input="internalValue = $event.target.value"
    class="editor-active"
    @blur="finishEditing"
    @keydown.enter.prevent="finishEditing"
    @keydown.esc="cancelEditing"
    v-bind="editorProps"
  />
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

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

<style scoped>
.editable-field {
  display: inline-block;
  min-width: 20px;
  min-height: 1.2em;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.editable-field:hover,
.editable-hover {
  background: rgba(59, 130, 246, 0.1);
  outline: 1px solid rgba(59, 130, 246, 0.3);
}

.editor-active {
  border: 2px solid #3b82f6;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: inherit;
  font-size: inherit;
  outline: none;
  background: white;
  min-width: 100px;
}

.editor-active:focus {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea.editor-active {
  resize: vertical;
  width: 200px;
}
</style>
