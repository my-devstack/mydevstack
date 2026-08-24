import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { DynamoDBCodeExamples } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
  })),
}))

const codeSnippetStub = {
  template: `
    <div class="code-snippet">
      <div class="snippet-title">{{ title }}</div>
      <div v-for="s in snippets" :key="s.language" class="snippet">
        <span class="snippet-lang">{{ s.language }}</span>
        <pre class="snippet-code">{{ s.code }}</pre>
      </div>
    </div>
  `,
  props: ['snippets', 'title', 'defaultTab', 'disableHighlight'],
}

describe('DynamoDBCodeExamples', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders title', () => {
    const wrapper = mount(DynamoDBCodeExamples, {
      global: { stubs: { CodeSnippet: codeSnippetStub } },
    })
    expect(wrapper.find('.snippet-title').text()).toContain('Usage Examples')
  })

  it('renders table examples by default', () => {
    const wrapper = mount(DynamoDBCodeExamples, {
      global: { stubs: { CodeSnippet: codeSnippetStub } },
    })
    const langs = wrapper.findAll('.snippet-lang').map(l => l.text())
    expect(langs).toContain('aws-cli')
    expect(langs).toContain('javascript')
    expect(langs).toContain('python')
    expect(langs).toContain('go')
    expect(wrapper.html()).toContain('aws dynamodb list-tables')
  })

  it('renders stream examples when type is stream', () => {
    const wrapper = mount(DynamoDBCodeExamples, {
      props: { type: 'stream' },
      global: { stubs: { CodeSnippet: codeSnippetStub } },
    })
    expect(wrapper.html()).toContain('aws dynamodbstreams list-streams')
    expect(wrapper.html()).not.toContain('aws dynamodb list-tables')
  })

  it('injects settings store region into javascript example', () => {
    const wrapper = mount(DynamoDBCodeExamples, {
      global: { stubs: { CodeSnippet: codeSnippetStub } },
    })
    expect(wrapper.html()).toContain('us-east-1')
    expect(wrapper.html()).toContain('test-access-key')
    expect(wrapper.html()).toContain('test-secret-key')
  })

  it('passes disableHighlight true to CodeSnippet', () => {
    const wrapper = mount(DynamoDBCodeExamples, {
      global: { stubs: { CodeSnippet: codeSnippetStub } },
    })
    const snippet = wrapper.findComponent(codeSnippetStub)
    expect(snippet.props('disableHighlight')).toBe(true)
    expect(snippet.props('defaultTab')).toBe('aws-cli')
  })
})
