import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { CognitoGroupList } from './index'

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
})

const sampleGroups = [
  { GroupName: 'admins', Description: 'Admin group', Precedence: 1, RoleArn: 'arn:aws:iam::123:role/admin', CreationDate: '2024-01-15T10:30:00Z', LastModifiedDate: '2024-02-01T10:30:00Z' },
]

describe('CognitoGroupList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders groups', () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: sampleGroups },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('admins')
    expect(wrapper.text()).toContain('Admin group')
  })

  it('shows empty state when no groups', () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No groups')
  })

  it('shows loading spinner when loading with no data', () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: [], loading: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.find('.spinner').exists()).toBe(true)
  })

  it('shows error message', () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: [], error: 'List groups failed' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('List groups failed')
  })

  it('emits create from empty state action', async () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: [] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.empty-state button').trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
  })

  it('emits edit with group', async () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: sampleGroups },
      global: { stubs: createStubs() },
    })
    const editBtn = wrapper.findAll('button')[0]
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')![0]).toEqual([sampleGroups[0]])
  })

  it('emits members with group', async () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: sampleGroups },
      global: { stubs: createStubs() },
    })
    const membersBtn = wrapper.findAll('button')[1]
    await membersBtn.trigger('click')
    expect(wrapper.emitted('members')![0]).toEqual([sampleGroups[0]])
  })

  it('emits delete with group name', async () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: sampleGroups },
      global: { stubs: createStubs() },
    })
    const deleteBtn = wrapper.findAll('button')[2]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')![0]).toEqual(['admins'])
  })

  it('expands and collapses on row click', async () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: sampleGroups },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).not.toContain('Role ARN')
    const row = wrapper.find('.cursor-pointer')
    await row.trigger('click')
    expect(wrapper.text()).toContain('Role ARN')
    expect(wrapper.emitted('expand')![0]).toEqual(['admins'])
    await row.trigger('click')
    expect(wrapper.text()).not.toContain('Role ARN')
  })

  it('shows No description when description missing', () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: [{ GroupName: 'devs' }] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('No description')
  })

  it('shows - for missing precedence and role arn', async () => {
    const wrapper = mount(CognitoGroupList, {
      props: { groups: [{ GroupName: 'devs' }] },
      global: { stubs: createStubs() },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.text()).toContain('-')
  })

  it('shows pagination controls when totalPages > 1', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ GroupName: `group-${i}` }))
    const wrapper = mount(CognitoGroupList, {
      props: { groups: many },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Previous')
    expect(wrapper.text()).toContain('Next')
  })
})
