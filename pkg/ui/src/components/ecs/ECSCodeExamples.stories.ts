import type { Meta, StoryObj } from '@storybook/vue3';
import ECSCodeExamples from './ECSCodeExamples.vue';

const meta: Meta<typeof ECSCodeExamples> = {
  title: 'Services/ECS/CodeExamples',
  component: ECSCodeExamples,
  tags: ['autodocs'],
  argTypes: {
    region: { control: 'text' },
    accessKey: { control: 'text' },
    secretKey: { control: 'text' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    region: 'us-east-1',
    accessKey: 'test',
    secretKey: 'test'
  }
};