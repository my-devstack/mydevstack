import type { Meta, StoryObj } from '@storybook/vue3';
import ConfirmModal from './ConfirmModal.vue';

const meta: Meta<typeof ConfirmModal> = {
  title: 'UI/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    message: { control: 'text' },
    confirmText: { control: 'text' },
    cancelText: { control: 'text' },
    confirmVariant: {
      control: 'select',
      options: ['primary', 'danger', 'secondary']
    }
  },
  args: {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger'
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Delete Resource',
    message: 'Are you sure you want to delete this resource? This action cannot be undone.'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};

export const Open: Story = {
  args: {
    open: true,
    title: 'Continue',
    message: 'Do you want to continue?'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};

export const Closed: Story = {
  args: {
    open: false,
    title: 'Confirm',
    message: 'This modal is closed.'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};

export const Primary: Story = {
  args: {
    title: 'Save Changes',
    message: 'Do you want to save your changes?',
    confirmText: 'Save',
    cancelText: 'Discard',
    confirmVariant: 'primary'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};

export const Secondary: Story = {
  args: {
    title: 'Go Back',
    message: 'Are you sure you want to go back? Your unsaved changes will be lost.',
    confirmText: 'Go Back',
    cancelText: 'Stay',
    confirmVariant: 'secondary'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};

export const CustomLabels: Story = {
  args: {
    title: 'Terminate Instance',
    message: 'This will terminate the EC2 instance. All data will be lost.',
    confirmText: 'Terminate',
    cancelText: 'Keep Instance',
    confirmVariant: 'danger'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};

export const LongMessage: Story = {
  args: {
    title: 'Important Notice',
    message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
  },
  render: (args) => ({
    components: { ConfirmModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <ConfirmModal v-bind="args" />
      </div>
    `
  })
};