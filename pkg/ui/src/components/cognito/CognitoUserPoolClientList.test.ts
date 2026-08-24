import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoUserPoolClientList from './CognitoUserPoolClientList.vue'

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

const sampleClients = [
  { ClientId: '1abc2def3ghi4jkl5mno6pqr7', ClientName: 'web-app', RefreshTokenValidity: 30 },
]

describe('CognitoUserPoolClientList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders user pool clients', () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: sampleClients },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('web-app')
    expect(wrapper.text()).toContain('1abc2def3ghi4jkl5mno6pqr7')
  })

  it('shows empty state when no clients', () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No user pool clients')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: [], error: 'List user pool clients failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List user pool clients failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: [] },
      global: { stubs: createStubs() },
    })
    const actionBtn = wrapper.find('.empty-state button')
    await actionBtn.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits edit when edit button clicked', async () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: sampleClients },
      global: { stubs: createStubs() },
    })
    const editBtn = wrapper.findAll('button')[0]
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([sampleClients[0]])
  })

  it('emits delete when delete button clicked', async () => {
    const wrapper = mount(CognitoUserPoolClientList, {
      props: { clients: sampleClients },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[1]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual(['1abc2def3ghi4jkl5mno6pqr7'])
  })
})