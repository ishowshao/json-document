import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EditableField from '../EditableField.vue'

describe('EditableField', () => {
  it('renders the value correctly', () => {
    const wrapper = mount(EditableField, {
      props: {
        path: '/test',
        value: 'Test Value',
        editorConfig: 'input',
      },
    })
    expect(wrapper.text()).toContain('Test Value')
  })

  it('populates input with current value when editing starts', async () => {
    const wrapper = mount(EditableField, {
      props: {
        path: '/test',
        value: 'Initial Value',
        editorConfig: 'input',
      },
    })

    // Click to start editing
    await wrapper.find('span').trigger('click')
    await nextTick()

    // Check that the input has the current value
    const input = wrapper.find('input')
    expect(input.element.value).toBe('Initial Value')
  })

  it('emits update event with patch when value changes', async () => {
    const wrapper = mount(EditableField, {
      props: {
        path: '/test',
        value: 'Original',
        editorConfig: 'input',
      },
    })

    // Start editing
    await wrapper.find('span').trigger('click')
    await nextTick()

    // Change the value
    const input = wrapper.find('input')
    await input.setValue('Modified')

    // Trigger blur to finish editing
    await input.trigger('blur')

    // Check that update event was emitted with correct patch
    expect(wrapper.emitted('update')).toBeTruthy()
    const updateEvent = wrapper.emitted('update')[0][0]
    expect(updateEvent).toEqual({
      op: 'replace',
      path: '/test',
      value: 'Modified',
    })
  })

  describe('readonly mode', () => {
    it('renders without hover effects in readonly mode', () => {
      const wrapper = mount(EditableField, {
        props: {
          path: '/test',
          value: 'Test Value',
          editorConfig: 'input',
        },
        global: {
          provide: {
            readonly: true,
          },
        },
      })

      const span = wrapper.find('span')
      expect(span.classes()).not.toContain('cursor-pointer')
      expect(span.classes()).not.toContain('hover:bg-blue-50')
    })

    it('does not enter edit mode when clicked in readonly mode', async () => {
      const wrapper = mount(EditableField, {
        props: {
          path: '/test',
          value: 'Test Value',
          editorConfig: 'input',
        },
        global: {
          provide: {
            readonly: true,
          },
        },
      })

      // Click should not start editing
      await wrapper.find('span').trigger('click')
      await nextTick()

      // Should not find any input element
      expect(wrapper.find('input').exists()).toBe(false)
      expect(wrapper.text()).toContain('Test Value')
    })

    it('does not show hover state in readonly mode', async () => {
      const wrapper = mount(EditableField, {
        props: {
          path: '/test',
          value: 'Test Value',
          editorConfig: 'input',
        },
        global: {
          provide: {
            readonly: true,
          },
        },
      })

      const span = wrapper.find('span')

      // Trigger mouseenter
      await span.trigger('mouseenter')
      await nextTick()

      // Should not have hover classes
      expect(span.classes()).not.toContain('bg-blue-50')
      expect(span.classes()).not.toContain('outline')
    })

    it('still renders value correctly in readonly mode', () => {
      const wrapper = mount(EditableField, {
        props: {
          path: '/test',
          value: 'Readonly Value',
          editorConfig: 'input',
        },
        global: {
          provide: {
            readonly: true,
          },
        },
      })

      expect(wrapper.text()).toContain('Readonly Value')
    })
  })
})
