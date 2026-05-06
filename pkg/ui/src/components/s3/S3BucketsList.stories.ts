import type { Meta, StoryObj } from '@storybook/vue3-vite';
import S3BucketsList from './S3BucketsList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof S3BucketsList> = {
  title: 'Services/S3/BucketsList',
  component: S3BucketsList,
  tags: ['autodocs'],
  argTypes: {
    buckets: { control: 'object' },
    loading: { control: 'boolean' }
  },
  decorators: [
    () => {
      // Setup Pinia with mock store
      const pinia = createPinia();
      setActivePinia(pinia);
      return {
        setup() {
          // Mock settings store - just provide minimal darkMode
          return {
            provide: {
              settingsStore: {
                darkMode: false
              }
            }
          };
        },
        template: '<div><story /></div>'
      };
    }
  ]
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    buckets: [
      { Name: 'bucket-1', CreationDate: '2024-01-15T10:30:00Z' },
      { Name: 'bucket-2', CreationDate: '2024-02-20T14:45:00Z' },
      { Name: 'bucket-3', CreationDate: '2024-03-10T09:00:00Z' }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    buckets: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    buckets: [],
    loading: false
  }
};

export const SingleBucket: Story = {
  args: {
    buckets: [
      { Name: 'my-single-bucket', CreationDate: '2024-01-01T00:00:00Z' }
    ],
    loading: false
  }
};

export const ManyBuckets: Story = {
  args: {
    buckets: [
      { Name: 'bucket-a', CreationDate: '2024-01-01T00:00:00Z' },
      { Name: 'bucket-b', CreationDate: '2024-01-02T00:00:00Z' },
      { Name: 'bucket-c', CreationDate: '2024-01-03T00:00:00Z' },
      { Name: 'bucket-d', CreationDate: '2024-01-04T00:00:00Z' },
      { Name: 'bucket-e', CreationDate: '2024-01-05T00:00:00Z' },
      { Name: 'bucket-f', CreationDate: '2024-01-06T00:00:00Z' },
      { Name: 'bucket-g', CreationDate: '2024-01-07T00:00:00Z' },
      { Name: 'bucket-h', CreationDate: '2024-01-08T00:00:00Z' }
    ],
    loading: false
  }
};