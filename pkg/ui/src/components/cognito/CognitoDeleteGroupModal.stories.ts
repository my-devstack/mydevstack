import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoDeleteGroupModal from './CognitoDeleteGroupModal.vue';

const meta: Meta<typeof CognitoDeleteGroupModal> = {
  title: 'Services/Cognito/DeleteGroupModal',
  component: CognitoDeleteGroupModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, groupName: 'developers' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Delete: Story = {
  args: { open: true },
  render: (args) => ({ components: { CognitoDeleteGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteGroupModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { CognitoDeleteGroupModal }, setup: () => ({ args }), template: '<div class="h-64"><CognitoDeleteGroupModal v-bind="args" /></div>' })
};