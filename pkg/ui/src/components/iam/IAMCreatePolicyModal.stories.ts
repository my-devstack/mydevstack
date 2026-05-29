import type { Meta, StoryObj } from '@storybook/vue3';
import IAMCreatePolicyModal from './IAMCreatePolicyModal.vue';

const meta: Meta<typeof IAMCreatePolicyModal> = {
  title: 'Services/IAM/CreatePolicyModal',
  component: IAMCreatePolicyModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { IAMCreatePolicyModal }, setup: () => ({ args }), template: '<div class="h-96"><IAMCreatePolicyModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { IAMCreatePolicyModal }, setup: () => ({ args }), template: '<div class="h-96"><IAMCreatePolicyModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { IAMCreatePolicyModal }, setup: () => ({ args }), template: '<div class="h-96"><IAMCreatePolicyModal v-bind="args" /></div>' })
};