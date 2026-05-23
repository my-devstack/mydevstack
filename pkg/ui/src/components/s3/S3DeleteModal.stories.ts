import type { Meta, StoryObj } from '@storybook/vue3';
import S3DeleteModal from './S3DeleteModal.vue';

const meta: Meta<typeof S3DeleteModal> = {
  title: 'Services/S3/DeleteModal',
  component: S3DeleteModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' }
  },
  args: {
    open: false,
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenBucket: Story = {
  args: {
    open: true,
    item: { type: 'bucket', name: 'my-bucket' }
  },
  render: (args) => ({
    components: { S3DeleteModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3DeleteModal v-bind="args" />
      </div>
    `
  })
};

export const OpenObject: Story = {
  args: {
    open: true,
    item: { type: 'object', name: 'folder/file.txt' }
  },
  render: (args) => ({
    components: { S3DeleteModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3DeleteModal v-bind="args" />
      </div>
    `
  })
};

export const Closed: Story = {
  args: {
    open: false,
    item: { type: 'bucket', name: 'test' }
  },
  render: (args) => ({
    components: { S3DeleteModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3DeleteModal v-bind="args" />
      </div>
    `
  })
};

export const Loading: Story = {
  args: {
    open: true,
    item: { type: 'bucket', name: 'my-bucket' },
    loading: true
  },
  render: (args) => ({
    components: { S3DeleteModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3DeleteModal v-bind="args" />
      </div>
    `
  })
};