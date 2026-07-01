import type { Meta, StoryObj } from '@storybook/vue3';
import EC2DeleteModal from './EC2DeleteModal.vue';

const meta: Meta<typeof EC2DeleteModal> = {
  title: 'Services/EC2/DeleteModal',
  component: EC2DeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, deleting: { control: 'boolean' } },
  args: { open: false, deleting: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { EC2DeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><EC2DeleteModal v-bind="args" /></div>' })
};

export const Instance: Story = {
  args: { open: true, itemName: 'i-1234567890abcdef0', itemType: 'instance' },
  render: (args) => ({ components: { EC2DeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><EC2DeleteModal v-bind="args" /></div>' })
};

export const KeyPair: Story = {
  args: { open: true, itemName: 'my-key-pair', itemType: 'key pair' },
  render: (args) => ({ components: { EC2DeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><EC2DeleteModal v-bind="args" /></div>' })
};

export const SecurityGroup: Story = {
  args: { open: true, itemName: 'sg-12345678', itemType: 'security group' },
  render: (args) => ({ components: { EC2DeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><EC2DeleteModal v-bind="args" /></div>' })
};
