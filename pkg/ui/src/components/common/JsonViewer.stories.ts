import type { Meta, StoryObj } from '@storybook/vue3';
import JsonViewer from './JsonViewer.vue';

const meta: Meta<typeof JsonViewer> = {
  title: 'UI/JsonViewer',
  component: JsonViewer,
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object' },
    expanded: { control: 'boolean' }
  },
  args: {
    expanded: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleObject: Story = {
  args: {
    data: {
      name: 'my-bucket',
      region: 'us-east-1',
      created: '2024-01-15T10:30:00Z'
    }
  }
};

export const NestedObject: Story = {
  args: {
    data: {
      user: {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        profile: {
          avatar: 'https://example.com/avatar.png',
          bio: 'Software Engineer'
        }
      },
      settings: {
        theme: 'dark',
        notifications: true
      }
    },
    expanded: true
  }
};

export const Array: Story = {
  args: {
    data: {
      buckets: [
        { name: 'bucket-1', size: '10GB' },
        { name: 'bucket-2', size: '25GB' },
        { name: 'bucket-3', size: '5GB' }
      ]
    }
  }
};

export const EmptyObject: Story = {
  args: {
    data: {}
  }
};

export const EmptyArray: Story = {
  args: {
    data: []
  }
};

export const WithNull: Story = {
  args: {
    data: {
      name: 'test',
      value: null,
      count: 0,
      active: false
    }
  },
  expanded: true
};

export const LargeObject: Story = {
  args: {
    data: {
      service: 'EC2',
      instance: {
        instanceId: 'i-1234567890abcdef0',
        instanceType: 't3.micro',
        state: { name: 'running', code: 16 },
        tags: [
          { key: 'Environment', value: 'Dev' },
          { key: 'Project', value: 'MyApp' },
          { key: 'Owner', value: 'team@example.com' }
        ],
        metadata: {
          cpu: { cores: 2, threads: 4 },
          memory: { total: '1GB', used: '512MB' },
          network: {
            interfaces: ['eth0'],
            ip: '10.0.1.100'
          }
        }
      },
      created: '2024-01-01T00:00:00Z'
    }
  },
  expanded: true
};

export const StringInput: Story = {
  args: {
    data: '{"key": "value", "nested": {"a": 1}}'
  }
};