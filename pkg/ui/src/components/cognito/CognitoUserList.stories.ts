import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoUserList from './CognitoUserList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof CognitoUserList> = {
  title: 'Services/Cognito/UserList',
  component: CognitoUserList,
  tags: ['autodocs'],
  argTypes: {
    users: { control: 'object' },
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
    users: [
      {
        Username: 'alice',
        UserStatus: 'CONFIRMED',
        Enabled: true,
        UserAttributes: [
          { Name: 'email', Value: 'alice@example.com' },
          { Name: 'phone_number', Value: '+15551234567' }
        ],
        UserCreateDate: '2024-01-15T10:30:00Z',
        UserLastModifiedDate: '2024-02-20T14:45:00Z'
      },
      {
        Username: 'bob',
        UserStatus: 'FORCE_CHANGE_PASSWORD',
        Enabled: true,
        UserAttributes: [
          { Name: 'email', Value: 'bob@example.com' }
        ],
        UserCreateDate: '2024-03-10T09:00:00Z',
        UserLastModifiedDate: '2024-03-10T09:00:00Z'
      },
      {
        Username: 'carol',
        UserStatus: 'CONFIRMED',
        Enabled: false,
        UserAttributes: [
          { Name: 'email', Value: 'carol@example.com' }
        ],
        UserCreateDate: '2024-04-05T11:20:00Z',
        UserLastModifiedDate: '2024-05-01T08:00:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    users: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    users: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    users: [],
    loading: false,
    error: 'Failed to load users: List users failed'
  }
};