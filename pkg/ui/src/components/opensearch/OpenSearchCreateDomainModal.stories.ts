import type { Meta, StoryObj } from '@storybook/vue3-vite';
import OpenSearchCreateDomainModal from './OpenSearchCreateDomainModal.vue';

const meta: Meta<typeof OpenSearchCreateDomainModal> = {
  title: 'Services/OpenSearch/CreateDomainModal',
  component: OpenSearchCreateDomainModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { OpenSearchCreateDomainModal }, setup: () => ({ args }), template: '<div class="h-64"><OpenSearchCreateDomainModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { OpenSearchCreateDomainModal }, setup: () => ({ args }), template: '<div class="h-64"><OpenSearchCreateDomainModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { OpenSearchCreateDomainModal }, setup: () => ({ args }), template: '<div class="h-64"><OpenSearchCreateDomainModal v-bind="args" /></div>' })
};
