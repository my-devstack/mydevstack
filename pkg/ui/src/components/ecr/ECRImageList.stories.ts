import type { Meta, StoryObj } from '@storybook/vue3';
import ECRImageList from './ECRImageList.vue';

const meta: Meta<typeof ECRImageList> = {
  title: 'Services/ECR/ImageList',
  component: ECRImageList,
  tags: ['autodocs'],
  argTypes: {
    images: { control: 'object' },
    repositoryName: { control: 'text' },
    loading: { control: 'boolean' }
  },
  args: {
    repositoryName: 'my-app',
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

function createMockImage(digest: string, overrides: {
  ImageTags?: string[];
  ImageSizeInBytes?: number;
  ImagePushedAt?: string;
} = {}): Record<string, unknown> {
  return {
    RegistryId: '000000000000',
    RepositoryName: 'my-app',
    ImageDigest: digest,
    ImageTags: overrides.ImageTags ?? ['latest'],
    ImageSizeInBytes: overrides.ImageSizeInBytes ?? 5242880,
    ImagePushedAt: overrides.ImagePushedAt ?? '2024-01-15T10:30:00Z',
    ImageManifestMediaType: 'application/vnd.oci.image.manifest.v1+json'
  };
}

function generateMockImages(count: number): Record<string, unknown>[] {
  const tags = ['latest', 'v1.0.0', 'v1.1.0', 'v2.0.0', 'dev', 'staging'];
  const items: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i++) {
    items.push(createMockImage(`sha256:${i.toString(16).padStart(64, '0')}`, {
      ImageTags: [tags[(i - 1) % tags.length]],
      ImageSizeInBytes: 1024 * 1024 * (i % 20 + 1),
      ImagePushedAt: new Date(2024, 0, i).toISOString()
    }));
  }
  return items;
}

const mockImages = [
  createMockImage('sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', {
    ImageTags: ['latest', 'v1.0.0'],
    ImageSizeInBytes: 5242880,
    ImagePushedAt: '2024-01-15T10:30:00Z'
  }),
  createMockImage('sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', {
    ImageTags: ['v1.1.0'],
    ImageSizeInBytes: 10485760,
    ImagePushedAt: '2024-02-20T14:45:00Z'
  }),
  createMockImage('sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', {
    ImageTags: [],
    ImageSizeInBytes: 2097152,
    ImagePushedAt: '2024-03-10T09:00:00Z'
  })
];

export const Default: Story = {
  args: {
    images: mockImages
  }
};

export const Loading: Story = {
  args: {
    images: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    images: [],
    loading: false
  }
};

export const SingleImage: Story = {
  args: {
    images: [mockImages[0]]
  }
};

export const UntaggedImages: Story = {
  args: {
    images: [
      createMockImage('sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', { ImageTags: [] }),
      createMockImage('sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', { ImageTags: [] })
    ]
  }
};

export const ManyImages: Story = {
  args: {
    images: generateMockImages(12)
  }
};

export const Paginated: Story = {
  args: {
    images: generateMockImages(25)
  }
};