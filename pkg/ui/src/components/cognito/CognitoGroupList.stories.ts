import type { Meta, StoryObj } from '@storybook/vue3';
import CognitoGroupList from './CognitoGroupList.vue';
import { createPinia, setActivePinia } from 'pinia';

const meta: Meta<typeof CognitoGroupList> = {
  title: 'Services/Cognito/GroupList',
  component: CognitoGroupList,
  tags: ['autodocs'],
  argTypes: {
    groups: { control: 'object' },
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
    groups: [
      {
        GroupName: 'admins',
        Description: 'Administrator group',
        Precedence: 1,
        RoleArn: 'arn:aws:iam::000000000000:role/cognito-admins',
        CreationDate: '2024-01-15T10:30:00Z',
        LastModifiedDate: '2024-02-20T14:45:00Z'
      },
      {
        GroupName: 'developers',
        Description: 'Developer group',
        Precedence: 2,
        CreationDate: '2024-03-10T09:00:00Z',
        LastModifiedDate: '2024-03-10T09:00:00Z'
      },
      {
        GroupName: 'viewers',
        Description: 'Read-only group',
        Precedence: 3,
        CreationDate: '2024-04-05T11:20:00Z',
        LastModifiedDate: '2024-05-01T08:00:00Z'
      }
    ],
    loading: false
  }
};

export const Loading: Story = {
  args: {
    groups: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    groups: [],
    loading: false
  }
};

export const Error: Story = {
  args: {
    groups: [],
    loading: false,
    error: 'Failed to load groups: List groups failed'
  }
};