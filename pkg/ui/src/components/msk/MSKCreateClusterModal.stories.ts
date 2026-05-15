import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MSKCreateClusterModal from './MSKCreateClusterModal.vue';

const defaultForm = {
  name: '',
  kafkaVersion: '3.6.0',
  brokerCount: 2,
  instanceType: 'kafka.m5.large',
  storagePerBroker: 100,
  clientSubnets: 'subnet-123456',
};

const meta: Meta<typeof MSKCreateClusterModal> = {
  title: 'Services/MSK/CreateClusterModal',
  component: MSKCreateClusterModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, isLoading: { control: 'boolean' } },
  args: { open: false, isLoading: false, newCluster: defaultForm }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({
    components: { MSKCreateClusterModal },
    setup: () => ({ args }),
    template: '<div class="h-96"><MSKCreateClusterModal v-bind="args" /></div>'
  })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({
    components: { MSKCreateClusterModal },
    setup: () => ({ args }),
    template: '<div class="h-96"><MSKCreateClusterModal v-bind="args" /></div>'
  })
};

export const Loading: Story = {
  args: { open: true, isLoading: true },
  render: (args) => ({
    components: { MSKCreateClusterModal },
    setup: () => ({ args }),
    template: '<div class="h-96"><MSKCreateClusterModal v-bind="args" /></div>'
  })
};
