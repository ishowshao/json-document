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
import { computed, watch, provide, onMounted } from 'vue'
import { useDocumentStore } from '@/stores/document'
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
})

const documentStore = useDocumentStore()

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

function initializeDocument() {
  if (props.jsonData) {
    documentStore.setDocument(props.jsonData)
  }
  if (props.documentSchema) {
    documentStore.setDocumentSchema(props.documentSchema)
  }
}

function handleUpdate(patch) {
  console.log('🔧 JsonDocument - Received patch:', patch)
  console.log('📄 JsonDocument - Current document before patch:', JSON.parse(JSON.stringify(documentStore.document)))
  
  const success = documentStore.applyPatch(patch)
  
  if (success) {
    console.log('✅ JsonDocument - Patch applied successfully!')
    console.log('📄 JsonDocument - Updated document after patch:', JSON.parse(JSON.stringify(documentStore.document)))
  } else {
    console.error('❌ JsonDocument - Failed to apply patch:', patch, documentStore.errors)
  }
}

// Provide the update function to child components
provide('updateDocument', handleUpdate)
provide('documentStore', documentStore)
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
