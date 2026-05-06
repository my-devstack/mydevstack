import type { Meta, StoryObj } from '@storybook/vue3-vite';
import RDSCreateInstanceModal from './RDSCreateInstanceModal.vue';

const meta: Meta<typeof RDSCreateInstanceModal> = {
  title: 'Services/RDS/CreateInstanceModal',
  component: RDSCreateInstanceModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { RDSCreateInstanceModal }, setup: () => ({ args }), template: '<div class="h-96"><RDSCreateInstanceModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { RDSCreateInstanceModal }, setup: () => ({ args }), template: '<div class="h-96"><RDSCreateInstanceModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { RDSCreateInstanceModal }, setup: () => ({ args }), template: '<div class="h-96"><RDSCreateInstanceModal v-bind="args" /></div>' })
};