import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsCreateModal from './StepFunctionsCreateModal.vue';

const meta: Meta<typeof StepFunctionsCreateModal> = {
  title: 'Services/StepFunctions/CreateModal',
  component: StepFunctionsCreateModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false, newMachineName: '', newMachineDefinition: '', newMachineRoleArn: '', newMachineType: 'STANDARD' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { StepFunctionsCreateModal }, setup: () => ({ args }), template: '<div class="h-96"><StepFunctionsCreateModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { StepFunctionsCreateModal }, setup: () => ({ args }), template: '<div class="h-96"><StepFunctionsCreateModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { StepFunctionsCreateModal }, setup: () => ({ args }), template: '<div class="h-96"><StepFunctionsCreateModal v-bind="args" /></div>' })
};

export const WithPreFilledData: Story = {
  args: {
    open: true,
    newMachineName: 'MyStateMachine',
    newMachineDefinition: JSON.stringify({
      StartAt: 'Hello',
      States: {
        Hello: { Type: 'Pass', End: true }
      }
    }, null, 2),
    newMachineRoleArn: 'arn:aws:iam::123456789012:role/my-sfn-role',
    newMachineType: 'STANDARD',
  },
  render: (args) => ({ components: { StepFunctionsCreateModal }, setup: () => ({ args }), template: '<div class="h-96"><StepFunctionsCreateModal v-bind="args" /></div>' })
};
