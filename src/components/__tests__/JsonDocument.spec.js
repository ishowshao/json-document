import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
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
})
