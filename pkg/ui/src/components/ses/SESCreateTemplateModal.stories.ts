import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SESCreateTemplateModal from './SESCreateTemplateModal.vue';

const meta: Meta<typeof SESCreateTemplateModal> = {
  title: 'Services/SES/CreateTemplateModal',
  component: SESCreateTemplateModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { SESCreateTemplateModal }, setup: () => ({ args }), template: '<div class="h-64"><SESCreateTemplateModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { SESCreateTemplateModal }, setup: () => ({ args }), template: '<div class="h-64"><SESCreateTemplateModal v-bind="args" /></div>' })
};
