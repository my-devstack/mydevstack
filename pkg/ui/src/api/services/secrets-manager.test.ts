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
  createSecret,
  getSecretValue,
  putSecretValue,
  deleteSecret,
  updateSecret,
  describeSecret,
  listSecrets,
  rotateSecret,
  restoreSecret,
  getRandomPassword,
} from './secrets-manager'

describe('Secrets Manager Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createSecret', () => {
    it('creates a secret', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Name: 'my-secret', ARN: 'arn:secret:1' }))
      const result = await createSecret({ Name: 'my-secret', SecretString: 'mypassword' })
      expect(result.Name).toBe('my-secret')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretString).toBe('mypassword')
    })
  })

  describe('getSecretValue', () => {
    it('gets secret by id', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SecretString: 'mypassword' }))
      const result = await getSecretValue('my-secret')
      expect(result.SecretString).toBe('mypassword')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretId).toBe('my-secret')
    })
  })

  describe('putSecretValue', () => {
    it('updates secret value', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putSecretValue({ SecretId: 'my-secret', SecretString: 'newpass' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretString).toBe('newpass')
    })
  })

  describe('deleteSecret', () => {
    it('deletes with recovery window', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteSecret('my-secret', { RecoveryWindowInDays: 7 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RecoveryWindowInDays).toBe(7)
    })

    it('deletes with force delete', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteSecret('my-secret', { ForceDeleteWithoutRecovery: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ForceDeleteWithoutRecovery).toBe(true)
    })

    it('deletes without options', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteSecret('my-secret')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretId).toBe('my-secret')
    })
  })

  describe('updateSecret', () => {
    it('updates secret', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateSecret({ SecretId: 'my-secret', Description: 'updated' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Description).toBe('updated')
    })
  })

  describe('describeSecret', () => {
    it('describes secret', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Name: 'my-secret' }))
      const result = await describeSecret('my-secret')
      expect(result.Name).toBe('my-secret')
    })
  })

  describe('listSecrets', () => {
    it('lists secrets', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SecretList: [{ Name: 's1' }] }))
      const result = await listSecrets()
      expect(result.SecretList).toHaveLength(1)
    })

    it('sends MaxResults option', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SecretList: [] }))
      await listSecrets({ MaxResults: 10 })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.MaxResults).toBe(10)
    })
  })

  describe('rotateSecret', () => {
    it('rotates secret', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await rotateSecret('my-secret')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretId).toBe('my-secret')
    })
  })

  describe('restoreSecret', () => {
    it('restores secret', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await restoreSecret('my-secret')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretId).toBe('my-secret')
    })
  })

  describe('getRandomPassword', () => {
    it('generates password', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RandomPassword: 'random123' }))
      const result = await getRandomPassword({ PasswordLength: 16 })
      expect(result.RandomPassword).toBe('random123')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listSecrets()).rejects.toThrow(/Secrets Manager ListSecrets failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listSecrets()).rejects.toThrow(/Failed to/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses secretsmanager prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SecretList: [] }))
      await listSecrets()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('secretsmanager.ListSecrets')
    })
  })
})
