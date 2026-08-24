import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoDeleteResourceServerModal from './CognitoDeleteResourceServerModal.vue';

const meta: Meta<typeof CognitoDeleteResourceServerModal> = {
  title: 'Services/Cognito/DeleteResourceServerModal',
  component: CognitoDeleteResourceServerModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    identifier: 'api.example.com',
    name: 'API Server'
  },
  render: (args) => ({ components: { CognitoDeleteResourceServerModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteResourceServerModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: {
    open: false,
    identifier: 'api.example.com',
    name: 'API Server'
  },
  render: (args) => ({ components: { CognitoDeleteResourceServerModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteResourceServerModal v-bind="args" /></div>' })
};