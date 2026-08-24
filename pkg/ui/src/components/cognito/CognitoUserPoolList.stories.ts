import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoUserPoolList from './CognitoUserPoolList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof CognitoUserPoolList> = {
  title: 'Services/Cognito/UserPoolList',
  component: CognitoUserPoolList,
  tags: ['autodocs'],
  argTypes: {
    userPools: { control: 'object' },
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
    userPools: [
      {
        Id: 'us-east-1_abc123',
        Name: 'my-user-pool',
        Arn: 'arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_abc123',
        Status: 'Enabled',
        CreationDate: '2024-01-15T10:30:00Z',
        LastModifiedDate: '2024-02-20T14:45:00Z'
      },
      {
        Id: 'us-east-1_def456',
        Name: 'prod-user-pool',
        Arn: 'arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_def456',
        Status: 'Enabled',
        CreationDate: '2024-03-10T09:00:00Z',
        LastModifiedDate: '2024-03-10T09:00:00Z'
      },
      {
        Id: 'us-east-1_ghi789',
        Name: 'legacy-pool',
        Arn: 'arn:aws:cognito-idp:us-east-1:000000000000:userpool/us-east-1_ghi789',
        Status: 'Disabled',
        CreationDate: '2024-04-05T11:20:00Z',
        LastModifiedDate: '2024-05-01T08:00:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    userPools: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    userPools: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    userPools: [],
    loading: false,
    error: 'Failed to load user pools: List user pools failed'
  }
};