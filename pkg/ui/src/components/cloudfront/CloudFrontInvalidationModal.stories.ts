import type { Meta, StoryObj } from '@storybook/vue3';
import CloudFrontInvalidationModal from './CloudFrontInvalidationModal.vue';

const meta: Meta<typeof CloudFrontInvalidationModal> = {
  title: 'Services/CloudFront/InvalidationModal',
  component: CloudFrontInvalidationModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' }
  },
  args: {
    open: true,
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true
  }
};

export const Closed: Story = {
  args: {
    open: false
  }
};
