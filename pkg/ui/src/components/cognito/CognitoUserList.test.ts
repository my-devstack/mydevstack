import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoUserList } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

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
  StatusBadge: {
    template: '<span class="status-badge">{{ label }}</span>',
    props: ['status', 'label', 'size'],
  },
})

const sampleUsers = [
  {
    Username: 'alice',
    UserStatus: 'CONFIRMED',
    Enabled: true,
    UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }, { Name: 'phone_number', Value: '+15551234567' }],
    UserCreateDate: '2024-01-15T10:30:00Z',
    UserLastModifiedDate: '2024-02-01T10:30:00Z',
  },
]

describe('CognitoUserList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders users', () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: sampleUsers },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('alice@example.com')
  })

  it('shows empty state when no users', () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No users')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: [], error: 'List users failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List users failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits edit with user', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: sampleUsers },
      global: { stubs: createStubs() },
    })
    const editBtn = wrapper.findAll('button')[0]
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')![0]).toEqual([sampleUsers[0]])
  })

  it('emits reset-password with user', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: sampleUsers },
      global: { stubs: createStubs() },
    })
    const resetBtn = wrapper.findAll('button')[1]
    await resetBtn.trigger('click')
    expect(wrapper.emitted('reset-password')![0]).toEqual([sampleUsers[0]])
  })

  it('emits test-login with user', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: sampleUsers },
      global: { stubs: createStubs() },
    })
    const testBtn = wrapper.findAll('button')[2]
    await testBtn.trigger('click')
    expect(wrapper.emitted('test-login')![0]).toEqual([sampleUsers[0]])
  })

  it('emits delete with username', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: sampleUsers },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[3]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')![0]).toEqual(['alice'])
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: sampleUsers },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('Last Modified')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('Last Modified')
    expect(wrapper.emitted('expand')![0]).toEqual(['alice'])
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('Last Modified')
  })

  it('shows - for missing attributes', async () => {
    const wrapper = mount(CognitoUserList, {
      props: { users: [{ Username: 'bob', UserAttributes: [] }] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.text()).toContain('-')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ Username: `user-${i}` }))
    const wrapper = mount(CognitoUserList, {
      props: { users: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})
