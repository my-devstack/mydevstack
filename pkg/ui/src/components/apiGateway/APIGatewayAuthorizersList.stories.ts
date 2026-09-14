import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayAuthorizersList from './APIGatewayAuthorizersList.vue'

const meta: Meta<typeof APIGatewayAuthorizersList> = {
  component: APIGatewayAuthorizersList,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof APIGatewayAuthorizersList>

export const Default: Story = { args: { open: true, apiName: 'my-api', apiType: 'http' } }
export const Empty: Story = { args: { open: true, apiName: 'my-api', apiType: 'http' } }
export const Loading: Story = { args: { open: true, apiName: 'my-api', apiType: 'http' } }