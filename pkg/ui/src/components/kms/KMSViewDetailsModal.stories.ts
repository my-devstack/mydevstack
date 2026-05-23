import type { Meta, StoryObj } from '@storybook/vue3';
import KMSViewDetailsModal from './KMSViewDetailsModal.vue';

const meta: Meta<typeof KMSViewDetailsModal> = {
  title: 'Services/KMS/ViewDetailsModal',
  component: KMSViewDetailsModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockKey = {
  KeyId: 'abc123',
  keyMetadata: {
    KeyId: 'abc123',
    KeyState: 'Enabled',
    KeyUsage: 'ENCRYPT_DECRYPT',
    Description: 'My encryption key',
    CreationDate: new Date('2024-01-15')
  }
};

export const Open: Story = {
  args: { open: true, selectedKey: mockKey, loading: false },
  render: (args) => ({ components: { KMSViewDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSViewDetailsModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, selectedKey: null, loading: true },
  render: (args) => ({ components: { KMSViewDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSViewDetailsModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, selectedKey: mockKey, loading: false },
  render: (args) => ({ components: { KMSViewDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSViewDetailsModal v-bind="args" /></div>' })
};