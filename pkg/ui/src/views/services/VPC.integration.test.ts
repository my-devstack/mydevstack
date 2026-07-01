import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock API layer — composables run real code against mocked API
vi.mock('@/api/services/vpc', () => ({
  describeVpcs: vi.fn().mockResolvedValue({ Vpcs: [] }),
  createVpc: vi.fn().mockResolvedValue({}),
  deleteVpc: vi.fn().mockResolvedValue({}),
  describeSubnets: vi.fn().mockResolvedValue({ Subnets: [] }),
  createSubnet: vi.fn().mockResolvedValue({}),
  deleteSubnet: vi.fn().mockResolvedValue({}),
  describeRouteTables: vi.fn().mockResolvedValue({ RouteTables: [] }),
  createRouteTable: vi.fn().mockResolvedValue({}),
  deleteRouteTable: vi.fn().mockResolvedValue({}),
  createRoute: vi.fn().mockResolvedValue({}),
  deleteRoute: vi.fn().mockResolvedValue({}),
  associateRouteTable: vi.fn().mockResolvedValue({}),
  disassociateRouteTable: vi.fn().mockResolvedValue({}),
  describeInternetGateways: vi.fn().mockResolvedValue({ InternetGateways: [] }),
  createInternetGateway: vi.fn().mockResolvedValue({ InternetGatewayId: 'igw-123' }),
  deleteInternetGateway: vi.fn().mockResolvedValue({}),
  attachInternetGateway: vi.fn().mockResolvedValue({}),
  detachInternetGateway: vi.fn().mockResolvedValue({}),
  describeNatGateways: vi.fn().mockResolvedValue({ NatGateways: [] }),
  createNatGateway: vi.fn().mockResolvedValue({}),
  deleteNatGateway: vi.fn().mockResolvedValue({}),
  describeNetworkAcls: vi.fn().mockResolvedValue({ NetworkAcls: [] }),
  createNetworkAcl: vi.fn().mockResolvedValue({}),
  deleteNetworkAcl: vi.fn().mockResolvedValue({}),
  createNetworkAclEntry: vi.fn().mockResolvedValue({}),
  deleteNetworkAclEntry: vi.fn().mockResolvedValue({}),
  describeFlowLogs: vi.fn().mockResolvedValue({ FlowLogs: [] }),
  createFlowLogs: vi.fn().mockResolvedValue({}),
  deleteFlowLogs: vi.fn().mockResolvedValue({}),
  describeAddresses: vi.fn().mockResolvedValue({ Addresses: [] }),
  allocateElasticIp: vi.fn().mockResolvedValue({ PublicIp: '1.2.3.4', AllocationId: 'eipalloc-123' }),
  releaseElasticIp: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

// Mock stores
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    emulator: 'aws',
    darkMode: false,
    region: 'us-east-1',
    accessKey: 'test',
    secretKey: 'test',
  })),
}))

// Mock heroicons
vi.mock('@heroicons/vue/24/outline', () => {
  const mock = { template: '<span class="mock-icon" />' }
  return {
    PlusIcon: mock,
    ArrowPathIcon: mock,
    Squares2X2Icon: mock,
    RectangleGroupIcon: mock,
    TableCellsIcon: mock,
    GlobeAltIcon: mock,
    ArrowRightCircleIcon: mock,
    AdjustmentsHorizontalIcon: mock,
    BeakerIcon: mock,
    BoltIcon: mock,
    ChevronRightIcon: mock,
    TrashIcon: mock,
    ServerIcon: mock,
  }
})

import VPCView from './VPC.vue'

const testVpcItem = { VpcId: 'vpc-12345', CidrBlock: '10.0.0.0/16', State: 'available', IsDefault: false }

