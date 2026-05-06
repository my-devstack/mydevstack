import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Tabs from './Tabs.vue';
import type { Tab } from './Tabs.vue';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    activeTab: { control: 'text' },
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'boxed']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right']
    },
    fullWidth: { control: 'boolean' }
  },
  args: {
    activeTab: 'tab1',
    variant: 'underline',
    size: 'md',
    align: 'left',
    fullWidth: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const tabs: Tab[] = [
  { id: 'tab1', label: 'Overview' },
  { id: 'tab2', label: 'Configuration' },
  { id: 'tab3', label: 'Monitoring' }
];

const tabsWithDisabled: Tab[] = [
  { id: 'tab1', label: 'Overview' },
  { id: 'tab2', label: 'Configuration' },
  { id: 'tab3', label: 'Disabled', disabled: true }
];

export const Default: Story = {
  args: {
    tabs
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1>
          <div class="p-4 bg-light-bg dark:bg-dark-bg rounded">Overview content here.</div>
        </template>
        <template #tab2>
          <div class="p-4 bg-light-bg dark:bg-dark-bg rounded">Configuration content here.</div>
        </template>
        <template #tab3>
          <div class="p-4 bg-light-bg dark:bg-dark-bg rounded">Monitoring content here.</div>
        </template>
      </Tabs>
    `
  })
};

export const Underline: Story = {
  args: {
    tabs,
    variant: 'underline'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Tab 1 content</div></template>
        <template #tab2><div class="p-4">Tab 2 content</div></template>
        <template #tab3><div class="p-4">Tab 3 content</div></template>
      </Tabs>
    `
  })
};

export const Pills: Story = {
  args: {
    tabs,
    variant: 'pills'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Tab 1 content</div></template>
        <template #tab2><div class="p-4">Tab 2 content</div></template>
        <template #tab3><div class="p-4">Tab 3 content</div></template>
      </Tabs>
    `
  })
};

export const Boxed: Story = {
  args: {
    tabs,
    variant: 'boxed'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Tab 1 content</div></template>
        <template #tab2><div class="p-4">Tab 2 content</div></template>
        <template #tab3><div class="p-4">Tab 3 content</div></template>
      </Tabs>
    `
  })
};

export const Small: Story = {
  args: {
    tabs,
    size: 'sm'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Small tabs</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Tab 3</div></template>
      </Tabs>
    `
  })
};

export const Large: Story = {
  args: {
    tabs,
    size: 'lg'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Large tabs</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Tab 3</div></template>
      </Tabs>
    `
  })
};

export const Centered: Story = {
  args: {
    tabs,
    align: 'center'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Centered tabs</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Tab 3</div></template>
      </Tabs>
    `
  })
};

export const RightAligned: Story = {
  args: {
    tabs,
    align: 'right'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Right aligned tabs</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Tab 3</div></template>
      </Tabs>
    `
  })
};

export const FullWidth: Story = {
  args: {
    tabs,
    fullWidth: true
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Full width tabs</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Tab 3</div></template>
      </Tabs>
    `
  })
};

export const WithDisabledTab: Story = {
  args: {
    tabs: tabsWithDisabled
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Tab 1</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Tab 3 (disabled)</div></template>
      </Tabs>
    `
  })
};

export const DifferentActiveTab: Story = {
  args: {
    tabs,
    activeTab: 'tab3'
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      return { args };
    },
    template: `
      <Tabs v-bind="args">
        <template #tab1><div class="p-4">Tab 1</div></template>
        <template #tab2><div class="p-4">Tab 2</div></template>
        <template #tab3><div class="p-4">Starting on tab 3</div></template>
      </Tabs>
    `
  })
};