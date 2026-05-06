import type { Meta, StoryObj } from '@storybook/vue3-vite';
import S3ObjectsList from './S3ObjectsList.vue';

const meta: Meta<typeof S3ObjectsList> = {
  title: 'Services/S3/ObjectsList',
  component: S3ObjectsList,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { bucketName: 'my-bucket' }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockObjects = [
  { Key: 'folder/file1.txt', Size: 1024, LastModified: '2024-01-15T10:00:00Z' },
  { Key: 'folder/image.png', Size: 204800, LastModified: '2024-01-14T09:00:00Z' },
  { Key: 'data.json', Size: 512, LastModified: '2024-01-13T08:00:00Z' }
];

export const Default: Story = {
  args: { objects: mockObjects, bucketName: 'my-bucket', loading: false },
  render: (args) => ({ components: { S3ObjectsList }, setup: () => ({ args }), template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { objects: [], bucketName: 'my-bucket', loading: true },
  render: (args) => ({ components: { S3ObjectsList }, setup: () => ({ args }), template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { objects: [], bucketName: 'my-bucket', loading: false },
  render: (args) => ({ components: { S3ObjectsList }, setup: () => ({ args }), template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>' })
};

export const Uploading: Story = {
  args: { objects: mockObjects, bucketName: 'my-bucket', loading: false, uploading: true },
  render: (args) => ({ components: { S3ObjectsList }, setup: () => ({ args }), template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>' })
};