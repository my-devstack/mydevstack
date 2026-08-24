import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CognitoTagsSection from './CognitoTagsSection.vue'

const buttonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'loading', 'disabled'],
  emits: ['click'],
}

const stubs = { Button: buttonStub }

describe('CognitoTagsSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders existing tags', () => {
    const wrapper = mount(CognitoTagsSection, {
      props: { tags: { env: 'dev', team: 'platform' } },
      global: { stubs },
    })
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(4)
    expect(wrapper.text()).toContain('Tags')
  })

  it('shows empty message when no tags', () => {
    const wrapper = mount(CognitoTagsSection, {
      props: { tags: {} },
      global: { stubs },
    })
    expect(wrapper.text()).toContain('No tags configured')
  })

  it('emits update with tags and removedKeys when a row is removed', async () => {
    const wrapper = mount(CognitoTagsSection, {
      props: { tags: { env: 'dev', team: 'platform' } },
      global: { stubs },
    })
    const removeBtn = wrapper.findAll('button').find(b => b.text().includes('Remove')) || wrapper.findAll('button')[0]
    await removeBtn.trigger('click')
    expect(wrapper.emitted('update')).toBeTruthy()
    const [tags, removedKeys] = wrapper.emitted('update')![0] as [Record<string, string>, string[]]
    expect(removedKeys).toContain('env')
    expect(tags.team).toBe('platform')
  })

  it('emits update when adding a new tag', async () => {
    const wrapper = mount(CognitoTagsSection, {
      props: { tags: {} },
      global: { stubs },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('env')
    await inputs[1].setValue('prod')
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await addBtn!.trigger('click')
    expect(wrapper.emitted('update')).toBeTruthy()
    const [tags] = wrapper.emitted('update')![0] as [Record<string, string>, string[]]
    expect(tags.env).toBe('prod')
  })

  it('emits update when editing a tag value', async () => {
    const wrapper = mount(CognitoTagsSection, {
      props: { tags: { env: 'dev' } },
      global: { stubs },
    })
    const inputs = wrapper.findAll('input')
    await inputs[1].setValue('staging')
    expect(wrapper.emitted('update')).toBeTruthy()
    const [tags] = wrapper.emitted('update')![0] as [Record<string, string>, string[]]
    expect(tags.env).toBe('staging')
  })
})