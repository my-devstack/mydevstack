import type { Meta, StoryObj } from '@storybook/vue3';
import KMSEncryptModal from './KMSEncryptModal.vue';

const meta: Meta<typeof KMSEncryptModal> = {
  title: 'Services/KMS/EncryptModal',
  component: KMSEncryptModal,
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
    Description: 'My key'
  }
};

export const Open: Story = {
  args: { open: true, selectedKey: mockKey, encryptForm: { plaintext: '' }, encryptedResult: '' },
  render: (args) => ({ components: { KMSEncryptModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSEncryptModal v-bind="args" /></div>' })
};

export const WithResult: Story = {
  args: { open: true, selectedKey: mockKey, encryptForm: { plaintext: 'Hello World' }, encryptedResult: 'AQIDAHhq...' },
  render: (args) => ({ components: { KMSEncryptModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSEncryptModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, selectedKey: mockKey, encryptForm: { plaintext: '' }, encryptedResult: '' },
  render: (args) => ({ components: { KMSEncryptModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSEncryptModal v-bind="args" /></div>' })
};