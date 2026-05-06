import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IAMDeleteAccessKeyModal from './IAMDeleteAccessKeyModal.vue';

const meta: Meta<typeof IAMDeleteAccessKeyModal> = {
  title: 'Services/IAM/DeleteAccessKeyModal',
  component: IAMDeleteAccessKeyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, accessKeyId: 'AKIAIOSFODNN7EXAMPLE' },
  render: (args) => ({ components: { IAMDeleteAccessKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteAccessKeyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, accessKeyId: 'AKIAIOSFODNN7EXAMPLE' },
  render: (args) => ({ components: { IAMDeleteAccessKeyModal }, setup: () => ({ args }), template: '<div class="h-64"><IAMDeleteAccessKeyModal v-bind="args" /></div>' })
};