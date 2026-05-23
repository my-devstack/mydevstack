import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3';
import SESCreateIdentityModal from './SESCreateIdentityModal.vue';

const meta: Meta<typeof SESCreateIdentityModal> = {
  title: 'Services/SES/CreateIdentityModal',
  component: SESCreateIdentityModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { SESCreateIdentityModal }, setup: () => ({ args }), template: '<div class="h-64"><SESCreateIdentityModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { SESCreateIdentityModal }, setup: () => ({ args }), template: '<div class="h-64"><SESCreateIdentityModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true },
  render: (args) => ({ components: { SESCreateIdentityModal }, setup: () => ({ args }), template: '<div class="h-64"><SESCreateIdentityModal v-bind="args" /></div>' })
};

export const OpenWithTags: Story = {
  args: { open: true },
  render: (args) => ({
    components: { SESCreateIdentityModal },
    setup() {
      const form = ref({ name: 'test@example.com', type: 'EMAIL_ADDRESS', tags: [{ Key: 'env', Value: 'test' }, { Key: 'owner', Value: 'dev' }] })
      return { args, form }
    },
    template: '<div class="h-96"><SESCreateIdentityModal v-bind="args" v-model:form="form" /></div>'
  })
};
