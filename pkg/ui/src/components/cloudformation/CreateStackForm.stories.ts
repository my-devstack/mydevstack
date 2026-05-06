import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateStackForm from './CreateStackForm.vue';

const meta: Meta<typeof CreateStackForm> = {
  title: 'Services/CloudFormation/CreateStackForm',
  component: CreateStackForm,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => ({ components: { CreateStackForm }, setup: () => ({ args }), template: '<div class="h-64"><CreateStackForm v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({ components: { CreateStackForm }, setup: () => ({ args }), template: '<div class="h-64"><CreateStackForm v-bind="args" /></div>' })
};