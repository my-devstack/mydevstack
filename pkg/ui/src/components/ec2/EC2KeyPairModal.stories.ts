import type { Meta, StoryObj } from '@storybook/vue3';
import EC2KeyPairModal from './EC2KeyPairModal.vue';

const meta: Meta<typeof EC2KeyPairModal> = {
  title: 'Services/EC2/KeyPairModal',
  component: EC2KeyPairModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, creating: { control: 'boolean' } },
  args: { open: false, creating: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { EC2KeyPairModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2KeyPairModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { EC2KeyPairModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2KeyPairModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, creating: true },
  render: (args) => ({ components: { EC2KeyPairModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2KeyPairModal v-bind="args" /></div>' })
};

export const WithKeyMaterial: Story = {
  args: { open: true, newKeyMaterial: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----' },
  render: (args) => ({ components: { EC2KeyPairModal }, setup: () => ({ args }), template: '<div class="h-96"><EC2KeyPairModal v-bind="args" /></div>' })
};
