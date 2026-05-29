import type { Meta, StoryObj } from '@storybook/vue3';
import OpenSearchDeleteModal from './OpenSearchDeleteModal.vue';

const meta: Meta<typeof OpenSearchDeleteModal> = {
  title: 'Services/OpenSearch/DeleteModal',
  component: OpenSearchDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDomain = { DomainName: 'my-domain' };

export const Open: Story = {
  args: { open: true, domain: mockDomain },
  render: (args) => ({ components: { OpenSearchDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><OpenSearchDeleteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, domain: mockDomain },
  render: (args) => ({ components: { OpenSearchDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><OpenSearchDeleteModal v-bind="args" /></div>' })
};
