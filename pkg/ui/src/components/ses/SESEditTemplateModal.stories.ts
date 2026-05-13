import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SESEditTemplateModal from './SESEditTemplateModal.vue';

const meta: Meta<typeof SESEditTemplateModal> = {
  title: 'Services/SES/EditTemplateModal',
  component: SESEditTemplateModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTemplate = {
  TemplateName: 'my-template',
  TemplateContent: {
    Subject: 'Hello {{name}}',
    Html: '<h1>Hello {{name}}</h1>',
    Text: 'Hello {{name}}',
  },
}

export const Open: Story = {
  args: {
    open: true,
    template: sampleTemplate,
  },
  render: (args) => ({
    components: { SESEditTemplateModal },
    setup: () => ({ args }),
    template: '<div class="h-64"><SESEditTemplateModal v-bind="args" /></div>',
  }),
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({
    components: { SESEditTemplateModal },
    setup: () => ({ args }),
    template: '<div class="h-64"><SESEditTemplateModal v-bind="args" /></div>',
  }),
};

export const OpenWithoutTemplate: Story = {
  args: { open: true },
  render: (args) => ({
    components: { SESEditTemplateModal },
    setup: () => ({ args }),
    template: '<div class="h-64"><SESEditTemplateModal v-bind="args" /></div>',
  }),
};
