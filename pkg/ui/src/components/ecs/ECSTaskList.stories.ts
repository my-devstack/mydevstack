import type { Meta, StoryObj } from '@storybook/vue3';
import ECSTaskList from './ECSTaskList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof ECSTaskList> = {
  title: 'Services/ECS/TaskList',
  component: ECSTaskList,
  tags: ['autodocs'],
  argTypes: {
    tasks: { control: 'object' },
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
    tasks: [
      {
        TaskArn: 'arn:aws:ecs:us-east-1:000000000000:task/my-cluster/abc123',
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:000000000000:task-definition/my-task:1',
        LastStatus: 'RUNNING',
        DesiredStatus: 'RUNNING',
        LaunchType: 'FARGATE',
        StartedBy: 'ecs-svc',
        CreatedAt: '2024-01-15T10:30:00Z',
        Containers: [
          { Name: 'web', Image: 'nginx:latest', LastStatus: 'RUNNING' }
        ]
      },
      {
        TaskArn: 'arn:aws:ecs:us-east-1:000000000000:task/my-cluster/def456',
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:000000000000:task-definition/api-task:2',
        LastStatus: 'PENDING',
        DesiredStatus: 'RUNNING',
        LaunchType: 'FARGATE',
        CreatedAt: '2024-03-10T09:00:00Z',
        Containers: [
          { Name: 'api', Image: 'myapp/api:latest', LastStatus: 'PENDING' }
        ]
      },
      {
        TaskArn: 'arn:aws:ecs:us-east-1:000000000000:task/my-cluster/ghi789',
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:000000000000:task-definition/legacy-task:1',
        LastStatus: 'STOPPED',
        DesiredStatus: 'STOPPED',
        LaunchType: 'EC2',
        StoppedReason: 'Task stopped by user',
        CreatedAt: '2024-04-05T11:20:00Z',
        Containers: [
          { Name: 'legacy', Image: 'old/app:1.0', LastStatus: 'STOPPED' }
        ]
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    tasks: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    tasks: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    tasks: [],
    loading: false,
    error: 'Failed to load tasks: List tasks failed'
  }
};