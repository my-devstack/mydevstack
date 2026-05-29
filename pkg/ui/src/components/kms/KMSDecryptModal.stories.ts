import type { Meta, StoryObj } from '@storybook/vue3';
import KMSDecryptModal from './KMSDecryptModal.vue';

const meta: Meta<typeof KMSDecryptModal> = {
  title: 'Services/KMS/DecryptModal',
  component: KMSDecryptModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, decryptForm: { ciphertext: '' }, decryptedResult: '' },
  render: (args) => ({ components: { KMSDecryptModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSDecryptModal v-bind="args" /></div>' })
};

export const WithResult: Story = {
  args: { open: true, decryptForm: { ciphertext: 'AQIDAHhq...' }, decryptedResult: 'Hello World' },
  render: (args) => ({ components: { KMSDecryptModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSDecryptModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, decryptForm: { ciphertext: '' }, decryptedResult: '' },
  render: (args) => ({ components: { KMSDecryptModal }, setup: () => ({ args }), template: '<div class="h-64"><KMSDecryptModal v-bind="args" /></div>' })
};