import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import JsonDocument from '../JsonDocument.vue'
import EditableField from '../EditableField.vue'

describe('Preview Mode Integration', () => {
  let wrapper
  let pinia

  const mockJsonData = {
    title: 'Original Title',
    content: 'Original content',
    nested: {
      field: 'Nested value'
    },
    items: ['item1', 'item2']
  }

  const mockPresentationSchema = {
    rules: {
      '$.title': {
        tag: 'h1',
        editor: 'input',
      },
      '$.content': {
        tag: 'p',
        editor: 'textarea',
      },
      '$.nested.field': {
        tag: 'span',
        editor: 'input',
      },
      '$.items[*]': {
        tag: 'li',
        editor: 'input',
      },
    },
  }

  beforeEach(() => {
    pinia = createPinia()
    wrapper = mount(JsonDocument, {
      props: {
        jsonData: mockJsonData,
        presentationSchema: mockPresentationSchema,
      },
      global: {
        plugins: [pinia],
      },
    })
  })

  describe('Data Flow in Preview Mode', () => {
    it('maintains original data unchanged during preview', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Preview Title'
        },
        {
          op: 'replace',
          path: '/content',
          value: 'Preview content'
        }
      ]

      // Store original data reference
      const originalDataBeforePreview = JSON.stringify(wrapper.vm.originalData)

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      // Original data should remain unchanged
      expect(JSON.stringify(wrapper.vm.originalData)).toBe(originalDataBeforePreview)
      
      // But rendered data should show changes
      expect(wrapper.vm.documentStore.document.title).toBe('Preview Title')
      expect(wrapper.vm.documentStore.document.content).toBe('Preview content')
    })

    it('correctly handles nested path changes', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/nested/field',
          value: 'New nested value'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.vm.documentStore.document.nested.field).toBe('New nested value')
      expect(wrapper.vm.originalData.nested.field).toBe('Nested value')
    })

    it('handles array operations in preview', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/items/0',
          value: 'modified item1'
        },
        {
          op: 'add',
          path: '/items/-',
          value: 'new item'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.vm.documentStore.document.items[0]).toBe('modified item1')
      expect(wrapper.vm.documentStore.document.items[2]).toBe('new item')
      expect(wrapper.vm.documentStore.document.items.length).toBe(3)
      
      // Original should be unchanged
      expect(wrapper.vm.originalData.items.length).toBe(2)
      expect(wrapper.vm.originalData.items[0]).toBe('item1')
    })

    it('reverts all changes correctly on reject', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Changed Title'
        },
        {
          op: 'replace',
          path: '/nested/field',
          value: 'Changed nested'
        },
        {
          op: 'replace',
          path: '/items/1',
          value: 'changed item2'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      // Verify changes are applied
      expect(wrapper.vm.documentStore.document.title).toBe('Changed Title')
      expect(wrapper.vm.documentStore.document.nested.field).toBe('Changed nested')
      expect(wrapper.vm.documentStore.document.items[1]).toBe('changed item2')

      wrapper.vm.rejectChanges()
      await nextTick()

      // All changes should be reverted
      expect(wrapper.vm.documentStore.document.title).toBe('Original Title')
      expect(wrapper.vm.documentStore.document.content).toBe('Original content')
      expect(wrapper.vm.documentStore.document.nested.field).toBe('Nested value')
      expect(wrapper.vm.documentStore.document.items[1]).toBe('item2')
    })

    it('persists changes correctly on accept', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Accepted Title'
        },
        {
          op: 'replace',
          path: '/content',
          value: 'Accepted content'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      // Changes should be applied to original data
      expect(wrapper.vm.originalData.title).toBe('Accepted Title')
      expect(wrapper.vm.originalData.content).toBe('Accepted content')
      
      // Document store should also reflect changes
      expect(wrapper.vm.documentStore.document.title).toBe('Accepted Title')
      expect(wrapper.vm.documentStore.document.content).toBe('Accepted content')
    })
  })

  describe('State Management', () => {
    it('tracks preview state correctly', async () => {
      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(wrapper.vm.highlightedPaths).toEqual([])

      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'New Title'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.vm.isPreviewing).toBe(true)
      expect(wrapper.vm.highlightedPaths).toEqual(['/title'])

      wrapper.vm.rejectChanges()
      await nextTick()

      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(wrapper.vm.highlightedPaths).toEqual([])
    })

    it('tracks multiple highlighted paths', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'New Title'
        },
        {
          op: 'replace',
          path: '/content',
          value: 'New Content'
        },
        {
          op: 'replace',
          path: '/nested/field',
          value: 'New Field'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.vm.highlightedPaths).toEqual([
        '/title',
        '/content',
        '/nested/field'
      ])
    })

    it('prevents regular updates during preview mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      // Enter preview mode
      wrapper.vm.previewChanges([{
        op: 'replace',
        path: '/title',
        value: 'Preview Title'
      }])
      await nextTick()

      // Try to make regular update
      wrapper.vm.handleUpdate({
        op: 'replace',
        path: '/content',
        value: 'Should be ignored'
      })
      await nextTick()

      expect(consoleSpy).toHaveBeenCalledWith('🔧 JsonDocument - Update ignored (in preview mode)')
      expect(wrapper.vm.documentStore.document.content).toBe('Original content')

      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('handles malformed patches gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error')

      // Test with invalid patch
      wrapper.vm.previewChanges([{
        op: 'invalid',
        path: '/title'
        // missing value
      }])
      await nextTick()

      // Should not enter preview mode due to validation
      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Invalid patch format provided to previewChanges')
      
      consoleSpy.mockRestore()
    })

    it('handles non-existent paths gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error')

      const testPatch = [
        {
          op: 'replace',
          path: '/nonexistent/path',
          value: 'Should fail'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      // Should not enter preview mode due to patch validation failure
      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Patch validation failed:', 'Cannot read properties of undefined (reading \'path\')')
      
      consoleSpy.mockRestore()
    })

    it('recovers from accept failures', async () => {
      // Create a patch that will fail during accept
      const testPatch = [
        {
          op: 'test',
          path: '/title',
          value: 'wrong value'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      const consoleSpy = vi.spyOn(console, 'error')

      wrapper.vm.acceptChanges()
      await nextTick()

      // Should handle error gracefully
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Integration with Child Components', () => {
    it('provides highlighted paths to EditableField components', async () => {
      // Find an EditableField component in the rendered tree
      const editableField = wrapper.findComponent(EditableField)
      if (editableField.exists()) {
        const testPatch = [
          {
            op: 'replace',
            path: editableField.props('path'),
            value: 'New Value'
          }
        ]

        wrapper.vm.previewChanges(testPatch)
        await nextTick()

        // The EditableField should be highlighted
        expect(editableField.vm.isHighlighted).toBe(true)
      }
    })

    it('updates child components when exiting preview mode', async () => {
      const editableField = wrapper.findComponent(EditableField)
      if (editableField.exists()) {
        const fieldPath = editableField.props('path')
        const testPatch = [
          {
            op: 'replace',
            path: fieldPath,
            value: 'Preview Value'
          }
        ]

        wrapper.vm.previewChanges(testPatch)
        await nextTick()

        expect(editableField.vm.isHighlighted).toBe(true)

        wrapper.vm.rejectChanges()
        await nextTick()

        expect(editableField.vm.isHighlighted).toBe(false)
      }
    })
  })
})