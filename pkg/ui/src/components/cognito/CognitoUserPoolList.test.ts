import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoUserPoolList } from './index'

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

const samplePools = [
  { Id: 'us-east-1_abc123', Name: 'my-user-pool', Status: 'Enabled', Arn: 'arn:aws:cognito:us-east-1:123:userpool/us-east-1_abc123', CreationDate: '2024-01-15T10:30:00Z' },
]

describe('CognitoUserPoolList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders user pools', () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: samplePools },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('my-user-pool')
    expect(wrapper.text()).toContain('us-east-1_abc123')
  })

  it('shows empty state when no pools', () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No user pools')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: [], error: 'List user pools failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List user pools failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits delete with pool id', async () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: samplePools },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[1]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')![0]).toEqual(['us-east-1_abc123'])
  })

  it('emits edit with pool', async () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: samplePools },
      global: { stubs: createStubs() },
    })
    const editBtn = wrapper.findAll('button')[0]
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')![0]).toEqual([samplePools[0]])
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: samplePools },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('ARN')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('ARN')
    expect(wrapper.emitted('expand')![0]).toEqual(['us-east-1_abc123'])
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('ARN')
  })

  it('formats date as - when missing', async () => {
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: [{ ...samplePools[0], CreationDate: undefined }] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.text()).toContain('-')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ Id: `pool-${i}`, Name: `pool-${i}` }))
    const wrapper = mount(CognitoUserPoolList, {
      props: { userPools: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})
