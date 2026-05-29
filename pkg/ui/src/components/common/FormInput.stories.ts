import type { Meta, StoryObj } from '@storybook/vue3';
import FormInput from './FormInput.vue';

const meta: Meta<typeof FormInput> = {
  title: 'UI/FormInput',
  component: FormInput,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    label: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'date', 'time', 'datetime-local']
    },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helpText: { control: 'text' }
  },
  args: {
    modelValue: '',
    type: 'text'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const WithHelpText: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter email address',
    helpText: 'We will never share your email with anyone.'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    modelValue: 'wrongpass',
    error: 'Password must be at least 8 characters'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    required: true,
    placeholder: 'Enter your full name'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const Disabled: Story = {
  args: {
    label: 'API Key',
    modelValue: 'sk-xxxxxxxxxxxxx',
    disabled: true
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const Number: Story = {
  args: {
    label: 'Port',
    type: 'number',
    placeholder: '8080'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const Date: Story = {
  args: {
    label: 'Start Date',
    type: 'date'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const Password: Story = {
  args: {
    label: 'Secret Key',
    type: 'password',
    placeholder: 'Enter secret key'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};

export const NoLabel: Story = {
  args: {
    placeholder: 'Search...'
  },
  render: (args) => ({
    components: { FormInput },
    setup() {
      return { args };
    },
    template: '<FormInput v-bind="args" />'
  })
};