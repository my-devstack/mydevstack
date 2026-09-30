import type { Meta, StoryObj } from '@storybook/vue3';
import CloudFrontDistributionModal from './CloudFrontDistributionModal.vue';

const meta: Meta<typeof CloudFrontDistributionModal> = {
  title: 'Services/CloudFront/DistributionModal',
  component: CloudFrontDistributionModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    mode: { control: 'select', options: ['create', 'edit', 'view', 'delete'] },
    loading: { control: 'boolean' }
  },
  args: {
    open: true,
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockDistribution = {
  Id: 'E1ABCDEF123456',
  ARN: 'arn:aws:cloudfront::000000000000:distribution/E1ABCDEF123456',
  Status: 'Deployed',
  Enabled: true,
  DomainName: 'e1abcdef123456.cloudfront.net',
  Comment: 'Test distribution',
  PriceClass: 'PriceClass_100',
  LastModifiedTime: '2024-01-15T10:30:00Z',
};

const mockFullDistribution = {
  Id: 'E1ABCDEF123456',
  ARN: 'arn:aws:cloudfront::000000000000:distribution/E1ABCDEF123456',
  Status: 'Deployed',
  DomainName: 'e1abcdef123456.cloudfront.net',
  DistributionConfig: {
    Comment: 'Test distribution',
    Enabled: true,
    DefaultRootObject: 'index.html',
    PriceClass: 'PriceClass_100',
    Origins: [
      {
        Id: 'S3-my-bucket',
        DomainName: 'my-bucket.s3.amazonaws.com',
        S3OriginConfig: { OriginAccessIdentity: '' },
      },
    ],
    DefaultCacheBehavior: {
      ViewerProtocolPolicy: 'redirect-to-https' as const,
    },
  },
};

const mockOACs = [
  {
    Id: 'OAC123',
    Name: 'my-oac',
    Description: 'Test OAC',
    OriginAccessControlOriginType: 's3',
    SigningBehavior: 'always',
    SigningProtocol: 'sigv4',
  },
];

export const Create: Story = {
  args: {
    mode: 'create',
    distribution: null,
    fullDistribution: null,
    originAccessControls: mockOACs,
  }
};

export const CreateLoading: Story = {
  args: {
    mode: 'create',
    loading: true,
    distribution: null,
    fullDistribution: null,
    originAccessControls: mockOACs,
  }
};

export const Edit: Story = {
  args: {
    mode: 'edit',
    distribution: mockDistribution,
    fullDistribution: mockFullDistribution,
    originAccessControls: mockOACs,
  }
};

export const View: Story = {
  args: {
    mode: 'view',
    distribution: mockDistribution,
    fullDistribution: null,
    originAccessControls: [],
  }
};

export const Delete: Story = {
  args: {
    mode: 'delete',
    distribution: mockDistribution,
    fullDistribution: null,
    originAccessControls: [],
  }
};

export const Closed: Story = {
  args: {
    open: false,
    mode: 'create',
    distribution: null,
    fullDistribution: null,
    originAccessControls: [],
  }
};
