import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import JsonDocument from '../JsonDocument.vue'

describe('Preview Mode Events', () => {
  let wrapper
  let pinia

  const mockJsonData = {
    title: 'Test Title',
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

  describe('preview-start event', () => {
    it('emits preview-start when previewChanges is called', async () => {
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
      expect(wrapper.emitted('preview-start')).toHaveLength(1)
      
      const event = wrapper.emitted('preview-start')[0][0]
      expect(event.patch).toEqual(testPatch)
      expect(event.highlightedPaths).toEqual(['/title'])
    })

    it('emits preview-start with multiple paths', async () => {
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

      const event = wrapper.emitted('preview-start')[0][0]
      expect(event.highlightedPaths).toContain('/title')
      expect(event.highlightedPaths).toContain('/content')
      expect(event.highlightedPaths).toHaveLength(2)
    })

    it('emits preview-start with single patch object', async () => {
      const testPatch = {
        op: 'replace',
        path: '/title',
        value: 'Single Patch'
      }

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      const event = wrapper.emitted('preview-start')[0][0]
      expect(event.patch).toEqual(testPatch)
      expect(event.highlightedPaths).toEqual(['/title'])
    })
  })

  describe('preview-accept event', () => {
    it('emits preview-accept when acceptChanges is called', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Accepted Title'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      expect(wrapper.emitted('preview-accept')).toBeTruthy()
      expect(wrapper.emitted('preview-accept')).toHaveLength(1)
      
      const event = wrapper.emitted('preview-accept')[0][0]
      expect(event.patch).toEqual(testPatch)
    })

    it('does not emit preview-accept when not in preview mode', async () => {
      wrapper.vm.acceptChanges()
      await nextTick()

      expect(wrapper.emitted('preview-accept')).toBeFalsy()
    })

    it('emits change event after preview-accept', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/content',
          value: 'Modified content'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      expect(wrapper.emitted('change')).toBeTruthy()
      const changeEvent = wrapper.emitted('change')[0][0]
      expect(changeEvent.content).toBe('Modified content')
    })
  })

  describe('preview-reject event', () => {
    it('emits preview-reject when rejectChanges is called', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Rejected Title'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.rejectChanges()
      await nextTick()

      expect(wrapper.emitted('preview-reject')).toBeTruthy()
      expect(wrapper.emitted('preview-reject')).toHaveLength(1)
    })

    it('emits preview-reject when called during preview mode', async () => {
      // First enter preview mode
      wrapper.vm.previewChanges([{
        op: 'replace',
        path: '/title',
        value: 'Test'
      }])
      await nextTick()

      wrapper.vm.rejectChanges()
      await nextTick()

      expect(wrapper.emitted('preview-reject')).toBeTruthy()
    })

    it('does not emit preview-reject when called on non-preview state', async () => {
      // Ensure we're not in preview mode
      expect(wrapper.vm.isPreviewing).toBe(false)
      
      wrapper.vm.rejectChanges()
      await nextTick()

      // Should not emit event if not in preview mode
      expect(wrapper.emitted('preview-reject')).toBeFalsy()
    })

    it('does not emit change event after preview-reject', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Should not persist'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.rejectChanges()
      await nextTick()

      expect(wrapper.emitted('change')).toBeFalsy()
    })
  })

  describe('Event sequence and timing', () => {
    it('emits events in correct order for accept flow', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Flow Test'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      const events = Object.keys(wrapper.emitted())
      expect(events).toContain('preview-start')
      expect(events).toContain('preview-accept')
      expect(events).toContain('change')
      // Note: acceptChanges no longer triggers preview-reject event

      // Check timing - preview-start should come before preview-accept
      expect(wrapper.emitted('preview-start')).toHaveLength(1)
      expect(wrapper.emitted('preview-accept')).toHaveLength(1)
      expect(wrapper.emitted('change')).toHaveLength(1)
      expect(wrapper.emitted('preview-reject')).toBeFalsy()
    })

    it('emits events in correct order for reject flow', async () => {
      const testPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Reject Flow Test'
        }
      ]

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.rejectChanges()
      await nextTick()

      expect(wrapper.emitted('preview-start')).toHaveLength(1)
      expect(wrapper.emitted('preview-reject')).toHaveLength(1)
      expect(wrapper.emitted('change')).toBeFalsy()
    })

    it('handles multiple preview cycles correctly', async () => {
      // First preview cycle
      wrapper.vm.previewChanges([{
        op: 'replace',
        path: '/title',
        value: 'First Preview'
      }])
      await nextTick()

      wrapper.vm.rejectChanges()
      await nextTick()

      // Second preview cycle
      wrapper.vm.previewChanges([{
        op: 'replace',
        path: '/content',
        value: 'Second Preview'
      }])
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      expect(wrapper.emitted('preview-start')).toHaveLength(2)
      expect(wrapper.emitted('preview-reject')).toHaveLength(1) // Only explicit reject, accept no longer triggers reject
      expect(wrapper.emitted('preview-accept')).toHaveLength(1)
      expect(wrapper.emitted('change')).toHaveLength(1)
    })
  })

  describe('Event payload validation', () => {
    it('provides correct patch data in preview-start event', async () => {
      const complexPatch = [
        {
          op: 'replace',
          path: '/title',
          value: 'Complex Title'
        },
        {
          op: 'add',
          path: '/newField',
          value: 'New Value'
        },
        {
          op: 'remove',
          path: '/content'
        }
      ]

      wrapper.vm.previewChanges(complexPatch)
      await nextTick()

      const event = wrapper.emitted('preview-start')[0][0]
      expect(event.patch).toEqual(complexPatch)
      expect(event.highlightedPaths).toContain('/title')
      expect(event.highlightedPaths).toContain('/newField')
      expect(event.highlightedPaths).toContain('/content')
    })

    it('provides correct patch data in preview-accept event', async () => {
      const testPatch = {
        op: 'replace',
        path: '/title',
        value: 'Accept Test'
      }

      wrapper.vm.previewChanges(testPatch)
      await nextTick()

      wrapper.vm.acceptChanges()
      await nextTick()

      const acceptEvent = wrapper.emitted('preview-accept')[0][0]
      expect(acceptEvent.patch).toEqual(testPatch)

      const changeEvent = wrapper.emitted('change')[0][0]
      expect(changeEvent.title).toBe('Accept Test')
    })

    it('handles patches with missing path fields gracefully', async () => {
      const invalidPatch = [
        {
          op: 'replace',
          value: 'Missing path'
        }
      ]

      wrapper.vm.previewChanges(invalidPatch)
      await nextTick()

      const event = wrapper.emitted('preview-start')[0][0]
      expect(event.highlightedPaths).toEqual([])
    })
  })
})