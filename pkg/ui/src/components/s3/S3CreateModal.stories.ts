import type { Meta, StoryObj } from '@storybook/vue3-vite';
import S3CreateModal from './S3CreateModal.vue';

const meta: Meta<typeof S3CreateModal> = {
  title: 'Services/S3/CreateModal',
  component: S3CreateModal,
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

export const Open: Story = {
  args: {
    open: true
  },
  render: (args) => ({
    components: { S3CreateModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3CreateModal v-bind="args" />
      </div>
    `
  })
};

export const Closed: Story = {
  args: {
    open: false
  },
  render: (args) => ({
    components: { S3CreateModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3CreateModal v-bind="args" />
      </div>
    `
  })
};

export const Loading: Story = {
  args: {
    open: true,
    loading: true
  },
  render: (args) => ({
    components: { S3CreateModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <S3CreateModal v-bind="args" />
      </div>
    `
  })
};