import type { Meta, StoryObj } from '@storybook/vue3';
import IAMRolePoliciesModal from './IAMRolePoliciesModal.vue';

const meta: Meta<typeof IAMRolePoliciesModal> = {
  title: 'Services/IAM/RolePoliciesModal',
  component: IAMRolePoliciesModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const testPolicies = [
  { PolicyName: 'AdministratorAccess', PolicyArn: 'arn:aws:iam::123456789012:policy/Admin' },
  { PolicyName: 'ReadOnlyAccess', PolicyArn: 'arn:aws:iam::123456789012:policy/ReadOnly' }
];

export const OpenWithPolicies: Story = {
  args: { open: true, roleName: 'my-role', policies: testPolicies },
  render: (args) => ({ components: { IAMRolePoliciesModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMRolePoliciesModal v-bind="args" /></div>' })
};

export const OpenEmpty: Story = {
  args: { open: true, roleName: 'my-role', policies: [] },
  render: (args) => ({ components: { IAMRolePoliciesModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMRolePoliciesModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, roleName: 'my-role', policies: testPolicies },
  render: (args) => ({ components: { IAMRolePoliciesModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMRolePoliciesModal v-bind="args" /></div>' })
};