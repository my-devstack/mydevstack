import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsDetail from './StepFunctionsDetail.vue';

const meta: Meta<typeof StepFunctionsDetail> = {
  title: 'Services/StepFunctions/Detail',
  component: StepFunctionsDetail,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMachine = {
  stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld',
  name: 'HelloWorld',
  status: 'ACTIVE',
  type: 'STANDARD',
  creationDate: '2025-01-15T10:30:00Z',
  description: 'A simple Hello World state machine',
  definition: JSON.stringify({
    Comment: 'A Hello World example',
    StartAt: 'Hello',
    States: {
      Hello: {
        Type: 'Pass',
        Result: 'Hello, World!',
        End: true
      }
    }
  }, null, 2)
};

export const Default: Story = {
  args: { stateMachine: mockMachine }
};

export const Loading: Story = {
  args: { stateMachine: null, loading: true }
};

export const Error: Story = {
  args: { stateMachine: null, loading: false }
};

export const WithLongDefinition: Story = {
  args: {
    stateMachine: {
      stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:ComplexWorkflow',
      name: 'ComplexWorkflow',
      status: 'ACTIVE',
      type: 'STANDARD',
      creationDate: '2025-03-01T00:00:00Z',
      definition: JSON.stringify({
        Comment: 'A complex workflow with multiple states',
        StartAt: 'ProcessOrder',
        States: {
          ProcessOrder: {
            Type: 'Task',
            Resource: 'arn:aws:lambda:us-east-1:123456789012:function:process-order',
            Next: 'CheckInventory'
          },
          CheckInventory: {
            Type: 'Task',
            Resource: 'arn:aws:lambda:us-east-1:123456789012:function:check-inventory',
            Next: 'ShipOrReject'
          },
          ShipOrReject: {
            Type: 'Choice',
            Choices: [
              { Variable: '$.inventory.available', BooleanEquals: true, Next: 'ShipOrder' }
            ],
            Default: 'RejectOrder'
          },
          ShipOrder: {
            Type: 'Task',
            Resource: 'arn:aws:lambda:us-east-1:123456789012:function:ship-order',
            End: true
          },
          RejectOrder: {
            Type: 'Task',
            Resource: 'arn:aws:lambda:us-east-1:123456789012:function:reject-order',
            End: true
          }
        }
      }, null, 2)
    }
  }
};

export const InDetailView: Story = {
  args: {
    stateMachine: {
      stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld',
      name: 'HelloWorld',
      status: 'ACTIVE',
      type: 'STANDARD',
      creationDate: '2025-01-15T10:30:00Z',
      description: 'A simple Hello World state machine - used in detail view context',
      definition: JSON.stringify({
        Comment: 'A Hello World example',
        StartAt: 'Hello',
        States: {
          Hello: {
            Type: 'Pass',
            Result: 'Hello, World!',
            End: true
          }
        }
      }, null, 2)
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Detail view as shown in separate detail page with back navigation'
      }
    }
  }
};
