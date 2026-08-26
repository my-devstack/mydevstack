import type { Meta, StoryObj } from '@storybook/vue3';
import ECRRepositoryList from './ECRRepositoryList.vue';

const meta: Meta<typeof ECRRepositoryList> = {
  title: 'Services/ECR/RepositoryList',
  component: ECRRepositoryList,
  tags: ['autodocs'],
  argTypes: {
    repositories: { control: 'object' },
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

function createMockRepository(name: string, overrides: {
  RepositoryUri?: string;
  CreatedAt?: string;
  ImageTagMutability?: string;
} = {}): Record<string, unknown> {
  return {
    RepositoryArn: `arn:aws:ecr:us-east-1:000000000000:repository/${name}`,
    RegistryId: '000000000000',
    RepositoryName: name,
    RepositoryUri: overrides.RepositoryUri ?? `000000000000.dkr.ecr.us-east-1.amazonaws.com/${name}`,
    CreatedAt: overrides.CreatedAt ?? '2024-01-15T10:30:00Z',
    ImageTagMutability: overrides.ImageTagMutability ?? 'MUTABLE'
  };
}

function generateMockRepositories(count: number): Record<string, unknown>[] {
  const mutabilities = ['MUTABLE', 'MUTABLE', 'MUTABLE', 'IMMUTABLE'];
  const items: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    items.push(createMockRepository(`my-app-${i}`, {
      CreatedAt: new Date(2024, 0, i).toISOString(),
      ImageTagMutability: mutabilities[(i - 1) % mutabilities.length]
    }));
  }
  return items;
}

const mockRepositories = [
  createMockRepository('my-app'),
  createMockRepository('nginx-web-app', {
    CreatedAt: '2024-02-20T14:45:00Z',
    ImageTagMutability: 'IMMUTABLE'
  }),
  createMockRepository('data-processor', {
    CreatedAt: '2024-03-10T09:00:00Z'
  })
];

export const Default: Story = {
  args: {
    repositories: mockRepositories
  }
};

export const Loading: Story = {
  args: {
    repositories: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    repositories: [],
    loading: false
  }
};

export const SingleRepository: Story = {
  args: {
    repositories: [mockRepositories[0]]
  }
};

export const ManyRepositories: Story = {
  args: {
    repositories: generateMockRepositories(12)
  }
};

export const Paginated: Story = {
  args: {
    repositories: generateMockRepositories(25)
  }
};