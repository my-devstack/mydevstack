import type { Meta, StoryObj } from '@storybook/vue3';
import EC2CodeExamples from './EC2CodeExamples.vue';

const meta: Meta<typeof EC2CodeExamples> = {
  title: 'Services/EC2/CodeExamples',
  component: EC2CodeExamples,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockExamples = [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: 'aws ec2 describe-instances --endpoint-url http://127.0.0.1:4566',
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: 'const client = new EC2Client({ region: "us-east-1" });',
  },
];

export const Default: Story = {
  args: { examples: mockExamples },
  render: (args) => ({ components: { EC2CodeExamples }, setup: () => ({ args }), template: '<EC2CodeExamples v-bind="args" />' })
};
