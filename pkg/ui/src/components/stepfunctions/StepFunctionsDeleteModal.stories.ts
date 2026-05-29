import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsDeleteModal from './StepFunctionsDeleteModal.vue';

const meta: Meta<typeof StepFunctionsDeleteModal> = {
  title: 'Services/StepFunctions/DeleteModal',
  component: StepFunctionsDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false, stateMachineToDelete: null }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMachine = {
  stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld',
  name: 'HelloWorld',
  status: 'ACTIVE',
  type: 'STANDARD',
  creationDate: '2025-01-15T10:30:00Z',
};

export const Open: Story = {
  args: { open: true, stateMachineToDelete: mockMachine },
  render: (args) => ({ components: { StepFunctionsDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><StepFunctionsDeleteModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true, stateMachineToDelete: mockMachine },
  render: (args) => ({ components: { StepFunctionsDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><StepFunctionsDeleteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { StepFunctionsDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><StepFunctionsDeleteModal v-bind="args" /></div>' })
};
