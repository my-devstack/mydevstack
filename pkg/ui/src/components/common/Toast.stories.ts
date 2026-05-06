import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Toast from './Toast.vue';
import type { ToastItem } from './Toast.vue';

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    toast: { control: 'object' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    toast: {
      id: '1',
      type: 'success',
      message: 'Operation completed successfully!',
      duration: 5000
    }
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};

export const Error: Story = {
  args: {
    toast: {
      id: '2',
      type: 'error',
      message: 'Failed to delete resource. Please try again.',
      duration: 5000
    }
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};

export const Warning: Story = {
  args: {
    toast: {
      id: '3',
      type: 'warning',
      message: 'Your session will expire in 5 minutes.',
      duration: 5000
    }
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};

export const Info: Story = {
  args: {
    toast: {
      id: '4',
      type: 'info',
      message: 'New version available. Refresh to update.',
      duration: 5000
    }
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};

export const LongMessage: Story = {
  args: {
    toast: {
      id: '5',
      type: 'info',
      message: 'This is a longer message that might wrap to multiple lines. It contains important information that the user should read.',
      duration: 8000
    }
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};

export const CustomDuration: Story = {
  args: {
    toast: {
      id: '6',
      type: 'success',
      message: 'This toast stays longer.',
      duration: 10000
    }
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};

export const NoToast: Story = {
  args: {
    toast: null
  },
  render: (args) => ({
    components: { Toast },
    setup() {
      return { args };
    },
    template: '<Toast v-bind="args" />'
  })
};