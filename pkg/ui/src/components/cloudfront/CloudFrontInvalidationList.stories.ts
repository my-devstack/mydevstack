import type { Meta, StoryObj } from '@storybook/vue3';
import CloudFrontInvalidationList from './CloudFrontInvalidationList.vue';

const meta: Meta<typeof CloudFrontInvalidationList> = {
  title: 'Services/CloudFront/InvalidationList',
  component: CloudFrontInvalidationList,
  tags: ['autodocs'],
  argTypes: {
    invalidations: { control: 'object' },
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockInvalidations = [
  {
    Id: 'INV123456',
    Status: 'Completed',
    CreateTime: '2024-01-15T10:30:00Z',
    InvalidationBatch: {
      Paths: { Quantity: 1, Items: ['/*'] },
      CallerReference: 'ref1',
    },
  },
  {
    Id: 'INV789012',
    Status: 'InProgress',
    CreateTime: '2024-01-16T14:45:00Z',
    InvalidationBatch: {
      Paths: { Quantity: 2, Items: ['/images/*', '/css/*'] },
      CallerReference: 'ref2',
    },
  },
];

export const Default: Story = {
  args: {
    invalidations: mockInvalidations
  }
};

export const Loading: Story = {
  args: {
    invalidations: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    invalidations: [],
    loading: false
  }
};

export const SingleInvalidation: Story = {
  args: {
    invalidations: [mockInvalidations[0]]
  }
};