describe('VPC View Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders empty state on mount', async () => {
    const wrapper = mount(VPCView, {
      global: {
        stubs: {
          Tabs: {
            name: 'Tabs',
            props: ['tabs', 'activeTab'],
            emits: ['update:activeTab'],
            template: `
              <div class="tabs-stub">
                <button
                  v-for="t in tabs"
                  :key="t.id"
                  :data-testid="'tab-' + t.id"
                  @click="$emit('update:activeTab', t.id)"
                >
                  {{ t.label }}
                </button>
              </div>
            `,
          },
          Button: { template: '<button class="mock-btn"><slot /></button>' },
          StatusBadge: { template: '<span class="mock-status-badge" />' },
          EmptyState: { template: '<div class="mock-empty-state"><slot /></div>' },
          CodeSnippet: { template: '<div class="mock-code-snippet" />' },
          VPCCreateVpcModal: { template: '<div class="mock-modal" />' },
          VPCCreateSubnetModal: { template: '<div class="mock-modal" />' },
          VPCCreateRouteTableModal: { template: '<div class="mock-modal" />' },
          VPCCreateIgwModal: { template: '<div class="mock-modal" />' },
          VPCCreateNatGatewayModal: { template: '<div class="mock-modal" />' },
          VPCCreateNaclModal: { template: '<div class="mock-modal" />' },
          VPCCreateFlowLogModal: { template: '<div class="mock-modal" />' },
          VPCDeleteModal: { template: '<div class="mock-modal" />' },
          VPCRouteTableDetailModal: { template: '<div class="mock-modal" />' },
          VPCNaclRuleModal: { template: '<div class="mock-modal" />' },
        },
      },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('expands VPC item to show details', async () => {
    // Override API mock to return a VPC item
    const vpcModule = await import('@/api/services/vpc')
    vpcModule.describeVpcs.mockResolvedValueOnce({ Vpcs: [testVpcItem] })

    const wrapper = mount(VPCView, {
      global: {
        stubs: {
          Tabs: {
            name: 'Tabs',
            props: ['tabs', 'activeTab'],
            emits: ['update:activeTab'],
            template: `
              <div class="tabs-stub">
                <button
                  v-for="t in tabs"
                  :key="t.id"
                  :data-testid="'tab-' + t.id"
                  @click="$emit('update:activeTab', t.id)"
                >
                  {{ t.label }}
                </button>
              </div>
            `,
          },
          Button: { template: '<button class="mock-btn"><slot /></button>' },
          StatusBadge: { template: '<span class="mock-status-badge" />' },
          EmptyState: { template: '<div class="mock-empty-state"><slot /></div>' },
          CodeSnippet: { template: '<div class="mock-code-snippet" />' },
          VPCCreateVpcModal: { template: '<div class="mock-modal" />' },
          VPCCreateSubnetModal: { template: '<div class="mock-modal" />' },
          VPCCreateRouteTableModal: { template: '<div class="mock-modal" />' },
          VPCCreateIgwModal: { template: '<div class="mock-modal" />' },
          VPCCreateNatGatewayModal: { template: '<div class="mock-modal" />' },
          VPCCreateNaclModal: { template: '<div class="mock-modal" />' },
          VPCCreateFlowLogModal: { template: '<div class="mock-modal" />' },
          VPCDeleteModal: { template: '<div class="mock-modal" />' },
          VPCRouteTableDetailModal: { template: '<div class="mock-modal" />' },
          VPCNaclRuleModal: { template: '<div class="mock-modal" />' },
        },
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // VPC item should be rendered
    expect(wrapper.text()).toContain('vpc-12345')

    // Click the VPC item row to expand
    const vpcRow = wrapper.find('.cursor-pointer')
    await vpcRow.trigger('click')
    await wrapper.vm.$nextTick()

    // Expanded content should be visible
    expect(wrapper.text()).toContain('CIDR Block')
    expect(wrapper.text()).toContain('10.0.0.0/16')

    // Click again to collapse
    await vpcRow.trigger('click')
    await wrapper.vm.$nextTick()
  })

  const tabTests = [
    { tab: 'vpc-list', buttonText: 'Create VPC' },
    { tab: 'subnet-list', buttonText: 'Create Subnet' },
    { tab: 'route-tables', buttonText: 'Create Route Table' },
    { tab: 'internet-gateways', buttonText: 'Create IGW' },
    { tab: 'nat-gateways', buttonText: 'Create NAT Gateway' },
    { tab: 'network-acls', buttonText: 'Create Network ACL' },
    { tab: 'flow-logs', buttonText: 'Create Flow Log' },
    { tab: 'elastic-ips', buttonText: 'Allocate Elastic IP' },
  ]

  it.each(tabTests)('shows "$buttonText" button when activeTab is "$tab"', async ({ tab, buttonText }) => {
    const wrapper = mount(VPCView, {
      global: {
        stubs: {
          Tabs: {
            name: 'Tabs',
            props: ['tabs', 'activeTab'],
            emits: ['update:activeTab'],
            template: `
              <div class="tabs-stub">
                <button
                  v-for="t in tabs"
                  :key="t.id"
                  :data-testid="'tab-' + t.id"
                  @click="$emit('update:activeTab', t.id)"
                >
                  {{ t.label }}
                </button>
              </div>
            `,
          },
          Button: { template: '<button class="mock-btn"><slot /></button>' },
          StatusBadge: { template: '<span class="mock-status-badge" />' },
          EmptyState: { template: '<div class="mock-empty-state"><slot /></div>' },
          CodeSnippet: { template: '<div class="mock-code-snippet" />' },
          VPCCreateVpcModal: { template: '<div class="mock-modal" />' },
          VPCCreateSubnetModal: { template: '<div class="mock-modal" />' },
          VPCCreateRouteTableModal: { template: '<div class="mock-modal" />' },
          VPCCreateIgwModal: { template: '<div class="mock-modal" />' },
          VPCCreateNatGatewayModal: { template: '<div class="mock-modal" />' },
          VPCCreateNaclModal: { template: '<div class="mock-modal" />' },
          VPCCreateFlowLogModal: { template: '<div class="mock-modal" />' },
          VPCDeleteModal: { template: '<div class="mock-modal" />' },
          VPCRouteTableDetailModal: { template: '<div class="mock-modal" />' },
          VPCNaclRuleModal: { template: '<div class="mock-modal" />' },
        },
      },
    })

    // Let onMounted and API calls complete
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Click the tab
    const tabBtn = wrapper.find(`[data-testid="tab-${tab}"]`)
    expect(tabBtn.exists()).toBe(true)
    await tabBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Verify button text
    expect(wrapper.text()).toContain(buttonText)
  })

  it('handleDelete calls deleteVpc API when confirm is clicked', async () => {
    // Override API mock to return a VPC item
    const vpcModule = await import('@/api/services/vpc')
    vpcModule.describeVpcs.mockResolvedValueOnce({ Vpcs: [testVpcItem] })

    const wrapper = mount(VPCView, {
      global: {
        stubs: {
          Tabs: {
            name: 'Tabs',
            props: ['tabs', 'activeTab'],
            emits: ['update:activeTab'],
            template: `
              <div class="tabs-stub">
                <button
                  v-for="t in tabs"
                  :key="t.id"
                  :data-testid="'tab-' + t.id"
                  @click="$emit('update:activeTab', t.id)"
                >
                  {{ t.label }}
                </button>
              </div>
            `,
          },
          Button: { template: '<button class="mock-btn"><slot /></button>' },
          StatusBadge: { template: '<span class="mock-status-badge" />' },
          EmptyState: { template: '<div class="mock-empty-state"><slot /></div>' },
          CodeSnippet: { template: '<div class="mock-code-snippet" />' },
          VPCCreateVpcModal: { template: '<div class="mock-modal" />' },
          VPCCreateSubnetModal: { template: '<div class="mock-modal" />' },
          VPCCreateRouteTableModal: { template: '<div class="mock-modal" />' },
          VPCCreateIgwModal: { template: '<div class="mock-modal" />' },
          VPCCreateNatGatewayModal: { template: '<div class="mock-modal" />' },
          VPCCreateNaclModal: { template: '<div class="mock-modal" />' },
          VPCCreateFlowLogModal: { template: '<div class="mock-modal" />' },
          VPCDeleteModal: {
            props: ['open', 'itemName', 'itemType', 'deleting'],
            emits: ['update:open', 'confirm'],
            template: '<div v-if="open" class="mock-delete-modal"><button class="confirm-delete-btn" @click="$emit(\'confirm\')">Delete</button></div>',
          },
          VPCRouteTableDetailModal: { template: '<div class="mock-modal" />' },
          VPCNaclRuleModal: { template: '<div class="mock-modal" />' },
        },
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // VPC item should be rendered
    expect(wrapper.text()).toContain('vpc-12345')

    // Find the VPC card and click the delete button
    const vpcCard = wrapper.find('.cursor-pointer')
    expect(vpcCard.exists()).toBe(true)
    const deleteBtn = vpcCard.findAll('button')[0]
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Delete modal should appear
    const modal = wrapper.find('.mock-delete-modal')
    expect(modal.exists()).toBe(true)

    // Click confirm delete button in modal
    const confirmBtn = modal.find('.confirm-delete-btn')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Verify deleteVpc API was called
    expect(vpcModule.deleteVpc).toHaveBeenCalledWith('vpc-12345')
  })

  it('handleDelete calls deleteSubnet API when deleting a subnet', async () => {
    const vpcModule = await import('@/api/services/vpc')
    vpcModule.describeSubnets.mockResolvedValueOnce({ Subnets: [{ SubnetId: 'subnet-abc', CidrBlock: '10.0.1.0/24', State: 'available', AvailabilityZone: 'us-east-1a', VpcId: 'vpc-123' }] })

    const wrapper = mount(VPCView, {
      global: {
        stubs: {
          Tabs: {
            name: 'Tabs',
            props: ['tabs', 'activeTab'],
            emits: ['update:activeTab'],
            template: '<div class="tabs-stub"><button v-for="t in tabs" :key="t.id" :data-testid="\'tab-\' + t.id" @click="$emit(\'update:activeTab\', t.id)">{{ t.label }}</button></div>',
          },
          Button: { template: '<button class="mock-btn"><slot /></button>' },
          StatusBadge: { template: '<span class="mock-status-badge" />' },
          EmptyState: { template: '<div class="mock-empty-state"><slot /></div>' },
          CodeSnippet: { template: '<div class="mock-code-snippet" />' },
          VPCCreateVpcModal: { template: '<div class="mock-modal" />' },
          VPCCreateSubnetModal: { template: '<div class="mock-modal" />' },
          VPCCreateRouteTableModal: { template: '<div class="mock-modal" />' },
          VPCCreateIgwModal: { template: '<div class="mock-modal" />' },
          VPCCreateNatGatewayModal: { template: '<div class="mock-modal" />' },
          VPCCreateNaclModal: { template: '<div class="mock-modal" />' },
          VPCCreateFlowLogModal: { template: '<div class="mock-modal" />' },
          VPCDeleteModal: {
            props: ['open', 'itemName', 'itemType', 'deleting'],
            emits: ['update:open', 'confirm'],
            template: '<div v-if="open" class="mock-delete-modal"><button class="confirm-delete-btn" @click="$emit(\'confirm\')">Delete</button></div>',
          },
          VPCRouteTableDetailModal: { template: '<div class="mock-modal" />' },
          VPCNaclRuleModal: { template: '<div class="mock-modal" />' },
        },
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Switch to subnets tab
    const subnetTab = wrapper.find('[data-testid="tab-subnet-list"]')
    await subnetTab.trigger('click')
    await wrapper.vm.$nextTick()
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Subnet should be rendered
    expect(wrapper.text()).toContain('subnet-abc')

    // Click delete button on subnet item
    const subnetCard = wrapper.find('.cursor-pointer')
    expect(subnetCard.exists()).toBe(true)
    const deleteBtn = subnetCard.findAll('button')[0]
    await deleteBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Confirm delete
    const modal = wrapper.find('.mock-delete-modal')
    expect(modal.exists()).toBe(true)
    const confirmBtn = modal.find('.confirm-delete-btn')
    await confirmBtn.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Verify deleteSubnet API was called
    expect(vpcModule.deleteSubnet).toHaveBeenCalledWith('subnet-abc')
  })
})
