import type { Meta, StoryObj } from '@storybook/vue3';
import VPCDeleteModal from './VPCDeleteModal.vue';

const meta: Meta<typeof VPCDeleteModal> = {
  title: 'Services/EC2/VPC/DeleteModal',
  component: VPCDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, deleting: { control: 'boolean' } },
  args: { open: false, deleting: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCDeleteModal v-bind="args" /></div>' })
};

export const VPC: Story = {
  args: { open: true, itemName: 'vpc-12345678', itemType: 'vpc' },
  render: (args) => ({ components: { VPCDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCDeleteModal v-bind="args" /></div>' })
};

export const Subnet: Story = {
  args: { open: true, itemName: 'subnet-12345678', itemType: 'subnet' },
  render: (args) => ({ components: { VPCDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCDeleteModal v-bind="args" /></div>' })
};

export const RouteTable: Story = {
  args: { open: true, itemName: 'rtb-12345678', itemType: 'routetable' },
  render: (args) => ({ components: { VPCDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><VPCDeleteModal v-bind="args" /></div>' })
};
