import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECSCodeExamples } from './index'

vi.mock('@/components/common/CodeSnippet.vue', () => ({
  default: {
    template: '<div class="code-snippet"><h3>{{ title }}</h3><div v-for="s in snippets" :key="s.language" class="snippet">{{ s.label }}</div></div>',
    props: ['title', 'snippets', 'defaultTab', 'disableHighlight'],
  },
}))

describe('ECSCodeExamples', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders code snippet with title', () => {
    const wrapper = mount(ECSCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.text()).toContain('Usage Examples')
  })

  it('renders all language tabs', () => {
    const wrapper = mount(ECSCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.text()).toContain('AWS CLI')
    expect(wrapper.text()).toContain('JavaScript')
    expect(wrapper.text()).toContain('Python')
    expect(wrapper.text()).toContain('Go')
  })

  it('includes AWS CLI commands for ECS operations', () => {
    const wrapper = mount(ECSCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    const snippets = (wrapper.vm as any).codeExamples
    const cli = snippets.find((s: any) => s.language === 'aws-cli')
    expect(cli.code).toContain('aws ecs create-cluster')
    expect(cli.code).toContain('aws ecs register-task-definition')
    expect(cli.code).toContain('aws ecs run-task')
    expect(cli.code).toContain('aws ecs create-service')
  })

  it('injects region and credentials into SDK examples', () => {
    const wrapper = mount(ECSCodeExamples, {
      props: { region: 'eu-west-1', accessKey: 'AKIA', secretKey: 'SECRET' },
    })
    const snippets = (wrapper.vm as any).codeExamples
    const js = snippets.find((s: any) => s.language === 'javascript')
    expect(js.code).toContain('eu-west-1')
    expect(js.code).toContain('AKIA')
    expect(js.code).toContain('SECRET')
  })
})