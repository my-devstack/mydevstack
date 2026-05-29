import type { Meta, StoryObj } from '@storybook/vue3';
import IAMDeletePolicyModal from './IAMDeletePolicyModal.vue';

const meta: Meta<typeof IAMDeletePolicyModal> = {
  title: 'Services/IAM/DeletePolicyModal',
  component: IAMDeletePolicyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, policyName: 'my-policy' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMDeletePolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeletePolicyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMDeletePolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeletePolicyModal v-bind="args" /></div>' })
};