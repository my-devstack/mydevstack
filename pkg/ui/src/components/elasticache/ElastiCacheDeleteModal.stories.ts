import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ElastiCacheDeleteModal from './ElastiCacheDeleteModal.vue';

const meta: Meta<typeof ElastiCacheDeleteModal> = {
  title: 'Services/ElastiCache/DeleteModal',
  component: ElastiCacheDeleteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockGroup = { ReplicationGroupId: 'my-cluster' };

export const Open: Story = {
  args: { open: true, group: mockGroup },
  render: (args) => ({ components: { ElastiCacheDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><ElastiCacheDeleteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, group: mockGroup },
  render: (args) => ({ components: { ElastiCacheDeleteModal }, setup: () => ({ args }), template: '<div class="h-64"><ElastiCacheDeleteModal v-bind="args" /></div>' })
};