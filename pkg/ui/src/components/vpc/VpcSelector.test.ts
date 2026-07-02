import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import VpcSelector from './VpcSelector.vue'

// ── Mock data ──────────────────────────────────────────────

const mockVpcs = [
  { VpcId: 'vpc-123', CidrBlock: '10.0.0.0/16', IsDefault: true, State: 'available' },
  { VpcId: 'vpc-456', CidrBlock: '172.16.0.0/12', IsDefault: false, State: 'available' },
]

const mockSubnets = [
  { SubnetId: 'subnet-a1', VpcId: 'vpc-123', CidrBlock: '10.0.1.0/24', AvailabilityZone: 'us-east-1a', State: 'available' },
  { SubnetId: 'subnet-a2', VpcId: 'vpc-123', CidrBlock: '10.0.2.0/24', AvailabilityZone: 'us-east-1b', State: 'available' },
]

const mockSecurityGroups = [
  { GroupId: 'sg-111', GroupName: 'default', Description: 'Default SG', VpcId: 'vpc-123' },
  { GroupId: 'sg-222', GroupName: 'web', Description: 'Web SG', VpcId: 'vpc-123' },
]

// ── Mocks ──────────────────────────────────────────────────

vi.mock('@/api/services/vpc', () => ({
  describeVpcs: vi.fn(),
  describeSubnets: vi.fn(),
}))

vi.mock('@/api/services/ec2', () => ({
  describeSecurityGroups: vi.fn(),
}))

vi.mock('@/api/services/rds', () => ({
  describeDBSubnetGroups: vi.fn(),
}))

vi.mock('@/api/services/elasticache', () => ({
  describeCacheSubnetGroups: vi.fn(),
  describeCacheSecurityGroups: vi.fn(),
}))

// ── Tests ──────────────────────────────────────────────────

describe('VpcSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── Rendering ────────────────────────────────────────────

  describe('render', () => {
    it('renders with default props', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null },
      })
      await flushPromises()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('VPC Configuration')
    })

    it('shows (optional) in label when not required', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null, required: false },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('(optional)')
    })

    it('shows required asterisk when required', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null, required: true },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('*')
    })

    it('renders custom label', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null, label: 'Network Config' },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('Network Config')
    })
  })

  // ── VPC dropdown ─────────────────────────────────────────

  describe('VPC dropdown', () => {
    it('renders VPC FormSelect with options', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null },
      })
      await flushPromises()

      const selects = wrapper.findAllComponents({ name: 'FormSelect' })
      expect(selects.length).toBeGreaterThanOrEqual(1)
    })

    it('shows loading state while VPCs load', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockReturnValue(new Promise(() => {}))

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null },
      })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
    })

    it('shows empty state when no VPCs found', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: [] })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null },
      })
      await flushPromises()
      expect(wrapper.text()).toContain('No VPCs found')
    })
  })

  // ── Validation ───────────────────────────────────────────

  describe('validation', () => {
    it('shows validation error when required and no VPC selected', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null, required: true },
      })
      await flushPromises()

      const formSelect = wrapper.findComponent({ name: 'FormSelect' })
      expect(formSelect.props('error')).toBe('This field is required')
    })
  })

  // ── Emits modelValue ─────────────────────────────────────

  describe('emits', () => {
    it('emits update:modelValue when VPC is selected', async () => {
      const vpcApi = await import('@/api/services/vpc')
      vi.mocked(vpcApi.describeVpcs).mockResolvedValue({ Vpcs: mockVpcs })
      vi.mocked(vpcApi.describeSubnets).mockResolvedValue({ Subnets: mockSubnets })

      const ec2Api = await import('@/api/services/ec2')
      vi.mocked(ec2Api.describeSecurityGroups).mockResolvedValue({ SecurityGroups: mockSecurityGroups })

      const wrapper = mount(VpcSelector, {
        props: { modelValue: null },
      })
      await flushPromises()

      // Simulate VPC selection via FormSelect
      const formSelect = wrapper.findComponent({ name: 'FormSelect' })
      formSelect.vm.$emit('update:modelValue', 'vpc-123')
      await flushPromises()

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      if (emitted) {
        const lastCall = emitted[emitted.length - 1]
        expect(lastCall[0]).toEqual({
          vpcId: 'vpc-123',
          subnetIds: [],
          securityGroupIds: [],
        })
      }
    })
  })
})
