import { defineStore } from 'pinia'
import { applyPatch, deepClone } from 'fast-json-patch'

export const useDocumentStore = defineStore('document', {
  state: () => ({
    document: null,
    documentSchema: null,
    errors: [],
  }),

  getters: {
    hasDocument: (state) => state.document !== null,

    getNodeByPointer: (state) => (pointer) => {
      if (!state.document) return null

      if (pointer === '/' || pointer === '') {
        return state.document
      }

      const path = pointer.split('/').slice(1)
      let current = state.document

      for (const segment of path) {
        if (current === null || current === undefined) {
          return null
        }

        if (Array.isArray(current)) {
          const index = parseInt(segment, 10)
          if (isNaN(index) || index < 0 || index >= current.length) {
            return null
          }
          current = current[index]
        } else if (typeof current === 'object') {
          current = current[segment]
        } else {
          return null
        }
      }

      return current
    },
  },

  actions: {
    setDocument(newDocument) {
      this.document = newDocument
      this.errors = []
    },

    setDocumentSchema(schema) {
      this.documentSchema = schema
    },

    applyPatch(patch) {
      if (!this.document) {
        this.errors.push('No document loaded')
        return false
      }

      try {
        // Clone the current document
        const clonedDocument = deepClone(this.document)

        // Apply the patch to the clone
        const patchArray = Array.isArray(patch) ? patch : [patch]
        applyPatch(clonedDocument, patchArray)

        // If we have a document schema, validate the result
        if (this.documentSchema) {
          const validationResult = this.documentSchema.safeParse(clonedDocument)
          if (!validationResult.success) {
            this.errors.push(`Validation failed: ${validationResult.error.message}`)
            return false
          }
        }

        // If validation passes (or no schema), update the document
        this.document = clonedDocument
        this.errors = []
        return true
      } catch (error) {
        this.errors.push(`Patch application failed: ${error.message}`)
        return false
      }
    },

    clearErrors() {
      this.errors = []
    },
  },
})
