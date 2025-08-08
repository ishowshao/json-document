import { defineStore } from 'pinia'
import JSONPath from 'jsonpath'
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

    // Provide JSONPath querying capability (optional helper)
    getNodesByJSONPath: (state) => (jsonPath) => {
      if (!state.document) return []
      try {
        return JSONPath.nodes(state.document, jsonPath)
      } catch (error) {
        console.warn(`Error querying JSONPath '${jsonPath}':`, error)
        return []
      }
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
        console.log('🏪 DocumentStore - Starting patch application')
        console.log(
          '🏪 DocumentStore - Original document:',
          JSON.parse(JSON.stringify(this.document)),
        )

        // Clone the current document
        const clonedDocument = deepClone(this.document)

        // Apply the patch to the clone
        const patchArray = Array.isArray(patch) ? patch : [patch]
        console.log('🏪 DocumentStore - Applying patch array:', patchArray)
        applyPatch(clonedDocument, patchArray)

        console.log(
          '🏪 DocumentStore - Document after patch application:',
          JSON.parse(JSON.stringify(clonedDocument)),
        )

        // If we have a document schema, validate the result
        if (this.documentSchema) {
          console.log('🏪 DocumentStore - Validating with document schema...')
          const validationResult = this.documentSchema.safeParse(clonedDocument)
          if (!validationResult.success) {
            console.log('❌ DocumentStore - Validation failed:', validationResult.error.message)
            this.errors.push(`Validation failed: ${validationResult.error.message}`)
            return false
          }
          console.log('✅ DocumentStore - Document schema validation passed')
        } else {
          console.log('🏪 DocumentStore - No document schema provided, skipping validation')
        }

        // If validation passes (or no schema), update the document
        this.document = clonedDocument
        this.errors = []
        console.log('🏪 DocumentStore - Document updated successfully in store')
        return true
      } catch (error) {
        console.log('❌ DocumentStore - Error during patch application:', error.message)
        this.errors.push(`Patch application failed: ${error.message}`)
        return false
      }
    },

    clearErrors() {
      this.errors = []
    },
  },
})
