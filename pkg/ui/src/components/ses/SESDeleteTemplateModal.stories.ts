import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SESDeleteTemplateModal from './SESDeleteTemplateModal.vue';

const meta: Meta<typeof SESDeleteTemplateModal> = {
  title: 'Services/SES/DeleteTemplateModal',
  component: SESDeleteTemplateModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false, templateName: 'MyTemplate' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { SESDeleteTemplateModal }, setup: () => ({ args }), template: '<div class="h-64"><SESDeleteTemplateModal v-bind="args" /></div>' })
};

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { SESDeleteTemplateModal }, setup: () => ({ args }), template: '<div class="h-64"><SESDeleteTemplateModal v-bind="args" /></div>' })
};
