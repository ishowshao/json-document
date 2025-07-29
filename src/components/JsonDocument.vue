<template>
  <div class="json-document">
    <NodeRenderer
      v-if="hasValidData"
      :path="'/'"
      :schema="presentationSchema"
      @update="handleUpdate"
    />
    <div v-else class="error-message">
      <p>Unable to render document</p>
      <ul v-if="documentStore.errors.length > 0">
        <li v-for="error in documentStore.errors" :key="error">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, provide, onMounted, ref } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { applyPatch, deepClone } from 'fast-json-patch'
import NodeRenderer from './NodeRenderer.vue'

const props = defineProps({
  jsonData: {
    type: Object,
    required: true,
  },
  presentationSchema: {
    type: Object,
    required: true,
  },
  documentSchema: {
    type: Object,
    default: null,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['change', 'preview-start', 'preview-accept', 'preview-reject'])

const documentStore = useDocumentStore()

// Preview mode state
const isPreviewing = ref(false)
const previewPatch = ref(null)
const highlightedPaths = ref(new Set())
const originalData = ref(null)

// Computed property for rendered data (core of preview mode)
const renderedData = computed(() => {
  if (isPreviewing.value && previewPatch.value && originalData.value) {
    // Apply preview patch to original data
    const previewData = deepClone(originalData.value)
    try {
      const patchArray = Array.isArray(previewPatch.value) ? previewPatch.value : [previewPatch.value]
      applyPatch(previewData, patchArray)
      return previewData
    } catch (error) {
      console.error('Preview patch application failed:', error)
      return originalData.value
    }
  }
  return originalData.value || props.jsonData
})

const hasValidData = computed(() => {
  return documentStore.hasDocument && props.presentationSchema && props.presentationSchema.rules
})

// Initialize store when component mounts or props change
onMounted(() => {
  initializeDocument()
})

watch(
  () => props.jsonData,
  () => {
    initializeDocument()
  },
  { deep: true },
)

watch(
  () => props.documentSchema,
  () => {
    if (props.documentSchema) {
      documentStore.setDocumentSchema(props.documentSchema)
    }
  },
  { immediate: true },
)

// Update document store when rendered data changes
watch(
  renderedData,
  (newData) => {
    if (newData) {
      documentStore.setDocument(newData)
    }
  },
  { deep: true }
)

function initializeDocument() {
  if (props.jsonData) {
    // Initialize original data reference
    originalData.value = deepClone(props.jsonData)
    documentStore.setDocument(renderedData.value)
  }
  if (props.documentSchema) {
    documentStore.setDocumentSchema(props.documentSchema)
  }
}

function handleUpdate(patch) {
  // In preview mode, ignore regular updates
  if (isPreviewing.value) {
    console.log('🔧 JsonDocument - Update ignored (in preview mode)')
    return
  }
  
  console.log('🔧 JsonDocument - Received patch:', patch)
  console.log(
    '📄 JsonDocument - Current document before patch:',
    JSON.parse(JSON.stringify(documentStore.document)),
  )

  const success = documentStore.applyPatch(patch)

  if (success) {
    console.log('✅ JsonDocument - Patch applied successfully!')
    console.log(
      '📄 JsonDocument - Updated document after patch:',
      JSON.parse(JSON.stringify(documentStore.document)),
    )
    // Update original data with the change
    originalData.value = deepClone(documentStore.document)
    emit('change', originalData.value)
  } else {
    console.error('❌ JsonDocument - Failed to apply patch:', patch, documentStore.errors)
  }
}

// Preview mode methods
function previewChanges(patch) {
  if (!patch || (!Array.isArray(patch) && typeof patch !== 'object')) {
    console.error('Invalid patch provided to previewChanges')
    return
  }

  try {
    // Validate patch format before proceeding
    const patchArray = Array.isArray(patch) ? patch : [patch]
    const isValidPatch = patchArray.every(p => 
      p && typeof p === 'object' && p.op && 
      (p.op === 'remove' || (p.hasOwnProperty('value') || p.op === 'test'))
    )
    
    if (!isValidPatch) {
      console.error('Invalid patch format provided to previewChanges')
      return
    }

    // Test patch application without side effects
    try {
      const testData = deepClone(originalData.value)
      applyPatch(testData, patchArray)
    } catch (patchError) {
      console.error('Patch validation failed:', patchError.message)
      return
    }
    
    // Store the patch
    previewPatch.value = patch
    
    // Extract paths for highlighting
    const paths = new Set()
    patchArray.forEach(p => {
      if (p.path) {
        paths.add(p.path)
      }
    })
    highlightedPaths.value = paths
    
    // Enter preview mode
    isPreviewing.value = true
    
    console.log('🔍 JsonDocument - Preview mode started with patch:', patch)
    emit('preview-start', { patch, highlightedPaths: Array.from(paths) })
  } catch (error) {
    console.error('Failed to start preview mode:', error)
  }
}

// Private helper function to reset preview state
function _resetPreviewState() {
  isPreviewing.value = false
  previewPatch.value = null
  highlightedPaths.value.clear()
}

function acceptChanges() {
  if (!isPreviewing.value || !previewPatch.value) {
    console.error('Cannot accept changes: not in preview mode')
    return
  }

  try {
    // Apply the patch to original data
    const patchArray = Array.isArray(previewPatch.value) ? previewPatch.value : [previewPatch.value]
    applyPatch(originalData.value, patchArray)
    
    console.log('✅ JsonDocument - Changes accepted and applied to original data')
    
    // Emit events
    emit('preview-accept', { patch: previewPatch.value })
    emit('change', originalData.value)
    
    // Clean up preview state without triggering reject event
    _resetPreviewState()
  } catch (error) {
    console.error('Failed to accept changes:', error)
  }
}

function rejectChanges() {
  // Only emit reject event if we are actually in preview mode
  if (isPreviewing.value) {
    console.log('❌ JsonDocument - Changes rejected, preview mode exited')
    emit('preview-reject')
  }
  
  // Always perform cleanup
  _resetPreviewState()
}

// Expose preview methods to parent components
defineExpose({
  previewChanges,
  acceptChanges,
  rejectChanges,
  isPreviewing: computed(() => isPreviewing.value),
  highlightedPaths: computed(() => Array.from(highlightedPaths.value))
})

// Provide the update function to child components
provide('updateDocument', handleUpdate)
provide('documentStore', documentStore)
provide(
  'readonly',
  computed(() => props.readonly),
)
provide('highlightedPaths', highlightedPaths)
</script>

<style scoped>
.json-document {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
}

.error-message {
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
}

.error-message ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}
</style>
