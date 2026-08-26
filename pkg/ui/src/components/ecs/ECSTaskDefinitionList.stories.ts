import type { Meta, StoryObj } from '@storybook/vue3';
import ECSTaskDefinitionList from './ECSTaskDefinitionList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof ECSTaskDefinitionList> = {
  title: 'Services/ECS/TaskDefinitionList',
  component: ECSTaskDefinitionList,
  tags: ['autodocs'],
  argTypes: {
    taskDefinitions: { control: 'object' },
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
    taskDefinitions: [
      {
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:000000000000:task-definition/my-task:1',
        Family: 'my-task',
        Revision: 1,
        Status: 'ACTIVE',
        Cpu: '256',
        Memory: '512',
        RegisteredAt: '2024-01-15T10:30:00Z',
        ContainerDefinitions: [
          { Name: 'web', Image: 'nginx:latest', Cpu: 256, Memory: 512, Essential: true }
        ]
      },
      {
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:000000000000:task-definition/api-task:2',
        Family: 'api-task',
        Revision: 2,
        Status: 'ACTIVE',
        Cpu: '512',
        Memory: '1024',
        RegisteredAt: '2024-03-10T09:00:00Z',
        ContainerDefinitions: [
          { Name: 'api', Image: 'myapp/api:latest', Cpu: 512, Memory: 1024, Essential: true }
        ]
      },
      {
        TaskDefinitionArn: 'arn:aws:ecs:us-east-1:000000000000:task-definition/legacy-task:1',
        Family: 'legacy-task',
        Revision: 1,
        Status: 'INACTIVE',
        Cpu: '128',
        Memory: '256',
        RegisteredAt: '2024-04-05T11:20:00Z',
        ContainerDefinitions: [
          { Name: 'legacy', Image: 'old/app:1.0', Cpu: 128, Memory: 256, Essential: true }
        ]
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    taskDefinitions: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    taskDefinitions: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    taskDefinitions: [],
    loading: false,
    error: 'Failed to load task definitions: List task definitions failed'
  }
};