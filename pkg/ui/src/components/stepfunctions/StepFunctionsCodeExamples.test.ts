import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StepFunctionsCodeExamples from './StepFunctionsCodeExamples.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  }),
}))

describe('StepFunctionsCodeExamples', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('exists as a component', () => {
    expect(StepFunctionsCodeExamples).toBeDefined()
  })

  it('renders Usage Examples heading', () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    expect(wrapper.text()).toContain('Usage Examples')
  })

  it('renders all language tabs', () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text())
    expect(buttonTexts).toContain('AWS CLI')
    expect(buttonTexts).toContain('JavaScript')
    expect(buttonTexts).toContain('Python')
    expect(buttonTexts).toContain('Go')
  })

  it('renders code block', () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    expect(wrapper.find('pre').exists()).toBe(true)
  })

  it('shows AWS CLI code by default', () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    expect(wrapper.text()).toContain('aws stepfunctions list-state-machines')
    expect(wrapper.text()).toContain('aws stepfunctions create-state-machine')
  })

  it('switches to JavaScript code when tab clicked', async () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    const jsButton = wrapper.findAll('button').find(b => b.text() === 'JavaScript')
    await jsButton!.trigger('click')

    expect(wrapper.text()).toContain('SFNClient')
    expect(wrapper.text()).toContain('ListStateMachinesCommand')
  })

  it('switches to Python code when tab clicked', async () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    const pythonButton = wrapper.findAll('button').find(b => b.text() === 'Python')
    await pythonButton!.trigger('click')

    const code = wrapper.find('pre').text()
    expect(code).toContain('boto3')
    expect(code).toContain('list_state_machines')
  })

  it('switches to Go code when tab clicked', async () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    const goButton = wrapper.findAll('button').find(b => b.text() === 'Go')
    await goButton!.trigger('click')

    const code = wrapper.find('pre').text()
    expect(code).toContain('sfn.NewFromConfig')
    expect(code).toContain('ListStateMachines')
  })

  it('has all example operations in AWS CLI', () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    const code = wrapper.find('pre').text()
    expect(code).toContain('list-state-machines')
    expect(code).toContain('create-state-machine')
    expect(code).toContain('start-execution')
    expect(code).toContain('describe-execution')
  })

  it('uses region from settings store in code snippets', () => {
    const wrapper = mount(StepFunctionsCodeExamples)

    const code = wrapper.find('pre').text()
    expect(code).toContain('us-east-1')
  })
})
