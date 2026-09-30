import type { Meta, StoryObj } from '@storybook/vue3';
import CloudFrontOriginAccessControlList from './CloudFrontOriginAccessControlList.vue';

const meta: Meta<typeof CloudFrontOriginAccessControlList> = {
  title: 'Services/CloudFront/OriginAccessControlList',
  component: CloudFrontOriginAccessControlList,
  tags: ['autodocs'],
  argTypes: {
    originAccessControls: { control: 'object' },
    loading: { control: 'boolean' }
  },
  args: {
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockOACs = [
  {
    Id: 'OAC123',
    Name: 'my-oac',
    Description: 'Test OAC',
    OriginAccessControlOriginType: 's3',
    SigningBehavior: 'always',
    SigningProtocol: 'sigv4',
  },
  {
    Id: 'OAC456',
    Name: 'another-oac',
    Description: 'Another OAC',
    OriginAccessControlOriginType: 's3',
    SigningBehavior: 'always',
    SigningProtocol: 'sigv4',
  },
];

export const Default: Story = {
  args: {
    originAccessControls: mockOACs
  }
};

export const Loading: Story = {
  args: {
    originAccessControls: [],
    loading: true
  }
};

export const Empty: Story = {
  args: {
    originAccessControls: [],
    loading: false
  }
};

export const SingleOAC: Story = {
  args: {
    originAccessControls: [mockOACs[0]]
  }
};
