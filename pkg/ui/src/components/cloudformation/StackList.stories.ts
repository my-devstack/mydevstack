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
  { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/test-stack', StackName: 'test-stack', CreationTime: '2024-01-15T10:30:00Z', StackStatus: 'CREATE_COMPLETE' },
  { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/prod-stack', StackName: 'prod-stack', CreationTime: '2024-02-20T14:45:00Z', StackStatus: 'UPDATE_COMPLETE' },
  { StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/old-stack', StackName: 'old-stack', CreationTime: '2023-12-01T00:00:00Z', StackStatus: 'DELETE_COMPLETE' }
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