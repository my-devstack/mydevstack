import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StackList from './StackList.vue';

const meta: Meta<typeof StackList> = {
  title: 'Services/CloudFormation/StackList',
  component: StackList,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStacks = [
  { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/test-stack', StackName: 'test-stack', CreationTime: '2024-01-15T10:30:00Z', StackStatus: 'CREATE_COMPLETE', LastUpdatedTime: '2024-01-15T12:00:00Z', Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'], EnableTerminationProtection: true, RoleARN: 'arn:aws:iam::123456789:role/cfn-role', Tags: [{ Key: 'Environment', Value: 'Dev' }, { Key: 'Project', Value: 'Test' }], DriftInformation: { StackDriftStatus: 'IN_SYNC' } },
  { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/prod-stack', StackName: 'prod-stack', CreationTime: '2024-02-20T14:45:00Z', StackStatus: 'UPDATE_COMPLETE', LastUpdatedTime: '2024-03-01T10:00:00Z', Capabilities: ['CAPABILITY_IAM'], EnableTerminationProtection: true, RoleARN: 'arn:aws:iam::123456789:role/prod-cfn', Tags: [{ Key: 'Environment', Value: 'Prod' }], DriftInformation: { StackDriftStatus: 'DRIFTED', LastCheckTimestamp: '2024-03-01T10:00:00Z' } },
  { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/old-stack', StackName: 'old-stack', CreationTime: '2023-12-01T00:00:00Z', StackStatus: 'DELETE_COMPLETE', Capabilities: [], EnableTerminationProtection: false }
];

const mockResources = [
  { LogicalResourceId: 'VPC', ResourceType: 'AWS::EC2::VPC', PhysicalResourceId: 'vpc-12345', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:35:00Z' },
  { LogicalResourceId: 'SubnetA', ResourceType: 'AWS::EC2::Subnet', PhysicalResourceId: 'subnet-a123', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:36:00Z' },
  { LogicalResourceId: 'SubnetB', ResourceType: 'AWS::EC2::Subnet', PhysicalResourceId: 'subnet-b456', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:36:00Z' },
  { LogicalResourceId: 'SecurityGroup', ResourceType: 'AWS::EC2::SecurityGroup', PhysicalResourceId: 'sg-789', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:37:00Z' },
  { LogicalResourceId: 'Instance', ResourceType: 'AWS::EC2::Instance', PhysicalResourceId: 'i-abc123', ResourceStatus: 'CREATE_COMPLETE', LastUpdatedTimestamp: '2024-01-15T10:40:00Z' },
];

export const Default: Story = {
  args: { stacks: mockStacks }
};

export const Loading: Story = {
  args: { stacks: [], loading: true }
};

export const Empty: Story = {
  args: { stacks: [], loading: false }
};

export const CreateInProgress: Story = {
  args: {
    stacks: [
      { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/deploying', StackName: 'deploying', CreationTime: '2024-03-10T09:00:00Z', StackStatus: 'CREATE_IN_PROGRESS' }
    ]
  }
};

export const Failed: Story = {
  args: {
    stacks: [
      { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/failed', StackName: 'failed', CreationTime: '2024-03-10T09:00:00Z', StackStatus: 'CREATE_FAILED', StatusReason: 'Resource limit exceeded' }
    ]
  }
};

export const WithNestedStack: Story = {
  args: {
    stacks: [
      { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/nested-parent', StackName: 'nested-parent', CreationTime: '2024-01-15T10:30:00Z', StackStatus: 'CREATE_COMPLETE', ParentId: 'arn:aws:cloudformation:us-east-1:123456789:stack/root-stack', RootId: 'arn:aws:cloudformation:us-east-1:123456789:stack/root-stack' }
    ]
  }
};

// Resources stories - note: resource loading is internal state triggered on expand
// Use E2E tests to verify resources load correctly
export const WithOutputs: Story = {
  args: {
    stacks: [
      {
        StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/with-outputs',
        StackName: 'with-outputs',
        CreationTime: '2024-01-15T10:30:00Z',
        StackStatus: 'CREATE_COMPLETE',
        Outputs: [
          { OutputKey: 'VPCId', OutputValue: 'vpc-12345', Description: 'VPC ID' },
          { OutputKey: 'SubnetIds', OutputValue: 'subnet-a,subnet-b', Description: 'Subnet IDs' },
          { OutputKey: 'InstanceEndpoint', OutputValue: 'http://ec2.amazonaws.com', Description: 'Instance Endpoint' }
        ]
      }
    ]
  }
};

export const WithTags: Story = {
  args: {
    stacks: [
      {
        StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/tagged',
        StackName: 'tagged-stack',
        CreationTime: '2024-01-15T10:30:00Z',
        StackStatus: 'CREATE_COMPLETE',
        Tags: [
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Team', Value: 'Platform' },
          { Key: 'CostCenter', Value: '12345' },
          { Key: 'Project', Value: 'Infrastructure' }
        ]
      }
    ]
  }
};