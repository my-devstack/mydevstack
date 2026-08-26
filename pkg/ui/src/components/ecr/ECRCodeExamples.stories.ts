import type { Meta, StoryObj } from '@storybook/vue3';
import ECRCodeExamples from './ECRCodeExamples.vue';

const meta: Meta<typeof ECRCodeExamples> = {
  title: 'Services/ECR/CodeExamples',
  component: ECRCodeExamples,
  tags: ['autodocs'],
  argTypes: {
    region: { control: 'text' },
    accessKey: { control: 'text' },
    secretKey: { control: 'text' },
    repositoryName: { control: 'text' }
  },
  args: {
    region: 'us-east-1',
    accessKey: 'test',
    secretKey: 'test',
    repositoryName: 'my-app'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomRepository: Story = {
  args: {
    repositoryName: 'project-a/nginx-web-app'
  }
};

export const DifferentRegion: Story = {
  args: {
    region: 'eu-west-1',
    repositoryName: 'data-processor'
  }
};