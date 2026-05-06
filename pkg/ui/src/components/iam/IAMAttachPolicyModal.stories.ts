import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMAttachPolicyModal from './IAMAttachPolicyModal.vue';

const meta: Meta<typeof IAMAttachPolicyModal> = {
  title: 'Services/IAM/AttachPolicyModal',
  component: IAMAttachPolicyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const policies = [
  { PolicyName: 'AdministratorAccess', PolicyArn: 'arn:aws:iam::123456789012:policy/Admin' },
  { PolicyName: 'ReadOnlyAccess', PolicyArn: 'arn:aws:iam::123456789012:policy/ReadOnly' },
  { PolicyName: 'PowerUserAccess', PolicyArn: 'arn:aws:iam::123456789012:policy/PowerUser' }
];

export const Open: Story = {
  args: { open: true, policies },
  render: (args) => ({ components: { IAMAttachPolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAttachPolicyModal v-bind="args" /></div>' })
};

export const OpenEmpty: Story = {
  args: { open: true, policies: [] },
  render: (args) => ({ components: { IAMAttachPolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAttachPolicyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, policies },
  render: (args) => ({ components: { IAMAttachPolicyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMAttachPolicyModal v-bind="args" /></div>' })
};