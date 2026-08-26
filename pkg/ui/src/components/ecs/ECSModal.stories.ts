import type { Meta, StoryObj } from '@storybook/vue3';
import ECSModal from './ECSModal.vue';

const meta: Meta<typeof ECSModal> = {
  title: 'Services/ECS/Modal',
  component: ECSModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    entity: {
      control: 'select',
      options: ['cluster', 'task-definition', 'task', 'service']
    },
    loading: { control: 'boolean' }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Cluster: Story = {
  args: {
    open: true,
    entity: 'cluster',
    loading: false
  }
};

export const TaskDefinition: Story = {
  args: {
    open: true,
    entity: 'task-definition',
    loading: false
  }
};

export const Task: Story = {
  args: {
    open: true,
    entity: 'task',
    loading: false
  }
};

export const Service: Story = {
  args: {
    open: true,
    entity: 'service',
    loading: false
  }
};

export const Loading: Story = {
  args: {
    open: true,
    entity: 'cluster',
    loading: true
  }
};