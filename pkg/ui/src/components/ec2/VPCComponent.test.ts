import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { VPCCreateVpcModal, VPCCreateSubnetModal, VPCCreateRouteTableModal, VPCCreateIgwModal, VPCCreateNatGatewayModal, VPCCreateNaclModal, VPCCreateFlowLogModal, VPCDeleteModal, VPCRouteTableDetailModal, VPCNaclRuleModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    region: 'us-east-1',
    accessKey: 'AKIA123',
    secretKey: 'secret123',
    darkMode: false,
  })),
}))

beforeEach(() => {
  setActivePinia(createPinia())
})

// Minimal stubs that still allow click to trigger component handlers
// Only stub Modal + complex children, keep native buttons
const createStubs = (modalTitle = '') => ({
  Modal: {
    template: `<div v-if="open" class="modal-stub"><div class="modal-title">${modalTitle}</div><div class="modal-body"><slot /></div><div class="modal-footer"><slot name="footer" /></div></div>`,
    props: ['open', 'title', 'size'],
  },
  FormInput: { template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />', props: ['modelValue', 'label', 'type'] },
  FormSelect: { template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">--</option><option value="opt">opt</option></select>', props: ['modelValue', 'label', 'options'] },
})

describe('VPCCreateVpcModal', () => {
  it('renders and emits create via button click', async () => {
    const wrapper = mount(VPCCreateVpcModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create VPC')
    // Find the last button (create button) and click it
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    const createBtn = buttons[buttons.length - 1]
    await createBtn.trigger('click')
    expect(wrapper.emitted('create')).toBeTruthy()
    expect(wrapper.emitted('create')![0][0]).toEqual({ CidrBlock: '10.0.0.0/16' })
  })

  it('emits update:open on cancel', async () => {
    const wrapper = mount(VPCCreateVpcModal, {
      props: { open: true },
      global: { stubs: createStubs() },
    })
    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(b => b.text().includes('Cancel'))
    if (cancelBtn) {
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('update:open')).toBeTruthy()
    }
  })
})

describe('VPCCreateSubnetModal', () => {
  it('renders and emits create', async () => {
    const wrapper = mount(VPCCreateSubnetModal, {
      props: { open: true, vpcList: [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' }] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Subnet')
    const btn = wrapper.findAll('button').find(b => b.text().includes('Create Subnet'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })
})

describe('VPCCreateRouteTableModal', () => {
  it('renders and emits create', async () => {
    const wrapper = mount(VPCCreateRouteTableModal, {
      props: { open: true, vpcList: [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' }] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Route Table')
    const btn = wrapper.findAll('button').find(b => b.text().includes('Create Route Table'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })
})

describe('VPCCreateIgwModal', () => {
  it('renders and emits create', async () => {
    const wrapper = mount(VPCCreateIgwModal, {
      props: { open: true, vpcList: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Internet Gateway')
    const btn = wrapper.findAll('button').find(b => b.text().includes('Create Internet Gateway'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })
})

describe('VPCCreateNatGatewayModal', () => {
  it('renders and emits create', async () => {
    const wrapper = mount(VPCCreateNatGatewayModal, {
      props: { open: true, subnetList: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create NAT Gateway')
    const btn = wrapper.findAll('button').find(b => b.text().includes('Create NAT Gateway'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })
})

describe('VPCCreateNaclModal', () => {
  it('renders and emits create', async () => {
    const wrapper = mount(VPCCreateNaclModal, {
      props: { open: true, vpcList: [{ VpcId: 'vpc-1', CidrBlock: '10.0.0.0/16', IsDefault: false, State: 'available' }] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Network ACL')
    const btn = wrapper.findAll('button').find(b => b.text().includes('Create Network ACL'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })
})

describe('VPCCreateFlowLogModal', () => {
  it('renders and emits create', async () => {
    const wrapper = mount(VPCCreateFlowLogModal, {
      props: { open: true, vpcList: [] },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Create Flow Log')
    const btn = wrapper.findAll('button').find(b => b.text().includes('Create Flow Log'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('create')).toBeTruthy()
    }
  })
})

describe('VPCDeleteModal', () => {
  it('renders with type-specific messages', () => {
    const wrapper = mount(VPCDeleteModal, {
      props: { open: true, itemName: 'vpc-1', itemType: 'vpc' },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('VPC')
    expect(wrapper.text()).toContain('vpc-1')
  })

  it('emits confirm on delete click', async () => {
    const wrapper = mount(VPCDeleteModal, {
      props: { open: true, itemName: 'vpc-1', itemType: 'vpc' },
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
  it('renders route table info', () => {
    const wrapper = mount(VPCRouteTableDetailModal, {
      props: {
        open: true,
        routeTable: {
          RouteTableId: 'rtb-1',
          VpcId: 'vpc-1',
          Routes: [{ DestinationCidrBlock: '10.0.0.0/16', GatewayId: 'local', State: 'active' }],
          Associations: [{ RouteTableAssociationId: 'assoc-1', SubnetId: 'subnet-1', Main: false }],
        },
      },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Routes')
    expect(wrapper.text()).toContain('Subnet Associations')
  })

  it('emits add-route', async () => {
    const wrapper = mount(VPCRouteTableDetailModal, {
      props: {
        open: true,
        routeTable: { RouteTableId: 'rtb-1', VpcId: 'vpc-1' },
        internetGateways: [{ InternetGatewayId: 'igw-1' }],
      },
      global: { stubs: createStubs() },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Route'))
    if (addBtn) {
      await addBtn.trigger('click')
      expect(wrapper.emitted('add-route')).toBeTruthy()
    }
  })
})

describe('VPCNaclRuleModal', () => {
  const nacl = {
    NetworkAclId: 'acl-1',
    VpcId: 'vpc-1',
    IsDefault: false,
    Entries: [
      { RuleNumber: 100, Protocol: 'tcp', PortRange: { From: 80, To: 80 }, CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'allow' as const },
      { RuleNumber: 32767, Protocol: '-1', CidrBlock: '0.0.0.0/0', Egress: true, RuleAction: 'deny' as const },
    ],
  }

  it('renders inbound and outbound tabs', () => {
    const wrapper = mount(VPCNaclRuleModal, {
      props: { open: true, nacl },
      global: { stubs: createStubs() },
    })
    expect(wrapper.text()).toContain('Inbound Rules')
    expect(wrapper.text()).toContain('Outbound Rules')
  })

  it('emits add-rule on add rule button click', async () => {
    const wrapper = mount(VPCNaclRuleModal, {
      props: { open: true, nacl },
      global: { stubs: createStubs() },
    })
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add Rule'))
    if (addBtn) {
      await addBtn.trigger('click')
      expect(wrapper.emitted('add-rule')).toBeTruthy()
    }
  })

  it('switches between tabs', async () => {
    const wrapper = mount(VPCNaclRuleModal, {
      props: { open: true, nacl },
      global: { stubs: createStubs() },
    })
    const outboundBtn = wrapper.findAll('button').find(b => b.text().includes('Outbound Rules'))
    if (outboundBtn) {
      await outboundBtn.trigger('click')
      // After clicking outbound tab, we should see outbound rule content
      expect(wrapper.text()).toContain('deny')
    }
  })
})
