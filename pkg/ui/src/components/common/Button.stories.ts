import type { Meta, StoryObj } from '@storybook/vue3';
import Button from './Button.vue';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger', 'ghost']
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg']
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    click: { action: 'clicked' }
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    default: 'Primary Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    default: 'Secondary Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    default: 'Danger Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    default: 'Ghost Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    default: 'Loading...'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    default: 'Disabled'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Small: Story = {
  args: {
    size: 'sm',
    default: 'Small Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const Large: Story = {
  args: {
    size: 'lg',
    default: 'Large Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>'
  })
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    default: 'Full Width Button'
  },
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<div class="w-64"><Button v-bind="args">{{ args.default }}</Button></div>'
  })
};