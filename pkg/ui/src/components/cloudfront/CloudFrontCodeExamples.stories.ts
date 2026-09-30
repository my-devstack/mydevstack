import type { Meta, StoryObj } from '@storybook/vue3';
import CloudFrontCodeExamples from './CloudFrontCodeExamples.vue';

const meta: Meta<typeof CloudFrontCodeExamples> = {
  title: 'Services/CloudFront/CodeExamples',
  component: CloudFrontCodeExamples,
  tags: ['autodocs'],
  argTypes: {
    region: { control: 'text' },
    accessKey: { control: 'text' },
    secretKey: { control: 'text' },
    distributionId: { control: 'text' }
  },
  args: {
    region: 'us-east-1',
    accessKey: 'test',
    secretKey: 'test',
    distributionId: 'E1ABCDEF123456'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomDistribution: Story = {
  args: {
    distributionId: 'E2GHIJKL789012'
  }
};

export const DifferentRegion: Story = {
  args: {
    region: 'eu-west-1',
    distributionId: 'E3MNOPQR345678'
  }
};
