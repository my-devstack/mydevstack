import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoResourceServerList from './CognitoResourceServerList.vue'

const createStubs = () => ({
  Button: {
    template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
    props: ['variant', 'size'],
  },
  LoadingSpinner: {
    template: '<div class="spinner" />',
    props: ['size'],
  },
  EmptyState: {
    template: '<div class="empty-state"><h3>{{ title }}</h3><p>{{ description }}</p><button v-if="actionLabel" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
    props: ['icon', 'title', 'description', 'actionLabel'],
    emits: ['action'],
  },
})

const sampleServers = [
  { Identifier: 'api.example.com', Name: 'API Server', Scopes: [{ ScopeName: 'read' }] },
]

describe('CognitoResourceServerList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders resource servers', () => {
    const wrapper = mount(CognitoResourceServerList, {
      props: { resourceServers: sampleServers },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('API Server')
    expect(wrapper.text()).toContain('api.example.com')
  })

  it('shows empty state when no resource servers', () => {
    const wrapper = mount(CognitoResourceServerList, {
      props: { resourceServers: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No resource servers')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(CognitoResourceServerList, {
      props: { resourceServers: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(CognitoResourceServerList, {
      props: { resourceServers: [], error: 'List resource servers failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List resource servers failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(CognitoResourceServerList, {
      props: { resourceServers: [] },
      global: { stubs: createStubs() },
    })
    const actionBtn = wrapper.find('.empty-state button')
    await actionBtn.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits delete when delete button clicked', async () => {
    const wrapper = mount(CognitoResourceServerList, {
      props: { resourceServers: sampleServers },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[0]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual(['api.example.com'])
  })
})