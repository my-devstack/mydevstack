import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMUserKeysModal from './IAMUserKeysModal.vue';

const meta: Meta<typeof IAMUserKeysModal> = {
  title: 'Services/IAM/UserKeysModal',
  component: IAMUserKeysModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const testKeys = [
  { AccessKeyId: 'AKIAIOSFODNN7EXAMPLE', Status: 'Active' as const, CreateDate: '2024-01-15T10:30:00Z' },
  { AccessKeyId: 'AKIAJ7G2C2H3M4EXAMPLE', Status: 'Inactive' as const, CreateDate: '2023-06-20T14:00:00Z' }
];

export const OpenWithKeys: Story = {
  args: { open: true, userName: 'john@example.com', accessKeys: testKeys, formatDate: (d?: string) => d ? new Date(d).toLocaleDateString() : 'N/A' },
  render: (args) => ({ components: { IAMUserKeysModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMUserKeysModal v-bind="args" /></div>' })
};

export const OpenEmpty: Story = {
  args: { open: true, userName: 'john@example.com', accessKeys: [], formatDate: (d?: string) => d ? new Date(d).toLocaleDateString() : 'N/A' },
  render: (args) => ({ components: { IAMUserKeysModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMUserKeysModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, userName: 'john@example.com', accessKeys: testKeys, formatDate: (d?: string) => d ? new Date(d).toLocaleDateString() : 'N/A' },
  render: (args) => ({ components: { IAMUserKeysModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMUserKeysModal v-bind="args" /></div>' })
};