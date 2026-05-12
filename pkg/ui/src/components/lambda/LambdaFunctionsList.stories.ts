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

function createMockFunction(name: string, overrides: {
  Runtime?: string;
  MemorySize?: number;
  LastModified?: string;
  State?: string;
  Role?: string;
  Handler?: string;
} = {}): Record<string, unknown> {
  return {
    FunctionName: name,
    Runtime: overrides.Runtime ?? 'nodejs18.x',
    MemorySize: overrides.MemorySize ?? 128,
    LastModified: overrides.LastModified ?? '2024-01-15T10:30:00Z',
    State: overrides.State ?? 'Active',
    Role: overrides.Role ?? 'arn:aws:iam::123456789:role/lambda-role',
    Handler: overrides.Handler ?? 'index.handler'
  };
}

function generateMockFunctions(count: number): Record<string, unknown>[] {
  const runtimes = ['nodejs18.x', 'nodejs20.x', 'python3.11', 'python3.12', 'java17', 'go1.x', 'dotnet8', 'ruby3.2'];
  const states = ['Active', 'Active', 'Active', 'Active', 'Inactive']; // weighted toward Active
  const handlers = ['index.handler', 'app.main', 'server.handler', 'main.handler', 'lambda_function.lambda_handler'];
  const roles = [
    'arn:aws:iam::123456789:role/lambda-role',
    'arn:aws:iam::123456789:role/image-role',
    'arn:aws:iam::123456789:role/email-role',
    'arn:aws:iam::123456789:role/data-role',
    'arn:aws:iam::123456789:role/webhook-role'
  ];
  const memorySizes = [128, 256, 512, 1024, 2048, 4096];

  const items: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    items.push(createMockFunction(`func-${i}`, {
      Runtime: runtimes[(i - 1) % runtimes.length],
      MemorySize: memorySizes[(i - 1) % memorySizes.length],
      LastModified: new Date(2024, 0, i).toISOString(),
      State: states[(i - 1) % states.length],
      Role: roles[(i - 1) % roles.length],
      Handler: handlers[(i - 1) % handlers.length]
    }));
  }
  return items;
}

const mockFunctions = [
  createMockFunction('my-function', {
    Runtime: 'nodejs18.x',
    MemorySize: 128,
    LastModified: '2024-01-15T10:30:00Z',
    State: 'Active',
    Role: 'arn:aws:iam::123456789:role/lambda-role',
    Handler: 'index.handler'
  }),
  createMockFunction('image-processor', {
    Runtime: 'python3.11',
    MemorySize: 512,
    LastModified: '2024-02-20T14:45:00Z',
    State: 'Active',
    Role: 'arn:aws:iam::123456789:role/image-role',
    Handler: 'processor.main'
  }),
  createMockFunction('email-sender', {
    Runtime: 'nodejs20.x',
    MemorySize: 256,
    LastModified: '2024-03-10T09:00:00Z',
    State: 'Inactive',
    Role: 'arn:aws:iam::123456789:role/email-role',
    Handler: 'send.main'
  })
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
    functions: generateMockFunctions(12)
  }
};

export const Paginated: Story = {
  args: {
    functions: generateMockFunctions(25)
  }
};

export const InactiveFunction: Story = {
  args: {
    functions: [
      createMockFunction('paused-function', {
        Runtime: 'nodejs18.x',
        MemorySize: 128,
        State: 'Inactive'
      })
    ]
  }
};
