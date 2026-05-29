import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsStartExecutionModal from './StepFunctionsStartExecutionModal.vue';

const meta: Meta<typeof StepFunctionsStartExecutionModal> = {
  title: 'Services/StepFunctions/StartExecutionModal',
  component: StepFunctionsStartExecutionModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false, newExecutionInput: '', stateMachineName: 'HelloWorld' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { StepFunctionsStartExecutionModal }, setup: () => ({ args }), template: '<div class="h-80"><StepFunctionsStartExecutionModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { StepFunctionsStartExecutionModal }, setup: () => ({ args }), template: '<div class="h-80"><StepFunctionsStartExecutionModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { StepFunctionsStartExecutionModal }, setup: () => ({ args }), template: '<div class="h-80"><StepFunctionsStartExecutionModal v-bind="args" /></div>' })
};

export const WithInput: Story = {
  args: {
    open: true,
    newExecutionInput: JSON.stringify({ key: 'value', number: 42 }, null, 2),
    stateMachineName: 'DataPipeline',
  },
  render: (args) => ({ components: { StepFunctionsStartExecutionModal }, setup: () => ({ args }), template: '<div class="h-80"><StepFunctionsStartExecutionModal v-bind="args" /></div>' })
};
