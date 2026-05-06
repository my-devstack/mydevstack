import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateSecretModal from './CreateSecretModal.vue';

const meta: Meta<typeof CreateSecretModal> = {
  title: 'Services/SecretsManager/CreateSecretModal',
  component: CreateSecretModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { CreateSecretModal }, setup: () => ({ args }), template: '<div class="h-64"><CreateSecretModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CreateSecretModal }, setup: () => ({ args }), template: '<div class="h-64"><CreateSecretModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { CreateSecretModal }, setup: () => ({ args }), template: '<div class="h-64"><CreateSecretModal v-bind="args" /></div>' })
};