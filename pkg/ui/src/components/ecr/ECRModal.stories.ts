import type { Meta, StoryObj } from '@storybook/vue3';
import ECRModal from './ECRModal.vue';

const meta: Meta<typeof ECRModal> = {
  title: 'Services/ECR/Modal',
  component: ECRModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    mode: { control: 'select', options: ['create', 'view', 'delete'] },
    loading: { control: 'boolean' }
  },
  args: {
    open: true,
    loading: false
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockRepository = {
  RepositoryArn: 'arn:aws:ecr:us-east-1:000000000000:repository/my-app',
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  RepositoryUri: '000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app',
  CreatedAt: '2024-01-15T10:30:00Z',
  ImageTagMutability: 'MUTABLE',
  ImageScanningConfiguration: { ScanOnPush: true }
};

export const Create: Story = {
  args: {
    mode: 'create',
    repository: null
  }
};

export const CreateLoading: Story = {
  args: {
    mode: 'create',
    loading: true,
    repository: null
  }
};

export const View: Story = {
  args: {
    mode: 'view',
    repository: mockRepository
  }
};

export const Delete: Story = {
  args: {
    mode: 'delete',
    repository: mockRepository
  }
};

export const DeleteLoading: Story = {
  args: {
    mode: 'delete',
    loading: true,
    repository: mockRepository
  }
};

export const Closed: Story = {
  args: {
    open: false,
    mode: 'create',
    repository: null
  }
};