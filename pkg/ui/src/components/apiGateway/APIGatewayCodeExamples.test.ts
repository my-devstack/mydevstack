import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import APIGatewayCodeExamples from './APIGatewayCodeExamples.vue'

describe('APIGatewayCodeExamples', () => {
  it('renders both API type buttons', () => {
    const wrapper = mount(APIGatewayCodeExamples, {
      props: { region: 'us-east-1', accessKey: 'test', secretKey: 'test' },
    })
    expect(wrapper.text()).toContain('API Gateway')
    expect(wrapper.text()).toContain('API Gateway V2')
  })
})
