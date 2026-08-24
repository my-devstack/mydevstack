import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoUserPoolClientList from './CognitoUserPoolClientList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof CognitoUserPoolClientList> = {
  title: 'Services/Cognito/UserPoolClientList',
  component: CognitoUserPoolClientList,
  tags: ['autodocs'],
  argTypes: {
    clients: { control: 'object' },
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
    clients: [
      {
        ClientId: '1abc2def3ghi4jkl5mno6pqr7',
        ClientName: 'web-app',
        RefreshTokenValidity: 30,
        AccessTokenValidity: 60,
        IdTokenValidity: 60,
        CreationDate: '2024-01-15T10:30:00Z'
      },
      {
        ClientId: '8stu9vwx0yza1bcd2efg3hij4',
        ClientName: 'mobile-app',
        RefreshTokenValidity: 7,
        AccessTokenValidity: 30,
        IdTokenValidity: 30,
        CreationDate: '2024-02-20T14:45:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    clients: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    clients: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    clients: [],
    loading: false,
    error: 'Failed to load user pool clients: List user pool clients failed'
  }
};