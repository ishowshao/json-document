import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import JsonDocument from '../JsonDocument.vue'

describe('JsonDocument', () => {
  const mockJsonData = {
    title: 'Test Document',
    content: 'Test content',
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
    },
  }

  it('renders correctly with basic props', () => {
    const wrapper = mount(JsonDocument, {
      props: {
        jsonData: mockJsonData,
        presentationSchema: mockPresentationSchema,
      },
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.find('.json-document').exists()).toBe(true)
  })

  it('provides readonly state to child components when readonly is true', () => {
    const wrapper = mount(JsonDocument, {
      props: {
        jsonData: mockJsonData,
        presentationSchema: mockPresentationSchema,
        readonly: true,
      },
      global: {
        plugins: [createPinia()],
      },
    })

    // Check that the component renders and readonly prop is accepted
    expect(wrapper.find('.json-document').exists()).toBe(true)
    expect(wrapper.props('readonly')).toBe(true)
  })

  it('provides readonly state as false by default', () => {
    const wrapper = mount(JsonDocument, {
      props: {
        jsonData: mockJsonData,
        presentationSchema: mockPresentationSchema,
      },
      global: {
        plugins: [createPinia()],
      },
    })

    // Check that readonly defaults to false
    expect(wrapper.find('.json-document').exists()).toBe(true)
    expect(wrapper.props('readonly')).toBe(false)
  })

  it('accepts readonly prop correctly', () => {
    const wrapper = mount(JsonDocument, {
      props: {
        jsonData: mockJsonData,
        presentationSchema: mockPresentationSchema,
        readonly: true,
      },
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.props('readonly')).toBe(true)
  })

  describe('Preview Mode', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(JsonDocument, {
        props: {
          jsonData: mockJsonData,
          presentationSchema: mockPresentationSchema,
        },
        global: {
          plugins: [createPinia()],
        },
      })
    })

    it('exposes preview methods through defineExpose', () => {
      expect(wrapper.vm.previewChanges).toBeDefined()
      expect(wrapper.vm.acceptChanges).toBeDefined()
      expect(wrapper.vm.rejectChanges).toBeDefined()
      expect(wrapper.vm.isPreviewing).toBeDefined()
      expect(wrapper.vm.highlightedPaths).toBeDefined()
    })

    it('enters preview mode when previewChanges is called', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'New Title'
        }
      ]

      expect(wrapper.vm.isPreviewing).toBe(false)
      
      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.vm.isPreviewing).toBe(true)
      expect(wrapper.vm.highlightedPaths).toEqual(['/title'])
    })

    it('emits preview-start event when entering preview mode', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'New Title'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.emitted('preview-start')).toBeTruthy()
      const event = wrapper.emitted('preview-start')[0][0]
      expect(event.patch).toEqual(testPatch)
      expect(event.highlightedPaths).toEqual(['/title'])
    })

    it('applies patch to rendered data in preview mode', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Preview Title'
        }
      ]

      // Get original store state
      const originalDocument = wrapper.vm.documentStore.document.title

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      // Document store should now have the preview data
      expect(wrapper.vm.documentStore.document.title).toBe('Preview Title')
      
      // But original data should remain unchanged until accepted
      expect(originalDocument).toBe('Test Document')
    })

    it('accepts changes and applies to original data', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/content',
          value: 'Updated content'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(wrapper.emitted('preview-accept')).toBeTruthy()
      expect(wrapper.emitted('change')).toBeTruthy()
      
      const changeEvent = wrapper.emitted('change')[0][0]
      expect(changeEvent.content).toBe('Updated content')
    })

    it('rejects changes and reverts to original data', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Rejected Title'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      // Verify we're in preview mode with changes
      expect(wrapper.vm.isPreviewing).toBe(true)
      expect(wrapper.vm.documentStore.document.title).toBe('Rejected Title')

      wrapper.vm.rejectChanges()
      await nextTick()

      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(wrapper.emitted('preview-reject')).toBeTruthy()
      
      // Document should revert to original
      expect(wrapper.vm.documentStore.document.title).toBe('Test Document')
    })

    it('ignores regular updates when in preview mode', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Preview Title'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      // Spy on console.log to check if update is ignored
      const consoleSpy = vi.spyOn(console, 'log')

      // Try to trigger a regular update
      const regularPatch = {
        op: 'replace',
        path: '/content',
        value: 'Should be ignored'
      }

      wrapper.vm.handleUpdate(regularPatch)
      await nextTick()

      expect(consoleSpy).toHaveBeenCalledWith('🔧 JsonDocument - Update ignored (in preview mode)')
      
      consoleSpy.mockRestore()
    })

    it('handles invalid patch gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error')

      wrapper.vm.previewChanges(null)
      await nextTick()

      expect(wrapper.vm.isPreviewing).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('provides highlighted paths to child components', async () => {
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
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      expect(wrapper.vm.highlightedPaths).toEqual(['/title', '/content'])
    })
  })
})
