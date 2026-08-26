import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

vi.mock('@/config', () => ({
  PROXY_BACKEND: 'http://127.0.0.1:8081',
}))

import {
  listClusters,
  createCluster,
  describeClusters,
  deleteCluster,
  listTaskDefinitions,
  registerTaskDefinition,
  describeTaskDefinition,
  deregisterTaskDefinition,
  listTaskDefinitionFamilies,
  runTask,
  listTasks,
  describeTasks,
  stopTask,
  listServices,
  createService,
  describeServices,
  deleteService,
} from './ecs'

describe('ECS Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listClusters', () => {
    it('GET /ecs/clusters returns parsed cluster arns', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        ClusterArns: ['arn:aws:ecs:us-east-1:123:cluster/prod'],
        NextToken: 'token-1',
      }))

      const result = await listClusters()
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/clusters$/)
      expect(result.ClusterArns).toEqual(['arn:aws:ecs:us-east-1:123:cluster/prod'])
      expect(result.NextToken).toBe('token-1')
    })

    it('passes NextToken and MaxResults as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ClusterArns: [] }))

      await listClusters({ NextToken: 'tok', MaxResults: 10 })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecs/clusters?')
      expect(url).toContain('NextToken=tok')
      expect(url).toContain('MaxResults=10')
    })

    it('defaults ClusterArns to empty array and omits query string when no params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))

      const result = await listClusters()
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/clusters$/)
      expect(result.ClusterArns).toEqual([])
      expect(result.NextToken).toBeUndefined()
    })
  })

  describe('createCluster', () => {
    it('POST /ecs/clusters with body and returns created cluster', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Cluster: { ClusterArn: 'arn:aws:ecs:us-east-1:123:cluster/new', ClusterName: 'new', Status: 'ACTIVE' },
      }))

      const result = await createCluster({ ClusterName: 'new' })
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/clusters$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual({ ClusterName: 'new' })
      expect(result.Cluster.ClusterName).toBe('new')
    })
  })

  describe('describeClusters', () => {
    it('GET /ecs/clusters/{name} returns clusters', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Clusters: [{ ClusterName: 'prod', Status: 'ACTIVE' }],
        Failures: [],
      }))

      const result = await describeClusters('prod')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/clusters\/prod$/)
      expect(result.Clusters).toHaveLength(1)
      expect(result.Clusters[0].ClusterName).toBe('prod')
    })

    it('URL-encodes the cluster name', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Clusters: [] }))

      await describeClusters('my cluster')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecs/clusters/my%20cluster')
    })
  })

  describe('deleteCluster', () => {
    it('DELETE /ecs/clusters/{name} returns deleted cluster', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Cluster: { ClusterName: 'old', Status: 'INACTIVE' } }))

      const result = await deleteCluster('old')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/clusters\/old$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      expect(result.Cluster.ClusterName).toBe('old')
    })
  })

  describe('listTaskDefinitions', () => {
    it('GET /ecs/task-definitions returns parsed arns', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        TaskDefinitionArns: ['arn:aws:ecs:us-east-1:123:task-definition/app:1'],
        NextToken: 'tok-2',
      }))

      const result = await listTaskDefinitions()
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/task-definitions$/)
      expect(result.TaskDefinitionArns).toHaveLength(1)
      expect(result.NextToken).toBe('tok-2')
    })

    it('passes FamilyPrefix, Status, Sort, NextToken and MaxResults as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TaskDefinitionArns: [] }))

      await listTaskDefinitions({
        FamilyPrefix: 'app',
        Status: 'ACTIVE',
        Sort: 'DESC',
        NextToken: 'tok',
        MaxResults: 5,
      })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecs/task-definitions?')
      expect(url).toContain('FamilyPrefix=app')
      expect(url).toContain('Status=ACTIVE')
      expect(url).toContain('Sort=DESC')
      expect(url).toContain('NextToken=tok')
      expect(url).toContain('MaxResults=5')
    })

    it('defaults TaskDefinitionArns to empty array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTaskDefinitions()
      expect(result.TaskDefinitionArns).toEqual([])
    })
  })

  describe('registerTaskDefinition', () => {
    it('POST /ecs/task-definitions with body and returns task definition', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        TaskDefinition: { TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/app:1', Family: 'app' },
      }))

      const params = {
        Family: 'app',
        ContainerDefinitions: [{ Name: 'web', Image: 'nginx:latest', Cpu: 256, Memory: 512, Essential: true }],
        RequiresCompatibilities: ['FARGATE'],
      }
      const result = await registerTaskDefinition(params)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/task-definitions$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual(params)
      expect(result.TaskDefinition.Family).toBe('app')
    })
  })

  describe('describeTaskDefinition', () => {
    it('GET /ecs/task-definitions/{arn} returns task definition', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        TaskDefinition: { TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/app:1', Revision: 1 },
      }))

      const arn = 'arn:aws:ecs:us-east-1:123:task-definition/app:1'
      const result = await describeTaskDefinition(arn)
      expect(mockFetch.mock.calls[0][0]).toContain(`/ecs/task-definitions/${encodeURIComponent(arn)}`)
      expect(result.TaskDefinition.Revision).toBe(1)
    })
  })

  describe('deregisterTaskDefinition', () => {
    it('DELETE /ecs/task-definitions/{arn} returns task definition', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        TaskDefinition: { TaskDefinitionArn: 'arn:aws:ecs:us-east-1:123:task-definition/app:1', Status: 'INACTIVE' },
      }))

      const arn = 'arn:aws:ecs:us-east-1:123:task-definition/app:1'
      const result = await deregisterTaskDefinition(arn)
      expect(mockFetch.mock.calls[0][0]).toContain(`/ecs/task-definitions/${encodeURIComponent(arn)}`)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      expect(result.TaskDefinition.Status).toBe('INACTIVE')
    })
  })

  describe('listTaskDefinitionFamilies', () => {
    it('GET /ecs/task-definition-families returns families', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Families: ['app', 'worker'], NextToken: 'tok-3' }))

      const result = await listTaskDefinitionFamilies()
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/task-definition-families$/)
      expect(result.Families).toEqual(['app', 'worker'])
      expect(result.NextToken).toBe('tok-3')
    })

    it('passes FamilyPrefix, Status, NextToken and MaxResults as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Families: [] }))

      await listTaskDefinitionFamilies({ FamilyPrefix: 'app', Status: 'ACTIVE', NextToken: 'tok', MaxResults: 20 })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecs/task-definition-families?')
      expect(url).toContain('FamilyPrefix=app')
      expect(url).toContain('Status=ACTIVE')
      expect(url).toContain('NextToken=tok')
      expect(url).toContain('MaxResults=20')
    })

    it('defaults Families to empty array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTaskDefinitionFamilies()
      expect(result.Families).toEqual([])
    })
  })

  describe('runTask', () => {
    it('POST /ecs/tasks with body and returns tasks', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Tasks: [{ TaskArn: 'arn:aws:ecs:us-east-1:123:task/abc', LastStatus: 'RUNNING' }],
        Failures: [],
      }))

      const params = {
        Cluster: 'prod',
        TaskDefinition: 'app:1',
        Count: 1,
        LaunchType: 'FARGATE',
        StartedBy: 'ci',
        Group: 'service:app',
      }
      const result = await runTask(params)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/tasks$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual(params)
      expect(result.Tasks).toHaveLength(1)
      expect(result.Tasks[0].LastStatus).toBe('RUNNING')
    })
  })

  describe('listTasks', () => {
    it('GET /ecs/tasks returns parsed task arns', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        TaskArns: ['arn:aws:ecs:us-east-1:123:task/abc'],
        NextToken: 'tok-4',
      }))

      const result = await listTasks()
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/tasks$/)
      expect(result.TaskArns).toHaveLength(1)
      expect(result.NextToken).toBe('tok-4')
    })

    it('passes Cluster, Family, ServiceName, Status, NextToken and MaxResults as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ TaskArns: [] }))

      await listTasks({
        Cluster: 'prod',
        Family: 'app',
        ServiceName: 'web',
        Status: 'RUNNING',
        NextToken: 'tok',
        MaxResults: 50,
      })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecs/tasks?')
      expect(url).toContain('Cluster=prod')
      expect(url).toContain('Family=app')
      expect(url).toContain('ServiceName=web')
      expect(url).toContain('Status=RUNNING')
      expect(url).toContain('NextToken=tok')
      expect(url).toContain('MaxResults=50')
    })

    it('defaults TaskArns to empty array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTasks()
      expect(result.TaskArns).toEqual([])
    })
  })

  describe('describeTasks', () => {
    it('GET /ecs/tasks/{arn} returns tasks', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Tasks: [{ TaskArn: 'arn:aws:ecs:us-east-1:123:task/abc', LastStatus: 'RUNNING' }],
      }))

      const arn = 'arn:aws:ecs:us-east-1:123:task/abc'
      const result = await describeTasks(arn)
      expect(mockFetch.mock.calls[0][0]).toContain(`/ecs/tasks/${encodeURIComponent(arn)}`)
      expect(result.Tasks).toHaveLength(1)
      expect(result.Tasks[0].LastStatus).toBe('RUNNING')
    })

    it('passes Cluster as query param when provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Tasks: [] }))

      const arn = 'arn:aws:ecs:us-east-1:123:task/abc'
      await describeTasks(arn, 'prod')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(`/ecs/tasks/${encodeURIComponent(arn)}?Cluster=prod`)
      expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined()
    })

    it('omits query string when no cluster provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Tasks: [] }))

      const arn = 'arn:aws:ecs:us-east-1:123:task/abc'
      await describeTasks(arn)
      const url = mockFetch.mock.calls[0][0]
      expect(url).toBe(`http://127.0.0.1:8081/ecs/tasks/${encodeURIComponent(arn)}`)
      expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined()
    })
  })

  describe('stopTask', () => {
    it('POST /ecs/tasks/stop with Task, Cluster and Reason body', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Task: { TaskArn: 'arn:aws:ecs:us-east-1:123:task/abc', LastStatus: 'STOPPED' },
      }))

      const arn = 'arn:aws:ecs:us-east-1:123:task/abc'
      const result = await stopTask(arn, 'prod', 'scaling down')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/tasks\/stop$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual({ Task: arn, Cluster: 'prod', Reason: 'scaling down' })
      expect(result.Task.TaskArn).toBe(arn)
      expect(result.Task.LastStatus).toBe('STOPPED')
    })

    it('sends only Task when Cluster and Reason not provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Task: {} }))

      await stopTask('arn:aws:ecs:us-east-1:123:task/abc')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual({ Task: 'arn:aws:ecs:us-east-1:123:task/abc' })
    })
  })

  describe('listServices', () => {
    it('GET /ecs/services returns parsed service arns', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        ServiceArns: ['arn:aws:ecs:us-east-1:123:service/prod/web'],
        NextToken: 'tok-5',
      }))

      const result = await listServices()
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/services$/)
      expect(result.ServiceArns).toHaveLength(1)
      expect(result.NextToken).toBe('tok-5')
    })

    it('passes Cluster, NextToken and MaxResults as query params', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ServiceArns: [] }))

      await listServices({ Cluster: 'prod', NextToken: 'tok', MaxResults: 25 })
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecs/services?')
      expect(url).toContain('Cluster=prod')
      expect(url).toContain('NextToken=tok')
      expect(url).toContain('MaxResults=25')
    })

    it('defaults ServiceArns to empty array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listServices()
      expect(result.ServiceArns).toEqual([])
    })
  })

  describe('createService', () => {
    it('POST /ecs/services with body and returns service', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Service: { ServiceArn: 'arn:aws:ecs:us-east-1:123:service/prod/web', ServiceName: 'web', Status: 'ACTIVE' },
      }))

      const params = {
        Cluster: 'prod',
        ServiceName: 'web',
        TaskDefinition: 'app:1',
        DesiredCount: 2,
        LaunchType: 'FARGATE',
        SchedulingStrategy: 'REPLICA',
      }
      const result = await createService(params)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/services$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual(params)
      expect(result.Service.ServiceName).toBe('web')
    })
  })

  describe('describeServices', () => {
    it('GET /ecs/services/{name} returns services', async () => {
      mockFetch.mockResolvedValue(mockResponse({
        Services: [{ ServiceName: 'web', Status: 'ACTIVE' }],
        Failures: [],
      }))

      const result = await describeServices('web')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/services\/web$/)
      expect(mockFetch.mock.calls[0][1]?.method).toBeUndefined()
      expect(result.Services).toHaveLength(1)
      expect(result.Services[0].ServiceName).toBe('web')
    })

    it('URL-encodes service name and passes Cluster as query param when provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Services: [] }))

      await describeServices('my service', 'prod')
      expect(mockFetch.mock.calls[0][0]).toContain('/ecs/services/my%20service?Cluster=prod')
      expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined()
    })

    it('omits query string when no cluster provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Services: [] }))

      await describeServices('web')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/ecs/services/web')
      expect(mockFetch.mock.calls[0][1]?.body).toBeUndefined()
    })
  })

  describe('deleteService', () => {
    it('DELETE /ecs/services/{name} with Cluster and Force body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Service: { ServiceName: 'web', Status: 'INACTIVE' } }))

      const result = await deleteService('web', 'prod', true)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecs\/services\/web$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual({ Cluster: 'prod', Force: true })
      expect(result.Service.ServiceName).toBe('web')
    })

    it('sends undefined Cluster and Force when not provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Service: {} }))

      await deleteService('web')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual({ Cluster: undefined, Force: undefined })
    })
  })

  describe('Error handling', () => {
    it('listClusters throws APIError on 500', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listClusters()).rejects.toThrow('List clusters failed')
    })

    it('describeTasks throws APIError on 500', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(describeTasks('arn:aws:ecs:us-east-1:123:task/abc')).rejects.toThrow('Describe task failed')
    })

    it('createCluster throws APIError on 400', async () => {
      mockFetch.mockResolvedValue(mockResponse('Bad request', 400))
      await expect(createCluster({ ClusterName: 'new' })).rejects.toThrow('Create cluster failed')
    })

    it('registerTaskDefinition throws APIError on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(
        registerTaskDefinition({ Family: 'app', ContainerDefinitions: [{ Name: 'web', Image: 'nginx' }] }),
      ).rejects.toThrow('Register task definition failed')
    })

    it('deleteService throws APIError on non-ok response', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(deleteService('web')).rejects.toThrow('Delete service failed')
    })
  })
})
