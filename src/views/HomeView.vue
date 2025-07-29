<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="bg-slate-700 text-white p-4">
      <div class="flex justify-between items-center max-w-6xl mx-auto">
        <h1 class="m-0 text-2xl">JSON Document System - Test Page</h1>
        <div class="flex gap-3 items-center">
          <button
            @click="toggleReadonlyMode"
            class="border-none px-4 py-2 rounded cursor-pointer text-sm transition-colors duration-200"
            :class="
              readonly
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            "
          >
            {{ readonly ? '📖 只读模式' : '✏️ 编辑模式' }}
          </button>
          <button
            @click="manualRefresh"
            class="bg-blue-500 text-white border-none px-4 py-2 rounded cursor-pointer text-sm transition-colors duration-200 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canRefresh"
          >
            🔄 Refresh
          </button>
          <button
            @click="testPreviewMode"
            class="bg-purple-500 text-white border-none px-4 py-2 rounded cursor-pointer text-sm transition-colors duration-200 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!jsonDocumentRef || readonly"
          >
            🔍 Test Preview
          </button>
          <button
            v-if="isInPreviewMode"
            @click="acceptPreview"
            class="bg-green-500 text-white border-none px-3 py-2 rounded cursor-pointer text-sm transition-colors duration-200 hover:bg-green-600"
          >
            ✅ Accept
          </button>
          <button
            v-if="isInPreviewMode"
            @click="rejectPreview"
            class="bg-red-500 text-white border-none px-3 py-2 rounded cursor-pointer text-sm transition-colors duration-200 hover:bg-red-600"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </header>

    <!-- Main content area -->
    <main class="flex-1 flex gap-4 p-4 min-h-0 overflow-hidden">
      <!-- Left side -->
      <div class="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        <!-- JSON input -->
        <div
          class="flex-1 flex flex-col border border-gray-300 rounded p-4 min-h-0 overflow-hidden"
        >
          <h3 class="m-0 mb-2 text-slate-700 text-lg">JSON Data</h3>
          <textarea
            v-model="jsonInput"
            class="flex-1 border border-gray-300 rounded p-2 font-mono text-sm resize-none overflow-auto min-h-0"
            placeholder="Enter JSON data here..."
          ></textarea>
        </div>

        <!-- Presentation Schema input -->
        <div
          class="flex-1 flex flex-col border border-gray-300 rounded p-4 min-h-0 overflow-hidden"
        >
          <h3 class="m-0 mb-2 text-slate-700 text-lg">Presentation Schema</h3>
          <textarea
            v-model="schemaInput"
            class="flex-1 border border-gray-300 rounded p-2 font-mono text-sm resize-none overflow-auto min-h-0"
            placeholder="Enter presentation schema here..."
          ></textarea>
        </div>
      </div>

      <!-- Right side -->
      <div class="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        <!-- Rendered HTML -->
        <div
          class="flex-1 flex flex-col border border-gray-300 rounded p-4 min-h-0 overflow-hidden"
        >
          <div class="flex justify-between items-center mb-2">
            <h3 class="m-0 text-slate-700 text-lg">Rendered Output</h3>
            <div v-if="isInPreviewMode" class="text-sm font-medium px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">
              🔍 Preview Mode - Changes highlighted below
            </div>
          </div>
          <div class="flex-1 border border-gray-200 rounded p-4 overflow-auto bg-gray-50 min-h-0">
            <JsonDocument
              v-if="parsedJsonData && parsedSchema"
              ref="jsonDocumentRef"
              :json-data="parsedJsonData"
              :presentation-schema="parsedSchema"
              :document-schema="documentSchema"
              :readonly="readonly"
              @change="handleDocumentChange"
              @preview-start="handlePreviewStart"
              @preview-accept="handlePreviewAccept"
              @preview-reject="handlePreviewReject"
            />
            <div v-else class="text-gray-600 italic text-center p-8">
              Enter valid JSON data and presentation schema to see rendered output
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { z } from 'zod'
import JsonDocument from '@/components/JsonDocument.vue'

// Readonly mode state
const readonly = ref(false)

// Preview mode state
const jsonDocumentRef = ref(null)
const isInPreviewMode = ref(false)

// Reactive inputs
const jsonInput = ref(`{
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
}`)

const schemaInput = ref(`{
  "rules": {
    "$.title": {
      "tag": "h1",
      "editor": "input"
    },
    "$.authors[*]": {
      "tag": "li",
      "editor": "input"
    },
    "$.paragraphs[*]": {
      "tag": "section"
    },
    "$.paragraphs[*].title": {
      "tag": "h2",
      "editor": "input"
    },
    "$.paragraphs[*].description": {
      "tag": "p",
      "editor": "textarea"
    }
  },
  "layout": {
    "/authors": {
      "tag": "ul",
      "static": {
        "before": [{ "tag": "h2", "content": "作者" }]
      }
    }
  }
}`)

// Parsed data
const parsedJsonData = ref(null)
const parsedSchema = ref(null)

// Document schema for validation
const documentSchema = markRaw(
  z.object({
    title: z.string().min(1),
    authors: z.array(z.string()),
    paragraphs: z
      .array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
        }),
      )
      .min(1),
  }),
)

// Update functions
function updateJsonData() {
  try {
    parsedJsonData.value = JSON.parse(jsonInput.value)
  } catch (e) {
    parsedJsonData.value = null
  }
}

function updateSchema() {
  try {
    parsedSchema.value = JSON.parse(schemaInput.value)
  } catch (e) {
    parsedSchema.value = null
  }
}

// Manual refresh functionality
const canRefresh = computed(() => {
  return jsonInput.value.trim() !== '' && schemaInput.value.trim() !== ''
})

function manualRefresh() {
  updateJsonData()
  updateSchema()
}

// Toggle readonly mode
function toggleReadonlyMode() {
  readonly.value = !readonly.value
}

// Preview mode functions
function testPreviewMode() {
  if (!jsonDocumentRef.value) return
  
  // Create a sample AI-generated patch for testing
  const samplePatch = [
    {
      op: 'replace',
      path: '/title',
      value: 'AI Enhanced Document System'
    },
    {
      op: 'replace',
      path: '/paragraphs/0/description',
      value: '一个由AI增强的灵活文档系统，支持智能编辑和预览功能'
    }
  ]
  
  console.log('Starting preview with sample patch:', samplePatch)
  jsonDocumentRef.value.previewChanges(samplePatch)
}

function acceptPreview() {
  if (!jsonDocumentRef.value) return
  jsonDocumentRef.value.acceptChanges()
}

function rejectPreview() {
  if (!jsonDocumentRef.value) return  
  jsonDocumentRef.value.rejectChanges()
}

// Event handlers for JsonDocument events
function handleDocumentChange(newData) {
  console.log('Document changed:', newData)
  // Update the JSON input to reflect the changes
  jsonInput.value = JSON.stringify(newData, null, 2)
}

function handlePreviewStart(event) {
  console.log('Preview started:', event)
  isInPreviewMode.value = true
}

function handlePreviewAccept(event) {
  console.log('Preview accepted:', event)
  isInPreviewMode.value = false
}

function handlePreviewReject() {
  console.log('Preview rejected')
  isInPreviewMode.value = false
}

// HTML structure display
const htmlStructure = computed(() => {
  console.log('htmlStructure', parsedJsonData.value, parsedSchema.value)
  if (!parsedJsonData.value || !parsedSchema.value) return 'No valid data to display'

  // This will be populated by the JsonDocument component
  return 'HTML structure will be displayed here'
})

// Initialize parsed data
updateJsonData()
updateSchema()
</script>

<style scoped></style>
