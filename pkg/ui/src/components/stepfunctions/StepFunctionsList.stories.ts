import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsList from './StepFunctionsList.vue';

const meta: Meta<typeof StepFunctionsList> = {
  title: 'Services/StepFunctions/List',
  component: StepFunctionsList,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMachines = [
  { stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld', name: 'HelloWorld', status: 'ACTIVE', type: 'STANDARD', creationDate: '2025-01-15T10:30:00Z', description: 'A simple hello world workflow' },
  { stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:DataPipeline', name: 'DataPipeline', status: 'ACTIVE', type: 'STANDARD', creationDate: '2025-02-20T14:00:00Z' },
  { stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:OrderProcessor', name: 'OrderProcessor', status: 'ACTIVE', type: 'EXPRESS', creationDate: '2025-03-10T08:15:00Z', description: 'Process orders in near real-time' },
  { stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:LegacyWorkflow', name: 'LegacyWorkflow', status: 'ACTIVE', type: 'STANDARD', creationDate: '2024-11-05T16:45:00Z' },
];

// Mock function that simulates loading details with definition
const mockGetDetails = async (arn: string) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  const definitions: Record<string, string> = {
    'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld': JSON.stringify({ Comment: 'Hello World example', StartAt: 'Hello', States: { Hello: { Type: 'Pass', End: true } } }),
    'arn:aws:states:us-east-1:123456789012:stateMachine:DataPipeline': JSON.stringify({ Comment: 'Data pipeline', StartAt: 'Process', States: { Process: { Type: 'Task', End: true } } }),
    'arn:aws:states:us-east-1:123456789012:stateMachine:OrderProcessor': JSON.stringify({ Comment: 'Order processing', StartAt: 'Validate', States: { Validate: { Type: 'Choice', End: true } } }),
    'arn:aws:states:us-east-1:123456789012:stateMachine:LegacyWorkflow': JSON.stringify({ Comment: 'Legacy workflow', StartAt: 'Start', States: { Start: { Type: 'Pass', End: true } } }),
  }
  return {
    stateMachineArn: arn,
    name: arn.split(':').pop() || '',
    definition: definitions[arn] || '',
    description: 'Loaded from describeStateMachine API',
    status: 'ACTIVE',
    type: 'STANDARD',
    creationDate: '2025-01-15T10:30:00Z',
  }
}

export const Default: Story = {
  args: { stateMachines: mockMachines }
};

export const Loading: Story = {
  args: { stateMachines: [], loading: true }
};

export const Empty: Story = {
  args: { stateMachines: [], loading: false }
};

export const WithMixedStatuses: Story = {
  args: {
    stateMachines: [
      { stateMachineArn: 'arn:aws:states:us-east-1:1:stateMachine:Running', name: 'RunningWorkflow', status: 'RUNNING', type: 'STANDARD', creationDate: '2025-04-01T00:00:00Z' },
      { stateMachineArn: 'arn:aws:states:us-east-1:1:stateMachine:Failed', name: 'FailedWorkflow', status: 'FAILED', type: 'STANDARD', creationDate: '2025-03-15T00:00:00Z' },
      { stateMachineArn: 'arn:aws:states:us-east-1:1:stateMachine:Active', name: 'ActiveWorkflow', status: 'ACTIVE', type: 'EXPRESS', creationDate: '2025-02-01T00:00:00Z' },
    ]
  }
};

export const WithGetDetailsFunction: Story = {
  args: {
    stateMachines: mockMachines,
    getDetails: mockGetDetails
  }
};
