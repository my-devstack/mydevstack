import type { Meta, StoryObj } from '@storybook/vue3';
import ECSServiceList from './ECSServiceList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof ECSServiceList> = {
  title: 'Services/ECS/ServiceList',
  component: ECSServiceList,
  tags: ['autodocs'],
  argTypes: {
    services: { control: 'object' },
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
    services: [
      {
        ServiceArn: 'arn:aws:ecs:us-east-1:000000000000:service/my-cluster/my-svc',
        ServiceName: 'my-svc',
        Status: 'ACTIVE',
        DesiredCount: 2,
        RunningCount: 2,
        PendingCount: 0,
        LaunchType: 'FARGATE',
        TaskDefinition: 'arn:aws:ecs:us-east-1:000000000000:task-definition/my-task:1',
        SchedulingStrategy: 'REPLICA',
        CreatedAt: '2024-01-15T10:30:00Z'
      },
      {
        ServiceArn: 'arn:aws:ecs:us-east-1:000000000000:service/my-cluster/api-svc',
        ServiceName: 'api-svc',
        Status: 'ACTIVE',
        DesiredCount: 3,
        RunningCount: 2,
        PendingCount: 1,
        LaunchType: 'FARGATE',
        TaskDefinition: 'arn:aws:ecs:us-east-1:000000000000:task-definition/api-task:2',
        SchedulingStrategy: 'REPLICA',
        CreatedAt: '2024-03-10T09:00:00Z'
      },
      {
        ServiceArn: 'arn:aws:ecs:us-east-1:000000000000:service/my-cluster/legacy-svc',
        ServiceName: 'legacy-svc',
        Status: 'INACTIVE',
        DesiredCount: 0,
        RunningCount: 0,
        PendingCount: 0,
        LaunchType: 'EC2',
        TaskDefinition: 'arn:aws:ecs:us-east-1:000000000000:task-definition/legacy-task:1',
        SchedulingStrategy: 'DAEMON',
        CreatedAt: '2024-04-05T11:20:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    services: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    services: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    services: [],
    loading: false,
    error: 'Failed to load services: List services failed'
  }
};