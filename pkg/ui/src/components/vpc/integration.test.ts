import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import {
  VPCCreateVpcModal,
  VPCCreateSubnetModal,
  VPCCreateRouteTableModal,
  VPCCreateIgwModal,
  VPCCreateNatGatewayModal,
  VPCCreateNaclModal,
  VPCCreateFlowLogModal,
  VPCDeleteModal,
  VPCRouteTableDetailModal,
  VPCNaclRuleModal,
} from './index'

vi.mock('@/composables/useVPC', () => ({
  useVPC: vi.fn(() => ({
    vpcs: { value: [] },
    subnets: { value: [] },
    routeTables: { value: [] },
    internetGateways: { value: [] },
    natGateways: { value: [] },
    networkAcls: { value: [] },
    flowLogs: { value: [] },
    elasticIps: { value: [] },
    loading: { value: false },
    showVpcModal: { value: false },
    showSubnetModal: { value: false },
    showRouteTableModal: { value: false },
    showIgwModal: { value: false },
    showNatGatewayModal: { value: false },
    showNaclModal: { value: false },
    showFlowLogModal: { value: false },
    showDeleteConfirm: { value: false },
    loadAll: vi.fn(),
    handleCreateVpc: vi.fn(),
    handleCreateSubnet: vi.fn(),
    handleCreateRouteTable: vi.fn(),
    handleCreateIgw: vi.fn(),
    handleCreateNatGateway: vi.fn(),
    handleCreateNacl: vi.fn(),
    handleCreateFlowLog: vi.fn(),
    handleDeleteVpc: vi.fn(),
    handleDeleteSubnet: vi.fn(),
    handleDeleteRouteTable: vi.fn(),
    handleDeleteIgw: vi.fn(),
    handleDeleteNatGateway: vi.fn(),
    handleDeleteNacl: vi.fn(),
    handleDeleteFlowLog: vi.fn(),
    handleAllocateElasticIp: vi.fn(),
    handleReleaseElasticIp: vi.fn(),
    confirmDelete: vi.fn(),
    getStatus: vi.fn(() => 'active'),
    codeExamples: { value: [] },
  })),
}))

vi.mock('@/stores/ui', () => ({
  useUIStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
    notifyWarning: vi.fn(),
  })),
}))

const createStubs = () => ({
  Modal: {
    template: `
      <div v-if="open" class="modal">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-body"><slot /></div>
        <div class="modal-footer"><slot name="footer" /></div>
      </div>
    `,
    props: ['open', 'title', 'size'],
    emits: ['update:open'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :loading="loading"><slot /></button>',
    props: ['loading', 'variant', 'size'],
  },
  FormInput: {
    template: '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  FormSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option>option</option></select>',
    props: ['modelValue', 'label', 'options'],
    emits: ['update:modelValue'],
  },
})

describe('VPC Components Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('VPCCreateVpcModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateVpcModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create VPC')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(VPCCreateVpcModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create VPC')
    })

    it('emits create with form data', async () => {
      const wrapper = mount(VPCCreateVpcModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      const createBtn = wrapper.findAll('button').find(b => b.text().includes('Create VPC'))
      if (createBtn) {
        await createBtn.trigger('click')
        expect(wrapper.emitted('create')).toBeTruthy()
        expect(wrapper.emitted('create')![0][0]).toHaveProperty('CidrBlock')
      }
    })
  })

  describe('VPCCreateSubnetModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateSubnetModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Subnet')
    })

    it('does not render when open is false', () => {
      const wrapper = mount(VPCCreateSubnetModal, {
        props: { open: false },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).not.toContain('Create Subnet')
    })
  })

  describe('VPCCreateRouteTableModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateRouteTableModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Route Table')
    })
  })

  describe('VPCCreateIgwModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateIgwModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Internet Gateway')
    })
  })

  describe('VPCCreateNatGatewayModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateNatGatewayModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create NAT Gateway')
    })
  })

  describe('VPCCreateNaclModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateNaclModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Network ACL')
    })
  })

  describe('VPCCreateFlowLogModal', () => {
    it('renders when open is true', () => {
      const wrapper = mount(VPCCreateFlowLogModal, {
        props: { open: true },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Create Flow Log')
    })
  })

  describe('VPCDeleteModal', () => {
    it('renders when open with props', () => {
      const wrapper = mount(VPCDeleteModal, {
        props: { open: true, itemName: 'vpc-123', itemType: 'vpc' },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Delete VPC')
    })

    it('emits confirm on delete click', async () => {
      const wrapper = mount(VPCDeleteModal, {
        props: { open: true, itemName: 'vpc-123', itemType: 'vpc' },
        global: { stubs: createStubs() },
      })
      const deleteBtn = wrapper.findAll('button').find(b => b.text().includes('Delete'))
      if (deleteBtn) {
        await deleteBtn.trigger('click')
        expect(wrapper.emitted('confirm')).toBeTruthy()
      }
    })
  })

  describe('VPCRouteTableDetailModal', () => {
    it('renders when open with route table', () => {
      const wrapper = mount(VPCRouteTableDetailModal, {
        props: {
          open: true,
          routeTable: { RouteTableId: 'rtb-123', VpcId: 'vpc-123' },
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Route Table')
    })
  })

  describe('VPCNaclRuleModal', () => {
    it('renders when open with nacl', () => {
      const wrapper = mount(VPCNaclRuleModal, {
        props: {
          open: true,
          nacl: { NetworkAclId: 'acl-123', VpcId: 'vpc-123', IsDefault: false },
        },
        global: { stubs: createStubs() },
      })
      expect(wrapper.html()).toContain('Network ACL Rules')
    })
  })
})
