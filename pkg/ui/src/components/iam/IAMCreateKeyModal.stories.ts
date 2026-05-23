import type { Meta, StoryObj } from '@storybook/vue3';
import IAMCreateKeyModal from './IAMCreateKeyModal.vue';

const meta: Meta<typeof IAMCreateKeyModal> = {
  title: 'Services/IAM/CreateKeyModal',
  component: IAMCreateKeyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockKey = {
  AccessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};

export const Open: Story = {
  args: { open: true, newAccessKey: null },
  render: (args) => ({ components: { IAMCreateKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateKeyModal v-bind="args" /></div>' })
};

export const WithKey: Story = {
  args: { open: true, newAccessKey: mockKey },
  render: (args) => ({ components: { IAMCreateKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateKeyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, newAccessKey: null },
  render: (args) => ({ components: { IAMCreateKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMCreateKeyModal v-bind="args" /></div>' })
};