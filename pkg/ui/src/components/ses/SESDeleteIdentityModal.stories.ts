import type { Meta, StoryObj } from '@storybook/vue3';
import SESDeleteIdentityModal from './SESDeleteIdentityModal.vue';

const meta: Meta<typeof SESDeleteIdentityModal> = {
  title: 'Services/SES/DeleteIdentityModal',
  component: SESDeleteIdentityModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, identity: { control: 'text' } },
  args: { open: false, identity: 'test@example.com' }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, identity: 'test@example.com' },
  render: (args) => ({ components: { SESDeleteIdentityModal }, setup: () => ({ args }), template: '<div class="h-64"><SESDeleteIdentityModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, identity: 'test@example.com' },
  render: (args) => ({ components: { SESDeleteIdentityModal }, setup: () => ({ args }), template: '<div class="h-64"><SESDeleteIdentityModal v-bind="args" /></div>' })
};
