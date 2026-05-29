import type { Meta, StoryObj } from '@storybook/vue3'
import APIGatewayHttpApisList from './APIGatewayHttpApisList.vue'

const meta: Meta<typeof APIGatewayHttpApisList> = {
  title: 'Services/API Gateway/HttpApisList',
  component: APIGatewayHttpApisList,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayHttpApisList>

const mockApis = [
  { apiId: 'http1', name: 'my-http-api', protocol: 'HTTP', description: 'My HTTP API' },
  { apiId: 'http2', name: 'users-http-api', protocol: 'HTTP', description: 'Users HTTP API' },
]

const mockStages: Record<string, any[]> = {
  http1: [
    { stageName: 'prod', status: 'ACTIVE' },
    { stageName: 'dev', status: 'ACTIVE' },
  ],
  http2: [
    { stageName: 'prod', status: 'ACTIVE' },
  ],
}

const mockRoutes: Record<string, any[]> = {
  http1: [
    { routeId: 'route1', routeKey: 'GET /items', target: 'integration:int1' },
    { routeId: 'route2', routeKey: 'POST /items', target: 'integration:int1' },
  ],
  http2: [
    { routeId: 'route3', routeKey: 'GET /users', target: 'integration:int2' },
  ],
}

const mockIntegrations: Record<string, any[]> = {
  http1: [
    { integrationId: 'int1', type: 'HTTP', uri: 'http://localhost:8080', method: 'ANY' },
  ],
  http2: [
    { integrationId: 'int2', type: 'Lambda', uri: 'arn:aws:lambda:us-east-1:123456789:function:handler', method: 'ANY' },
  ],
}

export const Default: Story = {
  args: {
    apis: mockApis,
    loading: false,
    expandedApis: new Set(),
    stages: mockStages,
    routes: mockRoutes,
    routeTargets: {},
    integrations: mockIntegrations,
  },
}

export const Loading: Story = {
  args: {
    apis: [],
    loading: true,
    expandedApis: new Set(),
    stages: {},
    routes: {},
    routeTargets: {},
    integrations: {},
  },
}

export const Expanded: Story = {
  args: {
    apis: mockApis,
    loading: false,
    expandedApis: new Set(['http1']),
    stages: mockStages,
    routes: mockRoutes,
    routeTargets: {},
    integrations: mockIntegrations,
  },
}

export const Empty: Story = {
  args: {
    apis: [],
    loading: false,
    expandedApis: new Set(),
    stages: {},
    routes: {},
    routeTargets: {},
    integrations: {},
  },
}