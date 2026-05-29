import type { Meta, StoryObj } from '@storybook/vue3';
import EmptyState from './EmptyState.vue';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
    compact: { control: 'boolean' }
  },
  args: {
    compact: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No Data',
    description: 'There is nothing to display here yet.'
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};

export const WithIcon: Story = {
  args: {
    icon: 'folder',
    title: 'No Files',
    description: 'Upload files to get started.'
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};

export const WithActionButton: Story = {
  args: {
    icon: 'inbox',
    title: 'No Items',
    description: 'Start by creating your first item.',
    actionLabel: 'Create Item'
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};

export const Compact: Story = {
  args: {
    icon: 'table-cells',
    title: 'No Results',
    description: 'Try adjusting your filters.',
    compact: true
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};

export const Users: Story = {
  args: {
    icon: 'users',
    title: 'No Users',
    description: 'Add users to collaborate with your team.'
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};

export const Server: Story = {
  args: {
    icon: 'server',
    title: 'No Servers',
    description: 'Provision a server to get started.'
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};

export const Refresh: Story = {
  args: {
    icon: 'refresh',
    title: 'No Data Available',
    description: 'Click refresh to load data.'
  },
  render: (args) => ({
    components: { EmptyState },
    setup() {
      return { args };
    },
    template: '<EmptyState v-bind="args" />'
  })
};