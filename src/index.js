// Vue JSON Document System
// A Vue 3 component library for dynamic JSON document rendering with inline editing

import JsonDocument from './components/JsonDocument.vue'
import NodeRenderer from './components/NodeRenderer.vue'
import EditableField from './components/EditableField.vue'
import ArrayControl from './components/ArrayControl.vue'

// Store
import { useDocumentStore } from './stores/document'

// Utilities
import * as schemaUtils from './utils/schema'
import * as docs from './docs'

// Export individual components
export {
  JsonDocument,
  NodeRenderer,
  EditableField,
  ArrayControl,
  useDocumentStore,
  schemaUtils,
  docs
}

// Export as a plugin for Vue.use()
export default {
  install(app) {
    app.component('JsonDocument', JsonDocument)
    app.component('NodeRenderer', NodeRenderer)
    app.component('EditableField', EditableField)
    app.component('ArrayControl', ArrayControl)
  }
}

// Version info
export const version = '__VERSION__'