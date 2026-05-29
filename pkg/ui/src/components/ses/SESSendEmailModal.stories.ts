import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3';
import SESSendEmailModal from './SESSendEmailModal.vue';

const meta: Meta<typeof SESSendEmailModal> = {
  title: 'Services/SES/SendEmailModal',
  component: SESSendEmailModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { SESSendEmailModal }, setup: () => ({ args }), template: '<div class="h-64"><SESSendEmailModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { SESSendEmailModal }, setup: () => ({ args }), template: '<div class="h-64"><SESSendEmailModal v-bind="args" /></div>' })
};

export const DomainIdentity: Story = {
  args: { open: true, identityName: 'example.com', identityType: 'DOMAIN' },
  render: (args) => ({ components: { SESSendEmailModal }, setup: () => {
    const form = ref({ from: 'user@example.com', to: '', subject: '', body: '', htmlBody: '' })
    return { args, form }
  }, template: '<div class="h-96"><SESSendEmailModal v-bind="args" v-model:form="form" /></div>' })
};

export const OpenTemplateMode: Story = {
  args: { open: true, mode: 'template' },
  render: (args) => ({ components: { SESSendEmailModal }, setup: () => {
    const form = ref({ from: 'sender@example.com', to: 'user@example.com', subject: '', body: '', htmlBody: '' })
    return { args, form }
  }, template: '<div class="h-96"><SESSendEmailModal v-bind="args" v-model:form="form" /></div>' })
};

export const OpenTemplateModeWithList: Story = {
  args: { open: true, mode: 'template', templatesList: [{ TemplateName: 'welcome-email' }, { TemplateName: 'reset-password' }, { TemplateName: 'notification' }] },
  render: (args) => ({ components: { SESSendEmailModal }, setup: () => {
    const form = ref({ from: 'sender@example.com', to: 'user@example.com', subject: '', body: '', htmlBody: '' })
    return { args, form }
  }, template: '<div class="h-96"><SESSendEmailModal v-bind="args" v-model:form="form" /></div>' })
};

export const DomainTemplateMode: Story = {
  args: { open: true, mode: 'template', identityName: 'example.com', identityType: 'DOMAIN', templatesList: [{ TemplateName: 'welcome-email' }] },
  render: (args) => ({ components: { SESSendEmailModal }, setup: () => {
    const form = ref({ from: 'user@example.com', to: '', subject: '', body: '', htmlBody: '' })
    return { args, form }
  }, template: '<div class="h-96"><SESSendEmailModal v-bind="args" v-model:form="form" /></div>' })
};
