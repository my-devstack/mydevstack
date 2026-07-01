import type { Meta, StoryObj } from '@storybook/vue3';
import VPCCreateNaclModal from './VPCCreateNaclModal.vue';

const meta: Meta<typeof VPCCreateNaclModal> = {
  title: 'Services/EC2/VPC/CreateNaclModal',
  component: VPCCreateNaclModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { VPCCreateNaclModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateNaclModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCCreateNaclModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateNaclModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { VPCCreateNaclModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCCreateNaclModal v-bind="args" /></div>' })
};
