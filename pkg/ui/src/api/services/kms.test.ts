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
  createKey,
  describeKey,
  listKeys,
  encrypt,
  decrypt,
  generateDataKey,
  sign,
  verify,
  scheduleKeyDeletion,
  deleteKey,
  cancelKeyDeletion,
  getKeyRotationStatus,
  enableKeyRotation,
  disableKeyRotation,
  enableKey,
  disableKey,
  getKeyPolicy,
  listKeyPolicies,
  putKeyPolicy,
  listAliases,
  deleteAlias,
  generateRandom,
} from './kms'

describe('KMS Service', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('createKey', () => {
    it('returns created key', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyMetadata: { KeyId: 'key1' } }))
      const result = await createKey({ Description: 'test key' })
      expect(result.KeyMetadata.KeyId).toBe('key1')
    })

    it('throws custom error on Unknown action response text', async () => {
      mockFetch.mockResolvedValue(mockResponse('Unknown action: CreateKey', 400))
      await expect(createKey()).rejects.toThrow(/not supported/)
    })

    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Server error', 500))
      await expect(createKey()).rejects.toThrow(/KMS CreateKey failed/)
    })

    it('throws APIError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(createKey()).rejects.toThrow(/Failed to CreateKey/)
    })
  })

  describe('describeKey', () => {
    it('sends KeyId', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyMetadata: { KeyId: 'key1' } }))
      const result = await describeKey('key1')
      expect(result.KeyMetadata.KeyId).toBe('key1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.KeyId).toBe('key1')
    })
  })

  describe('listKeys', () => {
    it('returns Keys array with metadata', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Keys: [{ KeyId: 'key1' }], Truncated: false }))
      const result = await listKeys()
      expect(result.Keys).toHaveLength(1)
      expect(result.Truncated).toBe(false)
    })

    it('handles empty keys', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await listKeys()
      expect(result.Keys).toEqual([])
    })
  })

  describe('encrypt', () => {
    it('encrypts plaintext and returns result', async () => {
      mockFetch.mockResolvedValue(mockResponse({ CiphertextBlob: 'encrypted123', KeyId: 'key1' }))
      const result = await encrypt('key1', 'secret')
      expect(result.CiphertextBlob).toBe('encrypted123')
      expect(result.KeyId).toBe('key1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Plaintext).toBe(btoa('secret'))
    })

    it('throws custom error on NotImplemented response text', async () => {
      mockFetch.mockResolvedValue(mockResponse('NotImplemented', 400))
      await expect(encrypt('key1', 'data')).rejects.toThrow(/not supported/)
    })

    it('throws APIError on network error in encrypt', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(encrypt('key1', 'data')).rejects.toThrow(/Failed to Encrypt/)
    })
  })

  describe('decrypt', () => {
    it('decrypts and returns plaintext decoded from base64', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Plaintext: btoa('decrypted'), KeyId: 'key1' }))
      const result = await decrypt('cipher1')
      expect(result.Plaintext).toBe('decrypted')
    })

    it('decrypts raw Plaintext when not valid base64', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Plaintext: 'raw-text', KeyId: 'key1' }))
      const result = await decrypt('cipher1')
      expect(result.Plaintext).toBe('raw-text')
    })

    it('decrypts handles missing Plaintext', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyId: 'key1' }))
      const result = await decrypt('cipher1')
      expect(result.Plaintext).toBe('')
    })
  })

  describe('generateDataKey', () => {
    it('sends KeyId', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyId: 'key1', Plaintext: 'plain', CiphertextBlob: 'cipher' }))
      await generateDataKey('key1', { KeySpec: 'AES_256' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.KeyId).toBe('key1')
    })
  })

  describe('sign', () => {
    it('sends base64 message', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Signature: 'sig1' }))
      await sign('key1', 'msg', 'RSASSA_PSS_SHA_256')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Message).toBe(btoa('msg'))
    })
  })

  describe('verify', () => {
    it('returns validation result', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyId: 'key1', SignatureValid: true }))
      const result = await verify('key1', 'msg', 'sig', 'RSASSA_PSS_SHA_256')
      expect(result.SignatureValid).toBe(true)
    })
  })

  describe('scheduleKeyDeletion', () => {
    it('sends deletion params', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await scheduleKeyDeletion('key1', 7)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PendingWindowInDays).toBe(7)
    })
  })

  describe('deleteKey', () => {
    it('calls scheduleKeyDeletion with 1 day', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteKey('key1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PendingWindowInDays).toBe(1)
    })
  })

  describe('cancelKeyDeletion', () => {
    it('sends KeyId', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await cancelKeyDeletion('key1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.KeyId).toBe('key1')
    })
  })

  describe('getKeyRotationStatus', () => {
    it('returns rotation status', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyRotationEnabled: true }))
      const result = await getKeyRotationStatus('key1')
      expect(result.KeyRotationEnabled).toBe(true)
    })
  })

  describe('enableKeyRotation', () => {
    it('enables rotation', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await enableKeyRotation('key1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.KeyId).toBe('key1')
    })
  })

  describe('disableKeyRotation', () => {
    it('disables rotation', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await disableKeyRotation('key1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('enableKey', () => {
    it('enables key', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await enableKey('key1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('disableKey', () => {
    it('disables key', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await disableKey('key1')
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getKeyPolicy', () => {
    it('returns key policy', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: '{}' }))
      const result = await getKeyPolicy('key1')
      expect(result.Policy).toBe('{}')
    })
  })

  describe('listKeyPolicies', () => {
    it('lists policies', async () => {
      mockFetch.mockResolvedValue(mockResponse({ PolicyNames: ['default'] }))
      const result = await listKeyPolicies('key1')
      expect(result.PolicyNames).toContain('default')
    })
  })

  describe('putKeyPolicy', () => {
    it('puts policy', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putKeyPolicy('key1', '{}', 'default')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Policy).toBe('{}')
    })
  })

  describe('listAliases', () => {
    it('lists aliases', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Aliases: [{ AliasName: 'alias/my-key' }] }))
      const result = await listAliases()
      expect(result.Aliases).toHaveLength(1)
    })
  })

  describe('deleteAlias', () => {
    it('sends AliasName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlias('alias/my-key')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.AliasName).toBe('alias/my-key')
    })
  })

  describe('generateRandom', () => {
    it('returns Plaintext', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Plaintext: 'random123' }))
      const result = await generateRandom({ NumberOfBytes: 32 })
      expect(result.Plaintext).toBe('random123')
    })

    it('returns empty Plaintext when missing', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      const result = await generateRandom()
      expect(result.Plaintext).toBe('')
    })
  })

  describe('Error handling', () => {
    it('throws APIError on server error', async () => {
      mockFetch.mockResolvedValue(mockResponse('Error', 500))
      await expect(listKeys()).rejects.toThrow(/KMS ListKeys failed/)
    })

    it('throws APIError with 500 on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      await expect(listKeys()).rejects.toThrow(/Failed to ListKeys/)
    })
  })

  describe('X-Amz-Target header', () => {
    it('uses kms prefix', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Keys: [] }))
      await listKeys()
      expect(mockFetch.mock.calls[0][1].headers['X-Amz-Target']).toBe('kms.ListKeys')
    })
  })
})
