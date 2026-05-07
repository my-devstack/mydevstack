import type { Meta, StoryObj } from '@storybook/vue3-vite'
import S3BucketDetails from './S3BucketDetails.vue'

const meta: Meta<typeof S3BucketDetails> = {
  title: 'Services/S3/BucketDetails',
  component: S3BucketDetails,
  tags: ['autodocs'],
  argTypes: {
    bucketName: { control: 'text' },
    details: { control: 'object' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    bucketName: 'my-bucket',
    details: {
      versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
      encryption: { algorithm: 'AES256', keyId: '' },
      tags: [
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Project', Value: 'MyApp' }
      ],
      loading: false
    }
  }
}

export const Loading: Story = {
  args: {
    bucketName: 'my-bucket',
    details: {
      versioning: null,
      encryption: null,
      tags: [],
      loading: true
    }
  }
}

export const EmptyTags: Story = {
  args: {
    bucketName: 'my-bucket',
    details: {
      versioning: { status: 'Enabled', mfaDelete: 'Disabled' },
      encryption: { algorithm: 'aws:kms', keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012' },
      tags: [],
      loading: false
    }
  }
}

export const WithMultipleTags: Story = {
  args: {
    bucketName: 'my-bucket',
    details: {
      versioning: { status: 'Enabled', mfaDelete: 'Enabled' },
      encryption: { algorithm: 'aws:kms', keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012' },
      tags: [
        { Key: 'Environment', Value: 'Development' },
        { Key: 'Team', Value: 'Platform' },
        { Key: 'CostCenter', Value: 'Engineering' },
        { Key: 'Compliance', Value: 'SOC2' },
        { Key: 'Backup', Value: 'Required' }
      ],
      loading: false
    }
  }
}

export const VersioningSuspended: Story = {
  args: {
    bucketName: 'my-bucket',
    details: {
      versioning: { status: 'Suspended', mfaDelete: 'Disabled' },
      encryption: { algorithm: 'None', keyId: '' },
      tags: [
        { Key: 'Environment', Value: 'Dev' }
      ],
      loading: false
    }
  }
}

export const NoDetails: Story = {
  args: {
    bucketName: 'my-bucket',
    details: null
  }
}