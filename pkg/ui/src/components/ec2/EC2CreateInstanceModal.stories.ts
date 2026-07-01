import type { Meta, StoryObj } from '@storybook/vue3';
import EC2CreateInstanceModal from './EC2CreateInstanceModal.vue';

const meta: Meta<typeof EC2CreateInstanceModal> = {
  title: 'Services/EC2/CreateInstanceModal',
  component: EC2CreateInstanceModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { EC2CreateInstanceModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2CreateInstanceModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { EC2CreateInstanceModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2CreateInstanceModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { EC2CreateInstanceModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2CreateInstanceModal v-bind="args" /></div>' })
};
