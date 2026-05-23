import type { Meta, StoryObj } from '@storybook/vue3';
import RDSDeleteModal from './RDSDeleteModal.vue';

const meta: Meta<typeof RDSDeleteModal> = {
  title: 'Services/RDS/DeleteModal',
  component: RDSDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockInstance = { DBInstanceIdentifier: 'my-database' };

export const Open: Story = {
  args: { open: true, instance: mockInstance },
  render: (args) => ({ components: { RDSDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><RDSDeleteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, instance: mockInstance },
  render: (args) => ({ components: { RDSDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><RDSDeleteModal v-bind="args" /></div>' })
};