import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoCreateResourceServerModal from './CognitoCreateResourceServerModal.vue';

const meta: Meta<typeof CognitoCreateResourceServerModal> = {
  title: 'Services/Cognito/CreateResourceServerModal',
  component: CognitoCreateResourceServerModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoCreateResourceServerModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateResourceServerModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoCreateResourceServerModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateResourceServerModal v-bind="args" /></div>' })
};