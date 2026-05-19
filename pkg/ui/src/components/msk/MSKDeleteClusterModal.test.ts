import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MSKDeleteClusterModal from './MSKDeleteClusterModal.vue'

const modalStub = {
  template: '<div v-if="open" data-testid="modal"><slot /><slot name="footer" /></div>',
  props: ['open'],
}

const buttonStub = {
  template: '<button><slot /></button>',
  props: ['variant', 'loading'],
}

const mockCluster = {
  ClusterName: 'test-cluster',
  ClusterArn: 'arn:aws:kafka:us-east-1:123456789012:cluster/test-cluster',
  State: 'ACTIVE',
}

const defaultProps = {
  open: true,
  isLoading: false,
  cluster: mockCluster,
}

describe('MSKDeleteClusterModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders when open with cluster', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
  })

  it('does not render when open is false', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: { ...defaultProps, open: false },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)
  })

  it('displays cluster name', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('test-cluster')
  })

  it('displays cluster arn', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('arn:aws:kafka:us-east-1:123456789012:cluster/test-cluster')
  })

  it('shows confirmation message', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('Are you sure')
  })

  it('shows permanent deletion warning', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('cannot be undone')
  })

  it('handles null cluster gracefully', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: { open: true, isLoading: false, cluster: null },
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).not.toContain('ClusterArn')
  })

  it('renders cancel and delete buttons', () => {
    const wrapper = mount(MSKDeleteClusterModal, {
      props: defaultProps,
      global: { stubs: { Modal: modalStub, Button: buttonStub } },
    })
    expect(wrapper.text()).toContain('Cancel')
    expect(wrapper.text()).toContain('Delete Cluster')
  })
})
