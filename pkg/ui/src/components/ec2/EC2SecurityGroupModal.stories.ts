import type { Meta, StoryObj } from '@storybook/vue3';
import EC2SecurityGroupModal from './EC2SecurityGroupModal.vue';

const meta: Meta<typeof EC2SecurityGroupModal> = {
  title: 'Services/EC2/SecurityGroupModal',
  component: EC2SecurityGroupModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { EC2SecurityGroupModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2SecurityGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { EC2SecurityGroupModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2SecurityGroupModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { EC2SecurityGroupModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2SecurityGroupModal v-bind="args" /></div>' })
};
