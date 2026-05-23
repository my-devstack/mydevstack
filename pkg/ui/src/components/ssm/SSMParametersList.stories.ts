import type { Meta, StoryObj } from '@storybook/vue3';
import SSMParametersList from './SSMParametersList.vue';

const meta: Meta<typeof SSMParametersList> = {
  title: 'Services/SSM/ParametersList',
  component: SSMParametersList,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockParams = [
  { Name: '/app/database/host', Value: 'db.example.com', Type: 'String' },
  { Name: '/app/database/port', Value: '5432', Type: 'String' },
  { Name: '/app/api/secret', Value: '********', Type: 'SecureString' },
  { Name: '/app/feature-flag/debug', Value: 'true', Type: 'String' }
];

export const Default: Story = {
  args: { parameters: mockParams }
};

export const Loading: Story = {
  args: { parameters: [], loading: true }
};

export const Empty: Story = {
  args: { parameters: [], loading: false }
};

export const SecureStrings: Story = {
  args: {
    parameters: [
      { Name: '/prod/db/password', Value: '********', Type: 'SecureString' },
      { Name: '/prod/api/token', Value: '********', Type: 'SecureString' },
      { Name: '/prod/oauth/client-id', Value: '********', Type: 'SecureString' }
    ]
  }
};

export const ManyPages: Story = {
  args: {
    parameters: Array.from({ length: 25 }, (_, i) => ({
      Name: i % 2 === 0 ? `/app/param-${i + 1}` : `/config/setting-${i + 1}`,
      Value: `value-${i + 1}`,
      Type: i % 4 === 0 ? 'SecureString' : 'String',
    })),
    loading: false,
  }
};