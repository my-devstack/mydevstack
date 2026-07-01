//go:build integration
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/api/services/ec2', () => ({
  describeInstances: vi.fn().mockResolvedValue({ Reservations: [] }),
  runInstances: vi.fn().mockResolvedValue({ Instances: [] }),
  terminateInstance: vi.fn().mockResolvedValue({ Instances: [] }),
  startInstance: vi.fn().mockResolvedValue({ Instances: [] }),
  stopInstance: vi.fn().mockResolvedValue({ Instances: [] }),
  describeKeyPairs: vi.fn().mockResolvedValue({ KeyPairs: [] }),
  createKeyPair: vi.fn().mockResolvedValue({}),
  importKeyPair: vi.fn().mockResolvedValue({}),
  deleteKeyPair: vi.fn().mockResolvedValue({}),
  describeSecurityGroups: vi.fn().mockResolvedValue({ SecurityGroups: [] }),
  createSecurityGroup: vi.fn().mockResolvedValue({ GroupId: 'sg-new' }),
  deleteSecurityGroup: vi.fn().mockResolvedValue({}),
  authorizeSecurityGroupIngress: vi.fn().mockResolvedValue({}),
  describeVpcs: vi.fn().mockResolvedValue({ Vpcs: [] }),
  describeSubnets: vi.fn().mockResolvedValue({ Subnets: [] }),
  createVpc: vi.fn().mockResolvedValue({}),
  deleteVpc: vi.fn().mockResolvedValue({}),
  createSubnet: vi.fn().mockResolvedValue({}),
  deleteSubnet: vi.fn().mockResolvedValue({}),
  createRouteTable: vi.fn().mockResolvedValue({}),
  deleteRouteTable: vi.fn().mockResolvedValue({}),
  describeRouteTables: vi.fn().mockResolvedValue({ RouteTables: [] }),
  createRoute: vi.fn().mockResolvedValue({}),
  deleteRoute: vi.fn().mockResolvedValue({}),
  associateRouteTable: vi.fn().mockResolvedValue({}),
  disassociateRouteTable: vi.fn().mockResolvedValue({}),
  createInternetGateway: vi.fn().mockResolvedValue({}),
  deleteInternetGateway: vi.fn().mockResolvedValue({}),
  describeInternetGateways: vi.fn().mockResolvedValue({ InternetGateways: [] }),
  attachInternetGateway: vi.fn().mockResolvedValue({}),
  detachInternetGateway: vi.fn().mockResolvedValue({}),
  createNatGateway: vi.fn().mockResolvedValue({}),
  deleteNatGateway: vi.fn().mockResolvedValue({}),
  describeNatGateways: vi.fn().mockResolvedValue({ NatGateways: [] }),
  createNetworkAcl: vi.fn().mockResolvedValue({}),
  deleteNetworkAcl: vi.fn().mockResolvedValue({}),
  describeNetworkAcls: vi.fn().mockResolvedValue({ NetworkAcls: [] }),
  createNetworkAclEntry: vi.fn().mockResolvedValue({}),
  deleteNetworkAclEntry: vi.fn().mockResolvedValue({}),
  createFlowLogs: vi.fn().mockResolvedValue({}),
  deleteFlowLogs: vi.fn().mockResolvedValue({}),
  describeFlowLogs: vi.fn().mockResolvedValue({ FlowLogs: [] }),
  allocateElasticIp: vi.fn().mockResolvedValue({}),
  releaseElasticIp: vi.fn().mockResolvedValue({}),
  describeAddresses: vi.fn().mockResolvedValue({ Addresses: [] }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}))

import EC2 from './EC2.vue'

describe('EC2 Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders and loads all data on mount', async () => {
    const wrapper = mount(EC2, {
      global: {
        stubs: {
          Tabs: { template: '<div class="tabs-stub"><slot /></div>', props: ['activeTab', 'tabs'] },
          Button: { template: '<button><slot /></button>' },
          StatusBadge: true,
          EmptyState: true,
          Modal: { template: '<div v-if="open" class="modal-stub"><slot /><slot name="footer" /></div>', props: ['open', 'title'] },
          FormInput: true,
          FormSelect: true,
        },
      },
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.vm.loading).toBe(false)
  })
})
