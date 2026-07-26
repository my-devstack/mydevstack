import type { Meta, StoryObj } from '@storybook/vue3';
import VpcSelector from './VpcSelector.vue';

const meta: Meta<typeof VpcSelector> = {
  title: 'Services/VPC/VpcSelector',
  component: VpcSelector,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'object' },
    resourceType: {
      control: 'select',
      options: ['ec2', 'rds', 'elasticache', 'msk', 'opensearch', 'lambda'],
    },
    required: { control: 'boolean' },
    showSubnet: { control: 'boolean' },
    showSecurityGroup: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    modelValue: null,
    resourceType: 'ec2',
    required: false,
    showSubnet: true,
    showSecurityGroup: true,
    label: 'VPC Configuration',
  },
  parameters: {
    mockData: [
      {
        url: '*/vpcs',
        method: 'GET',
        status: 200,
        response: {
          Vpcs: [
            { VpcId: 'vpc-abc123', CidrBlock: '10.0.0.0/16', IsDefault: true, State: 'available' },
            { VpcId: 'vpc-def456', CidrBlock: '172.31.0.0/16', IsDefault: false, State: 'available' },
            { VpcId: 'vpc-ghi789', CidrBlock: '192.168.0.0/16', IsDefault: false, State: 'available' },
          ],
        },
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    resourceType: 'ec2',
    required: false,
  },
};

export const Required: Story = {
  args: {
    resourceType: 'ec2',
    required: true,
  },
};

export const Loading: Story = {
  args: {
    resourceType: 'ec2',
  },
  parameters: {
    mockData: [
      {
        url: '*/vpcs',
        method: 'GET',
        status: 200,
        delay: 999999, // Simulate loading
        response: { Vpcs: [] },
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    resourceType: 'ec2',
  },
  parameters: {
    mockData: [
      {
        url: '*/vpcs',
        method: 'GET',
        status: 200,
        response: { Vpcs: [] },
      },
    ],
  },
};

export const RdsVariant: Story = {
  args: {
    resourceType: 'rds',
  },
};

export const ElastiCacheVariant: Story = {
  args: {
    resourceType: 'elasticache',
  },
};

export const MskVariant: Story = {
  args: {
    resourceType: 'msk',
  },
};

export const OpenSearchVariant: Story = {
  args: {
    resourceType: 'opensearch',
  },
};

export const LambdaVariant: Story = {
  args: {
    resourceType: 'lambda',
  },
};

export const SubnetHidden: Story = {
  args: {
    resourceType: 'ec2',
    showSubnet: false,
  },
};

export const SecurityGroupHidden: Story = {
  args: {
    resourceType: 'ec2',
    showSecurityGroup: false,
  },
};
