import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsExecutionDetail from './StepFunctionsExecutionDetail.vue';

const meta: Meta<typeof StepFunctionsExecutionDetail> = {
  title: 'Services/StepFunctions/ExecutionDetail',
  component: StepFunctionsExecutionDetail,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockExecution = {
  executionArn: 'arn:aws:states:us-east-1:123456789012:execution:HelloWorld:exec-001',
  stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld',
  name: 'exec-001',
  status: 'SUCCEEDED',
  startDate: '2025-04-01T10:00:00Z',
  stopDate: '2025-04-01T10:00:05Z',
  input: JSON.stringify({ name: 'World', count: 42 }, null, 2),
  output: JSON.stringify({ result: 'Hello, World!', processedAt: '2025-04-01T10:00:05Z' }, null, 2),
};

export const Default: Story = {
  args: { execution: mockExecution }
};

export const Loading: Story = {
  args: { execution: null, loading: true }
};

export const Error: Story = {
  args: { execution: null, loading: false }
};

export const Running: Story = {
  args: {
    execution: {
      executionArn: 'arn:aws:states:us-east-1:123456789012:execution:HelloWorld:exec-002',
      stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld',
      name: 'exec-002',
      status: 'RUNNING',
      startDate: '2025-04-01T10:05:00Z',
      stopDate: undefined,
      input: JSON.stringify({ orderId: 'ORD-123' }, null, 2),
      output: undefined,
    }
  }
};
