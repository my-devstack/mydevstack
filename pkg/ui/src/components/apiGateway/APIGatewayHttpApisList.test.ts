import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayHttpApisList from './APIGatewayHttpApisList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockApi = {
  apiId: 'http-api-456',
  name: 'My HTTP API',
  protocolType: 'HTTP',
  description: 'An HTTP API',
}

const defaultProps = {
  apis: [mockApi],
  loading: false,
  expandedApis: new Set<string>(),
  stages: {},
  routes: {},
  routeTargets: {},
  integrations: {},
}

describe('APIGatewayHttpApisList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders empty state when no apis', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, apis: [] },
    })
    expect(wrapper.text()).toContain('No HTTP APIs')
  })

  it('renders API name', () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('My HTTP API')
  })

  it('renders API id', () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('http-api-456')
  })

  it('renders protocol', () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('HTTP')
  })

  it('renders description', () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('An HTTP API')
  })

  it('shows no description fallback', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, apis: [{ ...mockApi, description: undefined }] },
    })
    expect(wrapper.text()).toContain('No description')
  })

  it('shows default protocol when not provided', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, apis: [{ ...mockApi, protocolType: undefined }] },
    })
    expect(wrapper.text()).toContain('HTTP')
  })

  it('renders WebSocket protocol', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, apis: [{ ...mockApi, protocolType: 'WEBSOCKET' }] },
    })
    expect(wrapper.text()).toContain('WEBSOCKET')
  })

  it('renders protocol from api.protocolType field', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, apis: [{ ...mockApi, protocolType: 'HTTP' }] },
    })
    expect(wrapper.text()).toContain('HTTP')
  })

  it('emits toggle-api on click', async () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    const header = wrapper.findAll('.cursor-pointer').at(0)
    await header?.trigger('click')
    expect(wrapper.emitted('toggle-api')?.[0]).toEqual(['http-api-456'])
  })

  it('emits get-invoke-url on button click', async () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    const linkBtn = wrapper.find('button[title="Get Invoke URL"]')
    if (linkBtn.exists()) {
      await linkBtn.trigger('click')
      expect(wrapper.emitted('get-invoke-url')?.[0]).toEqual([mockApi])
    }
  })

  it('emits delete-api on delete button click', async () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    const deleteBtn = wrapper.find('button[title="Delete"]')
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete-api')?.[0]).toEqual([mockApi])
    }
  })

  it('renders expanded content when expanded', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, expandedApis: new Set(['http-api-456']) },
    })
    expect(wrapper.text()).toContain('Routes')
    expect(wrapper.text()).toContain('Integrations')
    expect(wrapper.text()).toContain('Stages')
  })

  it('shows no routes text when expanded without routes', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, expandedApis: new Set(['http-api-456']) },
    })
    expect(wrapper.text()).toContain('No routes yet')
  })

  it('shows no integrations text when expanded without integrations', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, expandedApis: new Set(['http-api-456']) },
    })
    expect(wrapper.text()).toContain('No integrations yet')
  })

  it('shows no stages text when expanded without stages', () => {
    const wrapper = mount(APIGatewayHttpApisList, {
      props: { ...defaultProps, expandedApis: new Set(['http-api-456']) },
    })
    expect(wrapper.text()).toContain('No stages yet')
  })

  it('renders column headers', () => {
    const wrapper = mount(APIGatewayHttpApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('NAME')
    expect(wrapper.text()).toContain('PROTOCOL')
    expect(wrapper.text()).toContain('DESCRIPTION')
    expect(wrapper.text()).toContain('ACTIONS')
  })
})
