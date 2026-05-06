import type { Meta, StoryObj } from '@storybook/vue3-vite'
import APIGatewayRestApisList from './APIGatewayRestApisList.vue'

const meta: Meta<typeof APIGatewayRestApisList> = {
  title: 'Services/API Gateway/RestApisList',
  component: APIGatewayRestApisList,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    loadingResources: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof APIGatewayRestApisList>

const mockApis = [
  { id: 'api1', name: 'my-api', description: 'My first API', createdDate: '2024-01-15T10:00:00Z' },
  { id: 'api2', name: 'users-api', description: 'Users service', createdDate: '2024-01-20T14:30:00Z' },
]

const mockResources = [
  { id: 'res1', path: '/', pathPart: '' },
  { id: 'res2', path: '/items', pathPart: 'items' },
  { id: 'res3', path: '/users', pathPart: 'users' },
]

const mockResourceMethodsMap: Record<string, Record<string, any>> = {
  res1: {
    GET: { AuthorizationType: 'NONE', apiKeyRequired: false, integrationType: 'MOCK' },
  },
  res2: {
    GET: { AuthorizationType: 'NONE', apiKeyRequired: false, integrationType: 'HTTP', integrationUri: 'http://localhost:8080/items' },
    POST: { AuthorizationType: 'NONE', apiKeyRequired: false, integrationType: 'HTTP', integrationUri: 'http://localhost:8080/items' },
  },
  res3: {
    GET: { AuthorizationType: 'AWS_IAM', apiKeyRequired: true, integrationType: 'Lambda', integrationUri: 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789:function:users/invocations' },
  },
}

const mockDeployments = [
  { id: 'deploy1', createdDate: '2024-01-10T08:00:00Z', description: 'Initial deployment' },
  { id: 'deploy2', createdDate: '2024-01-18T12:00:00Z', description: 'Update endpoints' },
]

const mockStages = [
  { stageName: 'prod', status: 'ACTIVE', lastUpdatedDate: '2024-01-18T12:00:00Z' },
  { stageName: 'dev', status: 'ACTIVE', lastUpdatedDate: '2024-01-15T10:00:00Z' },
]

export const Default: Story = {
  args: {
    apis: mockApis,
    resources: mockResources,
    loading: false,
    loadingResources: false,
    expandedApis: new Set(),
    expandedResources: new Set(),
    resourceMethodsMap: mockResourceMethodsMap,
    resourceMethodsLoading: {},
    deployments: mockDeployments,
    stages: mockStages,
  },
}

export const Loading: Story = {
  args: {
    apis: [],
    resources: [],
    loading: true,
    loadingResources: false,
    expandedApis: new Set(),
    expandedResources: new Set(),
    resourceMethodsMap: {},
    resourceMethodsLoading: {},
    deployments: [],
    stages: [],
  },
}

export const Expanded: Story = {
  args: {
    apis: mockApis,
    resources: mockResources,
    loading: false,
    loadingResources: false,
    expandedApis: new Set(['api1']),
    expandedResources: new Set(['res1', 'res2']),
    resourceMethodsMap: mockResourceMethodsMap,
    resourceMethodsLoading: {},
    deployments: mockDeployments,
    stages: mockStages,
  },
}

export const Empty: Story = {
  args: {
    apis: [],
    resources: [],
    loading: false,
    loadingResources: false,
    expandedApis: new Set(),
    expandedResources: new Set(),
    resourceMethodsMap: {},
    resourceMethodsLoading: {},
    deployments: [],
    stages: [],
  },
}

export const LoadingResources: Story = {
  args: {
    apis: mockApis,
    resources: mockResources,
    loading: false,
    loadingResources: true,
    expandedApis: new Set(['api1']),
    expandedResources: new Set(['res1']),
    resourceMethodsMap: { res1: {} },
    resourceMethodsLoading: { res1: true },
    deployments: mockDeployments,
    stages: mockStages,
  },
}