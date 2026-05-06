import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LambdaFunctionsList from './LambdaFunctionsList.vue';

const meta: Meta<typeof LambdaFunctionsList> = {
  title: 'Services/Lambda/FunctionsList',
  component: LambdaFunctionsList,
  tags: ['autodocs'],
  argTypes: {
    functions: { control: 'object' },
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockFunctions = [
  {
    FunctionName: 'my-function',
    Runtime: 'nodejs18.x',
    MemorySize: 128,
    LastModified: '2024-01-15T10:30:00Z',
    State: 'Active',
    Role: 'arn:aws:iam::123456789:role/lambda-role',
    Handler: 'index.handler'
  },
  {
    FunctionName: 'image-processor',
    Runtime: 'python3.11',
    MemorySize: 512,
    LastModified: '2024-02-20T14:45:00Z',
    State: 'Active',
    Role: 'arn:aws:iam::123456789:role/image-role',
    Handler: 'processor.main'
  },
  {
    FunctionName: 'email-sender',
    Runtime: 'nodejs20.x',
    MemorySize: 256,
    LastModified: '2024-03-10T09:00:00Z',
    State: 'Inactive',
    Role: 'arn:aws:iam::123456789:role/email-role',
    Handler: 'send.main'
  }
];

export const Default: Story = {
  args: {
    functions: mockFunctions
  }
};

export const Loading: Story = {
  args: {
    functions: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    functions: [],
    loading: false
  }
};

export const SingleFunction: Story = {
  args: {
    functions: [mockFunctions[0]]
  }
};

export const ManyFunctions: Story = {
  args: {
    functions: [
      ...mockFunctions,
      { FunctionName: 'auth-handler', Runtime: 'nodejs18.x', MemorySize: 256, State: 'Active' },
      { FunctionName: 'data-processor', Runtime: 'python3.11', MemorySize: 1024, State: 'Active' },
      { FunctionName: 'webhook-receiver', Runtime: 'nodejs20.x', MemorySize: 128, State: 'Active' },
      { FunctionName: 'batch-worker', Runtime: 'python3.11', MemorySize: 2048, State: 'Active' },
      { FunctionName: 'notification-service', Runtime: 'nodejs18.x', MemorySize: 512, State: 'Active' }
    ]
  }
};

export const InactiveFunction: Story = {
  args: {
    functions: [
      { FunctionName: 'paused-function', Runtime: 'nodejs18.x', MemorySize: 128, State: 'Inactive' }
    ]
  }
};