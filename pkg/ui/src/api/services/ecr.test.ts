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

import {
  ecrService,
  listRepositories,
  createRepository,
  getRepository,
  deleteRepository,
  getAuthorizationToken,
  listImages,
  describeImages,
  batchGetImage,
  batchDeleteImage,
  listTagsForResource,
  updateTags,
} from './ecr'
import ecr from './ecr'
import { APIError } from '../client'

describe('ECR Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('listRepositories', () => {
    it('GET /ecr/repositories returns repositories and NextToken', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Repositories: [{ RepositoryName: 'repo-a' }, { RepositoryName: 'repo-b' }],
          NextToken: 'token-1',
        }),
      )
      const result = await listRepositories()
      expect(result.Repositories).toHaveLength(2)
      expect(result.NextToken).toBe('token-1')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/repositories$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('sends params as JSON body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repositories: [] }))
      await listRepositories({ RepositoryNames: ['repo-a'], MaxResults: 10, NextToken: 'tok' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RepositoryNames).toEqual(['repo-a'])
      expect(body.MaxResults).toBe(10)
      expect(body.NextToken).toBe('tok')
    })

    it('defaults Repositories to empty array when missing', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listRepositories()
      expect(result.Repositories).toEqual([])
      expect(result.NextToken).toBeUndefined()
    })
  })

  describe('createRepository', () => {
    it('POST /ecr/repositories with repository params', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ Repository: { RepositoryName: 'new-repo', RepositoryUri: '123.dkr.ecr.us-east-1.amazonaws.com/new-repo' } }),
      )
      const result = await createRepository({
        RepositoryName: 'new-repo',
        ImageTagMutability: 'IMMUTABLE',
        ImageScanningConfiguration: { ScanOnPush: true },
        Tags: [{ Key: 'env', Value: 'prod' }],
      })
      expect(result.Repository.RepositoryName).toBe('new-repo')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/repositories$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RepositoryName).toBe('new-repo')
      expect(body.ImageTagMutability).toBe('IMMUTABLE')
      expect(body.ImageScanningConfiguration.ScanOnPush).toBe(true)
      expect(body.Tags).toEqual([{ Key: 'env', Value: 'prod' }])
    })
  })

  describe('getRepository', () => {
    it('GET /ecr/repositories/{name} with encoded name', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ Repositories: [{ RepositoryName: 'my/repo', RepositoryArn: 'arn:aws:ecr:repo' }] }),
      )
      const result = await getRepository('my/repo')
      expect(result.Repositories[0].RepositoryName).toBe('my/repo')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain(`/ecr/repositories/${encodeURIComponent('my/repo')}`)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('deleteRepository', () => {
    it('DELETE /ecr/repositories/{name} without force query', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repository: { RepositoryName: 'old-repo' } }))
      const result = await deleteRepository('old-repo')
      expect(result.Repository.RepositoryName).toBe('old-repo')
      const url = mockFetch.mock.calls[0][0]
      expect(url).toMatch(/\/ecr\/repositories\/old-repo$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('DELETE /ecr/repositories/{name} with force=true query', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repository: { RepositoryName: 'old-repo' } }))
      await deleteRepository('old-repo', true)
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('/ecr/repositories/old-repo?force=true')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('getAuthorizationToken', () => {
    it('GET /ecr/authorization-token returns authorization data', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          AuthorizationData: [
            { AuthorizationToken: 'token', ExpiresAt: '2026-01-01T00:00:00Z', ProxyEndpoint: 'https://123.dkr.ecr.us-east-1.amazonaws.com' },
          ],
        }),
      )
      const result = await getAuthorizationToken()
      expect(result.AuthorizationData).toHaveLength(1)
      expect(result.AuthorizationData[0].AuthorizationToken).toBe('token')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/authorization-token$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('listImages', () => {
    it('GET /ecr/images/{repo} returns image ids and NextToken', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ImageIds: [{ ImageDigest: 'sha256:abc', ImageTag: 'latest' }],
          NextToken: 'img-token',
        }),
      )
      const result = await listImages('repo-a')
      expect(result.ImageIds).toHaveLength(1)
      expect(result.ImageIds[0].ImageTag).toBe('latest')
      expect(result.NextToken).toBe('img-token')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/images\/repo-a$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('sends params as JSON body and defaults ImageIds to empty array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listImages('repo-a', { MaxResults: 25, TagStatus: 'TAGGED' })
      expect(result.ImageIds).toEqual([])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MaxResults).toBe(25)
      expect(body.TagStatus).toBe('TAGGED')
    })
  })

  describe('describeImages', () => {
    it('GET /ecr/images/details/{repo} returns image details', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ImageDetails: [
            {
              RepositoryName: 'repo-a',
              ImageDigest: 'sha256:abc',
              ImageTags: ['latest'],
              ImageSizeInBytes: 1024,
            },
          ],
          NextToken: 'detail-token',
        }),
      )
      const result = await describeImages('repo-a')
      expect(result.ImageDetails).toHaveLength(1)
      expect(result.ImageDetails[0].ImageSizeInBytes).toBe(1024)
      expect(result.NextToken).toBe('detail-token')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/images\/details\/repo-a$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('sends ImageIds params as JSON body and defaults ImageDetails to empty array', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await describeImages('repo-a', { ImageIds: [{ ImageTag: 'v1' }] })
      expect(result.ImageDetails).toEqual([])
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ImageIds).toEqual([{ ImageTag: 'v1' }])
    })
  })

  describe('batchGetImage', () => {
    it('POST /ecr/images/batch-get/{repo} with image ids', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          Images: [{ ImageId: { ImageTag: 'latest' }, ImageManifest: '{}' }],
          Failures: [],
        }),
      )
      const result = await batchGetImage('repo-a', { ImageIds: [{ ImageTag: 'latest' }], AcceptedMediaTypes: ['application/vnd.docker.distribution.manifest.v2+json'] })
      expect(result.Images).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/images\/batch-get\/repo-a$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ImageIds).toEqual([{ ImageTag: 'latest' }])
      expect(body.AcceptedMediaTypes).toHaveLength(1)
    })
  })

  describe('batchDeleteImage', () => {
    it('POST /ecr/images/batch-delete/{repo} with image ids', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ImageIds: [{ ImageDigest: 'sha256:abc' }],
          Failures: [],
        }),
      )
      const result = await batchDeleteImage('repo-a', { ImageIds: [{ ImageDigest: 'sha256:abc' }] })
      expect(result.ImageIds).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/images\/batch-delete\/repo-a$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ImageIds).toEqual([{ ImageDigest: 'sha256:abc' }])
    })
  })

  describe('listTagsForResource', () => {
    it('GET /ecr/tags/{repo} returns tags', async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ Tags: [{ Key: 'env', Value: 'prod' }, { Key: 'team', Value: 'platform' }] }),
      )
      const result = await listTagsForResource('repo-a')
      expect(result.Tags).toHaveLength(2)
      expect(result.Tags[0].Key).toBe('env')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/tags\/repo-a$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('defaults Tags to empty array when missing', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listTagsForResource('repo-a')
      expect(result.Tags).toEqual([])
    })
  })

  describe('updateTags', () => {
    it('PUT /ecr/tags/{repo} with tags and removed keys', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'Tags updated' }))
      const result = await updateTags('repo-a', { Tags: { env: 'prod' }, RemovedKeys: ['old'] })
      expect(result.message).toBe('Tags updated')
      expect(mockFetch.mock.calls[0][0]).toMatch(/\/ecr\/tags\/repo-a$/)
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Tags).toEqual({ env: 'prod' })
      expect(body.RemovedKeys).toEqual(['old'])
    })
  })

  describe('ecrService class instance', () => {
    it('exposes all public methods', () => {
      expect(typeof ecrService.listRepositories).toBe('function')
      expect(typeof ecrService.createRepository).toBe('function')
      expect(typeof ecrService.getRepository).toBe('function')
      expect(typeof ecrService.deleteRepository).toBe('function')
      expect(typeof ecrService.getAuthorizationToken).toBe('function')
      expect(typeof ecrService.listImages).toBe('function')
      expect(typeof ecrService.describeImages).toBe('function')
      expect(typeof ecrService.batchGetImage).toBe('function')
      expect(typeof ecrService.batchDeleteImage).toBe('function')
      expect(typeof ecrService.listTagsForResource).toBe('function')
      expect(typeof ecrService.updateTags).toBe('function')
    })

    it('delegates through the class instance', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repositories: [{ RepositoryName: 'via-class' }] }))
      const result = await ecrService.listRepositories()
      expect(result.Repositories[0].RepositoryName).toBe('via-class')
    })
  })

  describe('ecr default export', () => {
    it('exposes all methods', () => {
      expect(typeof ecr.listRepositories).toBe('function')
      expect(typeof ecr.createRepository).toBe('function')
      expect(typeof ecr.getRepository).toBe('function')
      expect(typeof ecr.deleteRepository).toBe('function')
      expect(typeof ecr.getAuthorizationToken).toBe('function')
      expect(typeof ecr.listImages).toBe('function')
      expect(typeof ecr.describeImages).toBe('function')
      expect(typeof ecr.batchGetImage).toBe('function')
      expect(typeof ecr.batchDeleteImage).toBe('function')
      expect(typeof ecr.listTagsForResource).toBe('function')
      expect(typeof ecr.updateTags).toBe('function')
    })

    it('delegates listRepositories through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repositories: [{ RepositoryName: 'via-aggregate' }] }))
      const result = await ecr.listRepositories()
      expect(result.Repositories[0].RepositoryName).toBe('via-aggregate')
    })

    it('delegates createRepository through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repository: { RepositoryName: 'agg-repo' } }))
      const result = await ecr.createRepository({ RepositoryName: 'agg-repo' })
      expect(result.Repository.RepositoryName).toBe('agg-repo')
    })

    it('delegates getRepository through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repositories: [{ RepositoryName: 'agg-repo' }] }))
      const result = await ecr.getRepository('agg-repo')
      expect(result.Repositories[0].RepositoryName).toBe('agg-repo')
    })

    it('delegates deleteRepository through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Repository: { RepositoryName: 'agg-repo' } }))
      const result = await ecr.deleteRepository('agg-repo', true)
      expect(result.Repository.RepositoryName).toBe('agg-repo')
      expect(mockFetch.mock.calls[0][0]).toContain('force=true')
    })

    it('delegates getAuthorizationToken through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ AuthorizationData: [] }))
      const result = await ecr.getAuthorizationToken()
      expect(result.AuthorizationData).toEqual([])
    })

    it('delegates listImages through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ImageIds: [{ ImageTag: 'v1' }] }))
      const result = await ecr.listImages('agg-repo')
      expect(result.ImageIds).toHaveLength(1)
    })

    it('delegates describeImages through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ImageDetails: [{ RepositoryName: 'agg-repo' }] }))
      const result = await ecr.describeImages('agg-repo')
      expect(result.ImageDetails).toHaveLength(1)
    })

    it('delegates batchGetImage through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Images: [] }))
      const result = await ecr.batchGetImage('agg-repo', { ImageIds: [{ ImageTag: 'v1' }] })
      expect(result.Images).toEqual([])
    })

    it('delegates batchDeleteImage through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ ImageIds: [] }))
      const result = await ecr.batchDeleteImage('agg-repo', { ImageIds: [{ ImageTag: 'v1' }] })
      expect(result.ImageIds).toEqual([])
    })

    it('delegates listTagsForResource through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Tags: [] }))
      const result = await ecr.listTagsForResource('agg-repo')
      expect(result.Tags).toEqual([])
    })

    it('delegates updateTags through aggregate object', async () => {
      mockFetch.mockResolvedValue(mockResponse({ message: 'ok' }))
      const result = await ecr.updateTags('agg-repo', { Tags: { env: 'prod' } })
      expect(result.message).toBe('ok')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error with status and service', async () => {
      mockFetch.mockResolvedValue(mockResponse('RepositoryNotFoundException', 404))
      await expect(getRepository('missing')).rejects.toThrow(/ECR GET \/ecr\/repositories\/missing failed: RepositoryNotFoundException/)
      await expect(getRepository('missing')).rejects.toMatchObject({ statusCode: 404, service: 'ecr' })
    })

    it('throws APIError with 500 on network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(getAuthorizationToken()).rejects.toThrow(/Failed to GET \/ecr\/authorization-token/)
      await expect(getAuthorizationToken()).rejects.toMatchObject({ statusCode: 500, service: 'ecr' })
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns {} when response body is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Headers({ 'content-type': 'application/json' }),
      })
      const result = await getAuthorizationToken()
      expect(result).toEqual({})
    })

    it('re-throws APIError without wrapping', async () => {
      mockFetch.mockResolvedValue(mockResponse('BadRequest', 400))
      const error = await getAuthorizationToken().catch((e) => e)
      expect(error).toBeInstanceOf(APIError)
      expect(error.statusCode).toBe(400)
      expect(error.service).toBe('ecr')
    })
  })
})