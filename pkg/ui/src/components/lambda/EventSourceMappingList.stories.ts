import type { Meta, StoryObj } from '@storybook/vue3';
import EventSourceMappingList from './EventSourceMappingList.vue';

const meta: Meta<typeof EventSourceMappingList> = {
  title: 'Services/Lambda/EventSourceMappingList',
  component: EventSourceMappingList,
  tags: ['autodocs'],
  argTypes: {
    mappings: { control: 'object' },
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const sqsMapping = {
  UUID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:my-queue',
  FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:my-function',
  State: 'Enabled',
  StateTransitionReason: 'USER_INITIATED',
  BatchSize: 10,
  MaximumBatchingWindowInSeconds: 0,
};

const kinesisMapping = {
  UUID: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  EventSourceArn: 'arn:aws:kinesis:us-east-1:123456789012:stream/my-stream',
  FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:stream-processor',
  State: 'Enabled',
  StateTransitionReason: 'USER_INITIATED',
  BatchSize: 100,
  MaximumBatchingWindowInSeconds: 60,
  ParallelizationFactor: 2,
};

const dynamoDBMapping = {
  UUID: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
  EventSourceArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/my-table/stream/2024-01-01T00:00:00Z',
  FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:dynamo-processor',
  State: 'Enabled',
  StateTransitionReason: 'USER_INITIATED',
  BatchSize: 50,
  StartingPosition: 'TRIM_HORIZON',
};

const mskMapping = {
  UUID: 'd4e5f6a7-b8c9-0123-defg-456789012345',
  EventSourceArn: 'arn:aws:kafka:us-east-1:123456789012:cluster/my-cluster/topic/my-topic',
  FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:kafka-consumer',
  State: 'Enabled',
  StateTransitionReason: 'USER_INITIATED',
  BatchSize: 100,
  ParallelizationFactor: 4,
  DestinationConfig: {
    OnFailure: {
      Destination: 'arn:aws:sqs:us-east-1:123456789012:dlq'
    }
  },
};

const disabledMapping = {
  UUID: 'e5f6a7b8-c9d0-1234-efgh-567890123456',
  EventSourceArn: 'arn:aws:sqs:us-east-1:123456789012:another-queue',
  FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:disabled-function',
  State: 'Disabled',
  StateTransitionReason: 'USER_INITIATED',
  BatchSize: 10,
};

export const Default: Story = {
  args: {
    mappings: [sqsMapping, kinesisMapping]
  }
};

export const Loading: Story = {
  args: {
    mappings: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    mappings: [],
    loading: false
  }
};

export const SQS: Story = {
  args: {
    mappings: [sqsMapping]
  }
};

export const Kinesis: Story = {
  args: {
    mappings: [kinesisMapping]
  }
};

export const DynamoDB: Story = {
  args: {
    mappings: [dynamoDBMapping]
  }
};

export const MSK: Story = {
  args: {
    mappings: [mskMapping]
  }
};

export const WithDisabled: Story = {
  args: {
    mappings: [sqsMapping, disabledMapping]
  }
};

export const ManyMappings: Story = {
  args: {
    mappings: [sqsMapping, kinesisMapping, dynamoDBMapping, mskMapping, disabledMapping]
  }
};