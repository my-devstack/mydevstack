import type { Meta, StoryObj } from '@storybook/vue3';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import LambdaCreateModal from './LambdaCreateModal.vue';

const meta: Meta<typeof LambdaCreateModal> = {
  title: 'Services/Lambda/CreateModal',
  component: LambdaCreateModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' }
  },
  args: {
    open: false,
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true
  },
  render: (args) => ({
    components: { LambdaCreateModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-96">
        <LambdaCreateModal v-bind="args" />
      </div>
    `
  })
};

export const Closed: Story = {
  args: {
    open: false
  },
  render: (args) => ({
    components: { LambdaCreateModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-96">
        <LambdaCreateModal v-bind="args" />
      </div>
    `
  })
};

export const Loading: Story = {
  args: {
    open: true,
    loading: true
  },
  render: (args) => ({
    components: { LambdaCreateModal },
    setup() {
      return { args };
    },
    template: `
      <div class="h-96">
        <LambdaCreateModal v-bind="args" />
      </div>
    `
  })
};

export const ReadOnlyDisabled: Story = {
  args: {
    open: true,
    loading: false
  },
  decorators: [
    (story) => ({
      components: { story },
      setup() {
        const localPinia = createPinia();
        setActivePinia(localPinia);
        const store = useSettingsStore();
        store.setReadOnly(true);
        return {};
      },
      template: '<div class="h-96"><story /></div>'
    })
  ],
  render: (args) => ({
    components: { LambdaCreateModal },
    setup() {
      return { args };
    },
    template: `
      <LambdaCreateModal v-bind="args" />
    `
  })
};