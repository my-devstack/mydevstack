import type { Meta, StoryObj } from '@storybook/vue3';
import ECSClusterList from './ECSClusterList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof ECSClusterList> = {
  title: 'Services/ECS/ClusterList',
  component: ECSClusterList,
  tags: ['autodocs'],
  argTypes: {
    clusters: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'text' }
  },
  decorators: [
    () => {
      const pinia = createPinia();
      setActivePinia(pinia);
      return {
        setup() {
          return {
            provide: {
              settingsStore: {
                darkMode: false
              }
            }
          };
        },
        template: '<div><story /></div>'
      };
    }
  ]
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    clusters: [
      {
        ClusterArn: 'arn:aws:ecs:us-east-1:000000000000:cluster/my-cluster',
        ClusterName: 'my-cluster',
        Status: 'ACTIVE',
        RunningTasksCount: 2,
        PendingTasksCount: 0,
        ActiveServicesCount: 1,
        CreatedAt: '2024-01-15T10:30:00Z'
      },
      {
        ClusterArn: 'arn:aws:ecs:us-east-1:000000000000:cluster/prod-cluster',
        ClusterName: 'prod-cluster',
        Status: 'ACTIVE',
        RunningTasksCount: 5,
        PendingTasksCount: 1,
        ActiveServicesCount: 3,
        CreatedAt: '2024-03-10T09:00:00Z'
      },
      {
        ClusterArn: 'arn:aws:ecs:us-east-1:000000000000:cluster/legacy-cluster',
        ClusterName: 'legacy-cluster',
        Status: 'INACTIVE',
        RunningTasksCount: 0,
        PendingTasksCount: 0,
        ActiveServicesCount: 0,
        CreatedAt: '2024-04-05T11:20:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    clusters: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    clusters: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    clusters: [],
    loading: false,
    error: 'Failed to load clusters: List clusters failed'
  }
};