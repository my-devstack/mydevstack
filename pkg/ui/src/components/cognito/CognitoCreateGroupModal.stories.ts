import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoCreateGroupModal from './CognitoCreateGroupModal.vue';

const meta: Meta<typeof CognitoCreateGroupModal> = {
  title: 'Services/Cognito/CreateGroupModal',
  component: CognitoCreateGroupModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoCreateGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoCreateGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoCreateGroupModal v-bind="args" /></div>' })
};