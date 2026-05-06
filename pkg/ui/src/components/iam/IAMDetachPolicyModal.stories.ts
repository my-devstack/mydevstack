import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMDetachPolicyModal from './IAMDetachPolicyModal.vue';

const meta: Meta<typeof IAMDetachPolicyModal> = {
  title: 'Services/IAM/DetachPolicyModal',
  component: IAMDetachPolicyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, policyName: 'ReadOnlyAccess', roleName: 'my-role' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMDetachPolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDetachPolicyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMDetachPolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDetachPolicyModal v-bind="args" /></div>' })
};