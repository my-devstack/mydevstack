import type { Meta, StoryObj } from '@storybook/vue3-vite';
import KinesisStreamsList from './KinesisStreamsList.vue';

const meta: Meta<typeof KinesisStreamsList> = {
  title: 'Services/Kinesis/StreamsList',
  component: KinesisStreamsList,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStreams = [
  { StreamName: 'user-events', StreamARN: 'arn:aws:kinesis:us-east-1:123456789:stream/user-events', StreamStatus: 'ACTIVE', Shards: 4 },
  { StreamName: 'logs', StreamARN: 'arn:aws:kinesis:us-east-1:123456789:stream/logs', StreamStatus: 'ACTIVE', Shards: 2 },
  { StreamName: 'analytics', StreamARN: 'arn:aws:kinesis:us-east-1:123456789:stream/analytics', StreamStatus: 'CREATING', Shards: 8 }
];

export const Default: Story = {
  args: { streams: mockStreams }
};

export const Loading: Story = {
  args: { streams: [], loading: true }
};

export const Empty: Story = {
  args: { streams: [], loading: false }
};

export const SingleStream: Story = {
  args: { streams: [mockStreams[0]] }
};

export const Creating: Story = {
  args: {
    streams: [
      { StreamName: 'new-stream', StreamARN: 'arn:aws:kinesis:us-east-1:123456789:stream/new-stream', StreamStatus: 'CREATING', Shards: 1 }
    ]
  }
};

export const Deleting: Story = {
  args: {
    streams: [
      { StreamName: 'old-stream', StreamARN: 'arn:aws:kinesis:us-east-1:123456789:stream/old-stream', StreamStatus: 'DELETING', Shards: 0 }
    ]
  }
};

export const ManyShards: Story = {
  args: {
    streams: [
      { StreamName: 'high-throughput', StreamARN: 'arn:aws:kinesis:us-east-1:123456789:stream/high-throughput', StreamStatus: 'ACTIVE', Shards: 24 }
    ]
  }
};

export const ManyPages: Story = {
  args: {
    streams: Array.from({ length: 25 }, (_, i) => ({
      StreamName: `stream-${i + 1}`,
      StreamARN: `arn:aws:kinesis:us-east-1:123456789:stream/stream-${i + 1}`,
      StreamStatus: i % 3 === 0 ? 'CREATING' : 'ACTIVE',
      Shards: Math.floor(Math.random() * 10) + 1,
    }))
  }
};