import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayAuthorizersModal from './APIGatewayAuthorizersModal.vue'

const meta: Meta<typeof APIGatewayAuthorizersModal> = {
  component: APIGatewayAuthorizersModal,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof APIGatewayAuthorizersModal>

export const Default: Story = { args: { open: true, mode: 'create', apiName: 'my-api', apiType: 'http' } }
export const EditMode: Story = { args: { open: true, mode: 'edit', apiName: 'my-api', apiType: 'http', authorizer: { name: 'my-auth', authorizerType: 'JWT', authorizerCredentials: 'arn:aws:...' } } }
export const ViewMode: Story = { args: { open: true, mode: 'view', apiName: 'my-api', apiType: 'http', authorizer: { name: 'my-auth', authorizerType: 'JWT' } } }
export const Loading: Story = { args: { open: true, mode: 'create', apiName: 'my-api', apiType: 'http' } }
export const Error: Story = { args: { open: true, mode: 'create', apiName: 'my-api', apiType: 'http' } }
export const RestApiToken: Story = { args: { open: true, mode: 'create', apiName: 'my-rest-api', apiType: 'rest' } }