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
    it('sends POST to /secrets-manager/secrets with body', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Name: 'my-secret', ARN: 'arn:secret:1' }))
      const result = await createSecret({ Name: 'my-secret', SecretString: 'mypassword' })
      expect(result.Name).toBe('my-secret')
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretString).toBe('mypassword')
    })
  })

  describe('getSecretValue', () => {
    it('sends GET to /secrets-manager/secrets/{secretId}/value', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SecretString: 'mypassword' }))
      const result = await getSecretValue('my-secret')
      expect(result.SecretString).toBe('mypassword')
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/secrets-manager/secrets/my-secret/value')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('putSecretValue', () => {
    it('sends PUT to /secrets-manager/secrets/{secretId}/value without SecretId in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putSecretValue({ SecretId: 'my-secret', SecretString: 'newpass' })
      expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8081/secrets-manager/secrets/my-secret/value')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.SecretString).toBe('newpass')
      expect(body.SecretId).toBeUndefined()
    })
  })

  describe('deleteSecret', () => {
    it('sends DELETE to /secrets-manager/secrets/{secretId} with recovery window in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteSecret('my-secret', { RecoveryWindowInDays: 7 })
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets/my-secret')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.RecoveryWindowInDays).toBe(7)
      expect(body.SecretId).toBeUndefined()
    })

    it('sends DELETE with force delete option', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteSecret('my-secret', { ForceDeleteWithoutRecovery: true })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.ForceDeleteWithoutRecovery).toBe(true)
    })

    it('sends DELETE without options', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteSecret('my-secret')
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets/my-secret')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('updateSecret', () => {
    it('sends PUT to /secrets-manager/secrets/{secretId} without SecretId in body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await updateSecret({ SecretId: 'my-secret', Description: 'updated' })
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets/my-secret')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Description).toBe('updated')
      expect(body.SecretId).toBeUndefined()
    })
  })

  describe('describeSecret', () => {
    it('sends GET to /secrets-manager/secrets/{secretId}', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Name: 'my-secret' }))
      const result = await describeSecret('my-secret')
      expect(result.Name).toBe('my-secret')
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets/my-secret')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('listSecrets', () => {
    it('sends GET to /secrets-manager/secrets', async () => {
      mockFetch.mockResolvedValue(mockResponse({ SecretList: [{ Name: 's1' }] }))
      const result = await listSecrets()
      expect(result.SecretList).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets')
      expect(mockFetch.mock.calls[0][1]).toBeUndefined()
    })
  })

  describe('rotateSecret', () => {
    it('sends POST to /secrets-manager/secrets/{secretId}/rotate', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await rotateSecret('my-secret')
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets/my-secret/rotate')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })

    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(rotateSecret('my-secret')).rejects.toThrow(/Rotate secret failed/)
    })
  })

  describe('restoreSecret', () => {
    it('sends POST to /secrets-manager/secrets/{secretId}/restore', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await restoreSecret('my-secret')
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/secrets/my-secret/restore')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })

    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(restoreSecret('my-secret')).rejects.toThrow(/Restore secret failed/)
    })
  })

  describe('getRandomPassword', () => {
    it('sends POST to /secrets-manager/random-password', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RandomPassword: 'random123' }))
      const result = await getRandomPassword({ PasswordLength: 16 })
      expect(result.RandomPassword).toBe('random123')
      expect(mockFetch.mock.calls[0][0]).toContain('/secrets-manager/random-password')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PasswordLength).toBe(16)
    })

    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(getRandomPassword()).rejects.toThrow(/Get random password failed/)
    })

    it('sends empty object when no options provided', async () => {
      mockFetch.mockResolvedValue(mockResponse({ RandomPassword: '' }))
      await getRandomPassword()
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toEqual({})
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listSecrets()).rejects.toThrow(/List secrets failed/)
    })

    it('throws APIError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listSecrets()).rejects.toThrow('Network error')
    })
  })
})
