import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECSModal } from './index'

const createStubs = () => ({
  Modal: {
    template: '<div v-if="open" class="modal-stub"><div class="modal-title">{{ title }}</div><slot /><slot name="footer" /></div>',
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
    props: ['variant', 'size', 'loading'],
  },
  FormInput: {
    template: '<div><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required', 'helpText'],
    emits: ['update:modelValue'],
  },
})

describe('ECSModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders cluster form', () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'cluster' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Cluster')
    expect(wrapper.text()).toContain('Cluster Name')
  })

  it('renders task definition form', () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'task-definition' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Register Task Definition')
    expect(wrapper.text()).toContain('Family')
    expect(wrapper.text()).toContain('Image')
  })

  it('renders task form', () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'task' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Run Task')
    expect(wrapper.text()).toContain('Task Definition')
  })

  it('renders service form', () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'service' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Service')
    expect(wrapper.text()).toContain('Service Name')
  })

  it('emits submit with cluster data', async () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'cluster' },
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('my-cluster')
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('submit')![0]).toEqual([{ ClusterName: 'my-cluster' }])
  })

  it('emits submit with task definition data', async () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'task-definition' },
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('my-task')
    await inputs[1].setValue('web')
    await inputs[2].setValue('nginx:latest')
    await inputs[3].setValue('256')
    await inputs[4].setValue('512')
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        Family: 'my-task',
        ContainerDefinitions: [
          { Name: 'web', Image: 'nginx:latest', Cpu: 256, Memory: 512, Essential: true },
        ],
      },
    ])
  })

  it('emits submit with task data', async () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'task' },
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('my-cluster')
    await inputs[1].setValue('my-task:1')
    await inputs[2].setValue('2')
    await inputs[3].setValue('FARGATE')
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        Cluster: 'my-cluster',
        TaskDefinition: 'my-task:1',
        Count: 2,
        LaunchType: 'FARGATE',
      },
    ])
  })

  it('emits submit with service data', async () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'service' },
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('my-cluster')
    await inputs[1].setValue('my-svc')
    await inputs[2].setValue('my-task:1')
    await inputs[3].setValue('1')
    await inputs[4].setValue('FARGATE')
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('submit')![0]).toEqual([
      {
        Cluster: 'my-cluster',
        ServiceName: 'my-svc',
        TaskDefinition: 'my-task:1',
        DesiredCount: 1,
        LaunchType: 'FARGATE',
      },
    ])
  })

  it('emits update:open false on cancel', async () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'cluster' },
      global: { stubs: createStubs() },
    })
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('resets form when reopened', async () => {
    const wrapper = mount(ECSModal, {
      props: { open: true, entity: 'cluster' },
      global: { stubs: createStubs() },
    })
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('my-cluster')
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    const inputsAfter = wrapper.findAll('input')
    expect((inputsAfter[0].element as HTMLInputElement).value).toBe('')
  })
})