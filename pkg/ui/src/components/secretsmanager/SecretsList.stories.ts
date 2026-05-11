import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SecretsList from './SecretsList.vue';

const meta: Meta<typeof SecretsList> = {
  title: 'Services/SecretsManager/SecretsList',
  component: SecretsList,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSecrets = [
  { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:db-credentials', Name: 'db-credentials', Description: 'Database credentials' },
  { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:api-key', Name: 'api-key', Description: 'External API key' },
  { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:jwt-secret', Name: 'jwt-secret', Description: 'JWT signing secret' }
];

export const Default: Story = {
  args: { secrets: mockSecrets }
};

export const Loading: Story = {
  args: { secrets: [], loading: true }
};

export const Empty: Story = {
  args: { secrets: [], loading: false }
};

export const SingleSecret: Story = {
  args: { secrets: [mockSecrets[0]] }
};

export const ManySecrets: Story = {
  args: {
    secrets: [
      ...mockSecrets,
      { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:oauth', Name: 'oauth', Description: 'OAuth credentials' },
      { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:smtp', Name: 'smtp', Description: 'SMTP credentials' },
      { ARN: 'arn:aws:secretsmanager:us-east-1:123456789:secret:redis', Name: 'redis', Description: 'Redis auth' }
    ]
  }
};

export const ManyPages: Story = {
  args: {
    secrets: Array.from({ length: 25 }, (_, i) => ({
      Name: i % 2 === 0 ? `secret-${i + 1}` : `app-${i}-key`,
      Description: `Description for secret ${i + 1}`,
    })),
    loading: false,
  }
};