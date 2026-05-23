import type { Meta, StoryObj } from '@storybook/vue3';
import DynamoDBTableStats from './DynamoDBTableStats.vue';

const meta: Meta<typeof DynamoDBTableStats> = {
  title: 'Services/DynamoDB/TableStats',
  component: DynamoDBTableStats,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    tableName: 'my-table',
    loading: false,
    details: {
      TableStatus: 'ACTIVE',
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'sort', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'sort', AttributeType: 'S' }
      ],
      ItemCount: 15000,
      TableSizeBytes: 10500000
    }
  }
};

export const Loading: Story = {
  args: {
    tableName: 'my-table',
    loading: true,
    details: null
  }
};

export const ProvisionedMode: Story = {
  args: {
    tableName: 'large-table',
    loading: false,
    details: {
      TableStatus: 'ACTIVE',
      BillingModeSummary: { BillingMode: 'PROVISIONED' },
      KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'pk', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 100, WriteCapacityUnits: 50 },
      ItemCount: 500000,
      TableSizeBytes: 250000000
    }
  }
};

export const EmptyTable: Story = {
  args: {
    tableName: 'empty-table',
    loading: false,
    details: {
      TableStatus: 'ACTIVE',
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      KeySchema: [],
      AttributeDefinitions: [],
      ItemCount: 0,
      TableSizeBytes: 0
    }
  }
};

export const WithStreams: Story = {
  args: {
    tableName: 'stream-table',
    loading: false,
    details: {
      TableStatus: 'ACTIVE',
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      ItemCount: 1000,
      TableSizeBytes: 500000,
      StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' }
    }
  }
};