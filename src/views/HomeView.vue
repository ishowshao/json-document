<template>
  <div class="test-page">
    <!-- Top bar -->
    <header class="top-bar">
      <div class="top-bar-content">
        <h1>JSON Document System - Test Page</h1>
        <button @click="manualRefresh" class="refresh-btn" :disabled="!canRefresh">
          🔄 Refresh
        </button>
      </div>
    </header>

    <!-- Main content area -->
    <main class="main-content">
      <!-- Left side -->
      <div class="left-panel">
        <!-- JSON input -->
        <div class="input-section">
          <h3>JSON Data</h3>
          <textarea
            v-model="jsonInput"
            class="json-input"
            placeholder="Enter JSON data here..."
          ></textarea>
        </div>

        <!-- Presentation Schema input -->
        <div class="input-section">
          <h3>Presentation Schema</h3>
          <textarea
            v-model="schemaInput"
            class="schema-input"
            placeholder="Enter presentation schema here..."
          ></textarea>
        </div>
      </div>

      <!-- Right side -->
      <div class="right-panel">
        <!-- Rendered HTML -->
        <div class="output-section">
          <h3>Rendered Output</h3>
          <div class="rendered-output">
            <JsonDocument
              v-if="parsedJsonData && parsedSchema"
              :json-data="parsedJsonData"
              :presentation-schema="parsedSchema"
              :document-schema="documentSchema"
            />
            <div v-else class="placeholder">
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

<style scoped>
.test-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent page scrolling */
}

.top-bar {
  background: #2c3e50;
  color: white;
  padding: 1rem;
}

.top-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.top-bar h1 {
  margin: 0;
  font-size: 1.5rem;
}

.refresh-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2980b9;
}

.refresh-btn:disabled {
  background: #7f8c8d;
  cursor: not-allowed;
  opacity: 0.6;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  min-height: 0; /* Crucial for nested flex + overflow */
  overflow: hidden; /* Prevent main content from scrolling */
}

.left-panel,
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0; /* Allow shrinking */
  overflow: hidden; /* Prevent panel scrolling */
}

.input-section,
.output-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  min-height: 0; /* Allow shrinking */
  overflow: hidden; /* Let child elements handle scrolling */
}

.input-section h3,
.output-section h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.json-input,
.schema-input {
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  resize: none;
  overflow: auto; /* Enable scrolling for textareas */
  min-height: 0; /* Allow shrinking */
}

.rendered-output {
  flex: 1;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  overflow: auto; /* Make this area scrollable */
  background: #fafafa;
  min-height: 0; /* Allow shrinking */
}

.placeholder {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.html-structure {
  flex: 1;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  background: #f8f8f8;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
