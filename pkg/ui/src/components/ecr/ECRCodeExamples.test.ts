import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECRCodeExamples } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

vi.mock('@/components/common/CodeSnippet.vue', () => ({
  default: {
    name: 'CodeSnippet',
    template: '<div class="code-snippet"><h3>{{ title }}</h3><div v-for="s in snippets" :key="s.language" class="snippet">{{ s.code }}</div></div>',
    props: ['snippets', 'title', 'defaultTab', 'disableHighlight'],
  },
}))

describe('ECRCodeExamples', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('ECR Usage Examples')
  })

  it('includes aws ecr get-login-password command', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws ecr get-login-password')
  })

  it('includes docker push command', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('docker push')
  })

  it('includes docker pull command', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('docker pull')
  })

  it('includes create-repository command', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws ecr create-repository')
  })

  it('includes delete-repository command', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws ecr delete-repository')
  })

  it('includes docker login with password-stdin', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('docker login --username AWS --password-stdin')
  })

  it('uses default repository name my-app', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app')
  })

  it('uses custom repository name when provided', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test', repositoryName: 'project-a/nginx' },
    })
    expect(wrapper.html()).toContain('000000000000.dkr.ecr.us-east-1.amazonaws.com/project-a/nginx')
  })

  it('uses region in registry endpoint', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'eu-west-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('000000000000.dkr.ecr.eu-west-1.amazonaws.com')
  })

  it('includes docker build and tag commands', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('docker build')
    expect(wrapper.html()).toContain('docker tag')
  })

  it('includes batch-delete-image command', () => {
    const wrapper = mount(ECRCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.html()).toContain('aws ecr batch-delete-image')
  })
})