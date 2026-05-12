import type { ServiceCategory } from './services'

export interface ServiceDefinition {
  id: string
  name: string
  category: ServiceCategory
  color: string
  bgColor: string
  statsFetcher: () => Promise<number>
}

export interface ServiceStats {
  serviceId: string
  count: number
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  loading: boolean
}

export type ServiceStatus = 'healthy' | 'warning' | 'error' | 'unknown'

export const SERVICE_COLORS: Record<string, { text: string; bg: string }> = {
  s3: { text: 'text-orange-500', bg: 'bg-orange-500' },
  lambda: { text: 'text-yellow-500', bg: 'bg-yellow-500' },
  dynamodb: { text: 'text-blue-500', bg: 'bg-blue-500' },
  sqs: { text: 'text-red-500', bg: 'bg-red-500' },
  sns: { text: 'text-purple-500', bg: 'bg-purple-500' },
  iam: { text: 'text-green-500', bg: 'bg-green-500' },
  ec2: { text: 'text-cyan-500', bg: 'bg-cyan-500' },
  rds: { text: 'text-pink-500', bg: 'bg-pink-500' },
  apigateway: { text: 'text-indigo-500', bg: 'bg-indigo-500' },
  kinesis: { text: 'text-teal-500', bg: 'bg-teal-500' },
  kms: { text: 'text-amber-500', bg: 'bg-amber-500' },
  secretsmanager: { text: 'text-rose-500', bg: 'bg-rose-500' },
  elasticache: { text: 'text-violet-500', bg: 'bg-violet-500' },
  ssm: { text: 'text-slate-500', bg: 'bg-slate-500' },
}

export const getServiceColor = (serviceId: string): string => {
  return SERVICE_COLORS[serviceId]?.text || 'text-gray-500'
}

export const getServiceBgColor = (serviceId: string): string => {
  return SERVICE_COLORS[serviceId]?.bg || 'bg-gray-500'
}

export const determineStatus = (count: number, error?: boolean): ServiceStatus => {
  if (error) return 'error'
  return 'healthy'
}