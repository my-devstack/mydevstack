import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FormSelect from './FormSelect.vue';
import type { Option } from './FormSelect.vue';

const meta: Meta<typeof FormSelect> = {
  title: 'UI/FormSelect',
  component: FormSelect,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helpText: { control: 'text' }
  },
  args: {
    modelValue: '',
    options: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-west-1', label: 'EU (Ireland)' },
      { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
    ]
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const options: Option[] = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' }
];

export const Default: Story = {
  args: {
    label: 'Region',
    placeholder: 'Select a region',
    options
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const WithValue: Story = {
  args: {
    label: 'Region',
    modelValue: 'us-east-1',
    options
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormSelect v-bind="args" />'
  })
};

export const WithHelpText: Story = {
  args: {
    label: 'Instance Type',
    placeholder: 'Select instance type',
    helpText: 'Choose based on your workload requirements.',
    options: [
      { value: 't3.micro', label: 't3.micro' },
      { value: 't3.small', label: 't3.small' },
      { value: 't3.medium', label: 't3.medium' },
      { value: 't3.large', label: 't3.large' }
    ]
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormSelect v-bind="args" />'
  })
};

export const WithError: Story = {
  args: {
    label: 'Service',
    modelValue: '',
    error: 'Please select a service',
    options: [
      { value: 's3', label: 'S3' },
      { value: 'lambda', label: 'Lambda' },
      { value: 'ec2', label: 'EC2' }
    ]
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormSelect v-bind="args" />'
  })
};

export const Required: Story = {
  args: {
    label: 'Environment',
    required: true,
    options: [
      { value: 'dev', label: 'Development' },
      { value: 'staging', label: 'Staging' },
      { value: 'prod', label: 'Production' }
    ]
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormSelect v-bind="args" />'
  })
};

export const Disabled: Story = {
  args: {
    label: 'Region',
    modelValue: 'us-east-1',
    disabled: true,
    options
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormSelect v-bind="args" />'
  })
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Version',
    options: [
      { value: 'latest', label: 'Latest' },
      { value: 'v1', label: 'v1.0.0' },
      { value: 'v2', label: 'v2.0.0', disabled: true },
      { value: 'v3', label: 'v3.0.0' }
    ]
  },
  render: (args) => ({
    components: { FormSelect },
    setup() {
      return { args };
    },
    template: '<FormSelect v-bind="args" />'
  })
};