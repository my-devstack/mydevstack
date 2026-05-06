import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMDeleteGroupModal from './IAMDeleteGroupModal.vue';

const meta: Meta<typeof IAMDeleteGroupModal> = {
  title: 'Services/IAM/DeleteGroupModal',
  component: IAMDeleteGroupModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, groupName: 'developers' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMDeleteGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMDeleteGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteGroupModal v-bind="args" /></div>' })
};