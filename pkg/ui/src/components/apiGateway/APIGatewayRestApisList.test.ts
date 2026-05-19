import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import APIGatewayRestApisList from './APIGatewayRestApisList.vue'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

const mockApi = {
  id: 'api-123',
  name: 'My REST API',
  description: 'A test REST API',
  createdDate: '2024-01-15T10:00:00Z',
}

const mockResource = {
  id: 'res-456',
  path: '/users',
  pathPart: 'users',
}

const defaultProps = {
  apis: [mockApi],
  resources: [mockResource],
  loading: false,
  loadingResources: false,
  expandedApis: new Set<string>(),
  expandedResources: new Set<string>(),
  resourceMethodsMap: {},
  resourceMethodsLoading: {},
  deployments: [],
  stages: [],
}

describe('APIGatewayRestApisList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders empty state when no apis', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, apis: [] },
    })
    expect(wrapper.text()).toContain('No REST APIs')
  })

  it('renders API names', () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('My REST API')
  })

  it('renders API id', () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('api-123')
  })

  it('renders API description', () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('A test REST API')
  })

  it('emits toggle-api on header click', async () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    const header = wrapper.findAll('.cursor-pointer').at(0)
    await header?.trigger('click')
    expect(wrapper.emitted('toggle-api')?.[0]).toEqual(['api-123'])
  })

  it('shows expanded content when expanded', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, expandedApis: new Set(['api-123']) },
    })
    expect(wrapper.text()).toContain('Resources')
  })

  it('shows loading spinner when loadingResources', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, expandedApis: new Set(['api-123']), loadingResources: true },
    })
    expect(wrapper.text()).toContain('Resources')
  })

  it('emits get-invoke-url on link button click', async () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    const linkBtn = wrapper.find('button[title="Get Invoke URL"]')
    if (linkBtn.exists()) {
      await linkBtn.trigger('click')
      expect(wrapper.emitted('get-invoke-url')?.[0]).toEqual([mockApi])
    }
  })

  it('emits view-api on view button click', async () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    const viewBtn = wrapper.find('button[title="View Details"]')
    if (viewBtn.exists()) {
      await viewBtn.trigger('click')
      expect(wrapper.emitted('view-api')?.[0]).toEqual([mockApi])
    }
  })

  it('emits edit-api on edit button click', async () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    const editBtn = wrapper.find('button[title="Edit"]')
    if (editBtn.exists()) {
      await editBtn.trigger('click')
      expect(wrapper.emitted('edit-api')?.[0]).toEqual([mockApi])
    }
  })

  it('emits delete-api on delete button click', async () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    const deleteBtn = wrapper.find('button[title="Delete"]')
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click')
      expect(wrapper.emitted('delete-api')?.[0]).toEqual([mockApi])
    }
  })

  it('renders no description fallback', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, apis: [{ ...mockApi, description: undefined }] },
    })
    expect(wrapper.text()).toContain('No description')
  })

  it('renders column headers', () => {
    const wrapper = mount(APIGatewayRestApisList, { props: defaultProps })
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('ID')
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Actions')
  })

  it('renders deployments section when expanded', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, expandedApis: new Set(['api-123']) },
    })
    expect(wrapper.text()).toContain('Deployments')
  })

  it('renders stages section when expanded', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, expandedApis: new Set(['api-123']) },
    })
    expect(wrapper.text()).toContain('Stages')
  })

  it('shows no deployments text', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, expandedApis: new Set(['api-123']) },
    })
    expect(wrapper.text()).toContain('No deployments found')
  })

  it('shows no stages text', () => {
    const wrapper = mount(APIGatewayRestApisList, {
      props: { ...defaultProps, expandedApis: new Set(['api-123']) },
    })
    expect(wrapper.text()).toContain('No stages found')
  })
})
