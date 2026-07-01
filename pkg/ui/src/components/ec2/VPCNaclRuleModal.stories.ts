import type { Meta, StoryObj } from '@storybook/vue3';
import VPCNaclRuleModal from './VPCNaclRuleModal.vue';

const meta: Meta<typeof VPCNaclRuleModal> = {
  title: 'Services/EC2/VPC/NaclRuleModal',
  component: VPCNaclRuleModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockNacl = {
  NetworkAclId: 'acl-12345678',
  VpcId: 'vpc-12345678',
  IsDefault: false,
  Entries: [
    { RuleNumber: 100, Protocol: 'tcp', PortRange: { From: 80, To: 80 }, CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'allow' as const },
    { RuleNumber: 200, Protocol: 'tcp', PortRange: { From: 443, To: 443 }, CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'allow' as const },
    { RuleNumber: 32767, Protocol: '-1', CidrBlock: '0.0.0.0/0', Egress: false, RuleAction: 'deny' as const },
    { RuleNumber: 100, Protocol: 'tcp', PortRange: { From: 80, To: 80 }, CidrBlock: '0.0.0.0/0', Egress: true, RuleAction: 'allow' as const },
    { RuleNumber: 32767, Protocol: '-1', CidrBlock: '0.0.0.0/0', Egress: true, RuleAction: 'deny' as const },
  ],
  Associations: [],
};

export const Open: Story = {
  args: { open: true, nacl: mockNacl },
  render: (args) => ({ components: { VPCNaclRuleModal }, setup: () => ({ args }), template: '<div class="h-96"><VPCNaclRuleModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCNaclRuleModal }, setup: () => ({ args }), template: '<div class="h-96"><VPCNaclRuleModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: {
    open: true,
    nacl: { NetworkAclId: 'acl-empty', VpcId: 'vpc-12345678', IsDefault: false, Entries: [], Associations: [] },
  },
  render: (args) => ({ components: { VPCNaclRuleModal }, setup: () => ({ args }), template: '<div class="h-96"><VPCNaclRuleModal v-bind="args" /></div>' })
};
