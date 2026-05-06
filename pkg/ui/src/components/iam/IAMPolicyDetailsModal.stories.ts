import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMPolicyDetailsModal from './IAMPolicyDetailsModal.vue';

const meta: Meta<typeof IAMPolicyDetailsModal> = {
  title: 'Services/IAM/PolicyDetailsModal',
  component: IAMPolicyDetailsModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const testPolicy = {
  PolicyName: 'AdministratorAccess',
  PolicyArn: 'arn:aws:iam::123456789012:policy/AdministratorAccess',
  PolicyId: 'ANPAI22222222222222222',
  AttachmentCount: 5
};

export const Open: Story = {
  args: { open: true, policy: testPolicy },
  render: (args) => ({ components: { IAMPolicyDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMPolicyDetailsModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, policy: testPolicy },
  render: (args) => ({ components: { IAMPolicyDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMPolicyDetailsModal v-bind="args" /></div>' })
};

export const NoPolicy: Story = {
  args: { open: true, policy: null },
  render: (args) => ({ components: { IAMPolicyDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMPolicyDetailsModal v-bind="args" /></div>' })
};