import type { Meta, StoryObj } from '@storybook/vue3';
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
  { Key: 'file1.txt', Size: 1024, LastModified: '2024-01-15T10:00:00Z' },
  { Key: 'image.png', Size: 204800, LastModified: '2024-01-14T09:00:00Z' },
  { Key: 'data.json', Size: 512, LastModified: '2024-01-13T08:00:00Z' }
];

const mockObjectsWithFolders = [
  { Key: 'file1.txt', Size: 1024, LastModified: '2024-01-15T10:00:00Z' },
  { Key: 'image.png', Size: 204800, LastModified: '2024-01-14T09:00:00Z' }
];

const mockNestedObjects = [
  { Key: 'b/c.txt', Size: 256, LastModified: '2024-01-15T10:00:00Z' },
  { Key: 'd.txt', Size: 128, LastModified: '2024-01-14T09:00:00Z' }
];

export const Default: Story = {
  args: {
    objects: mockObjects,
    prefixes: [],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: false
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>'
  })
};

export const WithFolders: Story = {
  args: {
    objects: mockObjectsWithFolders,
    prefixes: ['a/', 'empty/'],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: false
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" @delete-folder="(p) => console.log(\'delete folder:\', p)" /></div>'
  })
};

export const NestedLevel: Story = {
  args: {
    objects: mockNestedObjects,
    prefixes: ['a/b/'],
    currentPrefix: 'a/',
    bucketName: 'my-bucket',
    loading: false
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" @delete-folder="(p) => console.log(\'delete folder:\', p)" /></div>'
  })
};

export const Empty: Story = {
  args: {
    objects: [],
    prefixes: [],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: false
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>'
  })
};

export const Loading: Story = {
  args: {
    objects: [],
    prefixes: [],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: true
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>'
  })
};

export const Error: Story = {
  args: {
    objects: [],
    prefixes: [],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: false,
    error: 'Failed to load objects: Access Denied'
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>'
  })
};

export const Uploading: Story = {
  args: {
    objects: mockObjects,
    prefixes: [],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: false,
    uploading: true
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup: () => ({ args }),
    template: '<div class="h-96"><S3ObjectsList v-bind="args" /></div>'
  })
};

export const CopyLinkAction: Story = {
  args: {
    objects: mockObjects,
    prefixes: [],
    currentPrefix: '',
    bucketName: 'my-bucket',
    loading: false
  },
  render: (args) => ({
    components: { S3ObjectsList },
    setup() {
      const handleCopyLink = (key: string) => {
        console.log('Copy link for:', key)
      }
      return { args, handleCopyLink }
    },
    template: '<div class="h-96"><S3ObjectsList v-bind="args" @copy-link="handleCopyLink" /></div>'
  })
};
