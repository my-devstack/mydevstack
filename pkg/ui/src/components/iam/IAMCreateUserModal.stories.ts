import type { Meta, StoryObj } from '@storybook/vue3';
import IAMCreateUserModal from './IAMCreateUserModal.vue';

const meta: Meta<typeof IAMCreateUserModal> = {
  title: 'Services/IAM/CreateUserModal',
  component: IAMCreateUserModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMCreateUserModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateUserModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMCreateUserModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateUserModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { IAMCreateUserModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateUserModal v-bind="args" /></div>' })
};