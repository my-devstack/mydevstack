import type { Meta, StoryObj } from '@storybook/vue3';
import Modal from './Modal.vue';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full']
    },
    closable: { control: 'boolean' },
    closeOnBackdrop: { control: 'boolean' },
    closeOnEsc: { control: 'boolean' },
    showHeader: { control: 'boolean' }
  },
  args: {
    open: true,
    size: 'md',
    closable: true,
    closeOnBackdrop: true,
    closeOnEsc: true,
    showHeader: true
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Modal Title',
    open: true,
    default: 'This is the modal content. You can put anything here.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
        </Modal>
      </div>
    `
  })
};

export const Small: Story = {
  args: {
    title: 'Small Modal',
    size: 'sm',
    open: true,
    default: 'A small modal for simple messages.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
        </Modal>
      </div>
    `
  })
};

export const Large: Story = {
  args: {
    title: 'Large Modal',
    size: 'lg',
    open: true,
    default: 'A large modal for displaying more content, tables, or complex forms.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
        </Modal>
      </div>
    `
  })
};

export const NoHeader: Story = {
  args: {
    showHeader: false,
    open: true,
    default: 'Modal without header. Useful for confirmation dialogs.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
        </Modal>
      </div>
    `
  })
};

export const WithFooter: Story = {
  args: {
    title: 'Modal with Footer',
    open: true,
    default: 'This modal has a footer with action buttons.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
          <template #footer>
            <button class="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700">Cancel</button>
            <button class="px-4 py-2 text-sm rounded-md bg-primary-500 text-white">Confirm</button>
          </template>
        </Modal>
      </div>
    `
  })
};

export const NotClosable: Story = {
  args: {
    title: 'Not Closable Modal',
    closable: false,
    open: true,
    default: 'This modal cannot be closed by clicking backdrop or pressing Escape.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
        </Modal>
      </div>
    `
  })
};

export const Closed: Story = {
  args: {
    title: 'Closed State',
    open: false,
    default: 'This modal is closed.'
  },
  render: (args) => ({
    components: { Modal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-64">
        <Modal v-bind="args">
          {{ args.default }}
        </Modal>
      </div>
    `
  })
};