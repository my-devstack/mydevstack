import type { Meta, StoryObj } from '@storybook/vue3'
import S3DeleteModal from './S3DeleteModal.vue'

const meta: Meta<typeof S3DeleteModal> = {
  title: 'Services/S3/DeleteModal',
  component: S3DeleteModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    loading: { control: 'boolean' },
    objectCount: { control: 'number' }
  },
  args: {
    open: false,
    loading: false
  }
}

export default meta
type Story = StoryObj<typeof meta>

const renderTemplate = (args: any) => ({
  components: { S3DeleteModal },
  setup() {
    return { args }
  },
  template: `
    <div class="h-64">
      <S3DeleteModal v-bind="args" />
    </div>
  `
})

export const DeleteBucket: Story = {
  args: {
    open: true,
    item: { type: 'bucket', name: 'my-bucket' }
  },
  render: renderTemplate
}

export const DeleteObject: Story = {
  args: {
    open: true,
    item: { type: 'object', name: 'folder/file.txt' }
  },
  render: renderTemplate
}

export const DeleteFolder: Story = {
  args: {
    open: true,
    item: { type: 'folder', name: 'a/' },
    objectCount: 42
  },
  render: renderTemplate
}

export const Deleting: Story = {
  args: {
    open: true,
    item: { type: 'bucket', name: 'my-bucket' },
    loading: true
  },
  render: renderTemplate
}
