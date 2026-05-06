import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LoadingSpinner from './LoadingSpinner.vue';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl']
    },
    color: { control: 'text' },
    fullScreen: { control: 'boolean' },
    label: { control: 'text' }
  },
  args: {
    size: 'md',
    fullScreen: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Loading...'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Loading...'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Loading...'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    label: 'Loading...'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};

export const WithLabel: Story = {
  args: {
    size: 'md',
    label: 'Processing request...'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};

export const CustomColor: Story = {
  args: {
    size: 'lg',
    color: 'text-red-500',
    label: 'Error loading...'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};

export const NoLabel: Story = {
  args: {
    size: 'md'
  },
  render: (args) => ({
    components: { LoadingSpinner },
    setup() {
      return { args };
    },
    template: '<LoadingSpinner v-bind="args" />'
  })
};