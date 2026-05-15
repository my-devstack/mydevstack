import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSKDeleteClusterModal from './MSKDeleteClusterModal.vue';

const meta: Meta<typeof MSKDeleteClusterModal> = {
  title: 'Services/MSK/DeleteClusterModal',
  component: MSKDeleteClusterModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, isLoading: { control: 'boolean' } },
  args: { open: false, isLoading: false, cluster: null }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCluster = {
  ClusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/my-cluster',
  ClusterName: 'my-cluster',
  State: 'ACTIVE',
};

export const Open: Story = {
  args: { open: true, cluster: mockCluster },
  render: (args) => ({
    components: { MSKDeleteClusterModal },
    setup: () => ({ args }),
    template: '<div class="h-64"><MSKDeleteClusterModal v-bind="args" /></div>'
  })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({
    components: { MSKDeleteClusterModal },
    setup: () => ({ args }),
    template: '<div class="h-64"><MSKDeleteClusterModal v-bind="args" /></div>'
  })
};

export const Loading: Story = {
  args: { open: true, isLoading: true, cluster: mockCluster },
  render: (args) => ({
    components: { MSKDeleteClusterModal },
    setup: () => ({ args }),
    template: '<div class="h-64"><MSKDeleteClusterModal v-bind="args" /></div>'
  })
};
