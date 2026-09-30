import type { Meta, StoryObj } from '@storybook/vue3';
import CloudFrontDistributionList from './CloudFrontDistributionList.vue';

const meta: Meta<typeof CloudFrontDistributionList> = {
  title: 'Services/CloudFront/DistributionList',
  component: CloudFrontDistributionList,
  tags: ['autodocs'],
  argTypes: {
    distributions: { control: 'object' },
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

function createMockDistribution(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    Id: id,
    ARN: `arn:aws:cloudfront::000000000000:distribution/${id}`,
    Status: 'Deployed',
    Enabled: true,
    DomainName: `${id.toLowerCase()}.cloudfront.net`,
    Comment: `Distribution ${id}`,
    PriceClass: 'PriceClass_100',
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: `S3-my-bucket-${id}`,
          DomainName: `my-bucket-${id}.s3.amazonaws.com`,
          S3OriginConfig: { OriginAccessIdentity: '' },
        },
      ],
    },
    LastModifiedTime: '2024-01-15T10:30:00Z',
    ...overrides,
  };
}

const mockDistributions = [
  createMockDistribution('E1ABCDEF123456'),
  createMockDistribution('E2GHIJKL789012', {
    Enabled: false,
    Comment: 'Disabled distribution',
  }),
  createMockDistribution('E3MNOPQR345678', {
    PriceClass: 'PriceClass_200',
  }),
];

export const Default: Story = {
  args: {
    distributions: mockDistributions
  }
};

export const Loading: Story = {
  args: {
    distributions: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    distributions: [],
    loading: false
  }
};

export const SingleDistribution: Story = {
  args: {
    distributions: [mockDistributions[0]]
  }
};

export const DisabledDistribution: Story = {
  args: {
    distributions: [mockDistributions[1]]
  }
};
