import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsExecutionList from './StepFunctionsExecutionList.vue';

const meta: Meta<typeof StepFunctionsExecutionList> = {
  title: 'Services/StepFunctions/ExecutionList',
  component: StepFunctionsExecutionList,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockExecutions = [
  { executionArn: 'arn:aws:states:us-east-1:123456789012:execution:HelloWorld:exec-001', stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld', name: 'exec-001', status: 'SUCCEEDED', startDate: '2025-04-01T10:00:00Z', stopDate: '2025-04-01T10:00:05Z' },
  { executionArn: 'arn:aws:states:us-east-1:123456789012:execution:HelloWorld:exec-002', stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld', name: 'exec-002', status: 'RUNNING', startDate: '2025-04-01T10:05:00Z', stopDate: undefined },
  { executionArn: 'arn:aws:states:us-east-1:123456789012:execution:HelloWorld:exec-003', stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld', name: 'exec-003', status: 'FAILED', startDate: '2025-03-31T15:30:00Z', stopDate: '2025-03-31T15:30:12Z' },
  { executionArn: 'arn:aws:states:us-east-1:123456789012:execution:HelloWorld:exec-004', stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld', name: 'exec-004', status: 'ABORTED', startDate: '2025-03-30T09:00:00Z', stopDate: '2025-03-30T09:00:03Z' },
];

export const Default: Story = {
  args: { executions: mockExecutions }
};

export const Loading: Story = {
  args: { executions: [], loading: true }
};

export const Empty: Story = {
  args: { executions: [], loading: false }
};
