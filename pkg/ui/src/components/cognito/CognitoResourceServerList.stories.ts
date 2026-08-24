import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoResourceServerList from './CognitoResourceServerList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof CognitoResourceServerList> = {
  title: 'Services/Cognito/ResourceServerList',
  component: CognitoResourceServerList,
  tags: ['autodocs'],
  argTypes: {
    resourceServers: { control: 'object' },
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
    resourceServers: [
      {
        Identifier: 'api.example.com',
        Name: 'API Server',
        Scopes: [{ ScopeName: 'read', ScopeDescription: 'Read access' }, { ScopeName: 'write', ScopeDescription: 'Write access' }],
        LastModifiedDate: '2024-01-15T10:30:00Z'
      },
      {
        Identifier: 'admin.example.com',
        Name: 'Admin Server',
        Scopes: [{ ScopeName: 'admin', ScopeDescription: 'Admin access' }],
        LastModifiedDate: '2024-02-20T14:45:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    resourceServers: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    resourceServers: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    resourceServers: [],
    loading: false,
    error: 'Failed to load resource servers: List resource servers failed'
  }
};