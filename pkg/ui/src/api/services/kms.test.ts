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
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
    it('uses keyId in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyMetadata: { KeyId: 'key1' } }))
      const result = await describeKey('key1')
      expect(result.KeyMetadata.KeyId).toBe('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('encodes special characters in keyId', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await describeKey('key/id+123')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/kms/keys/key%2Fid%2B123')
    })
  })

  describe('listKeys', () => {
    it('returns Keys array with metadata', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Keys: [{ KeyId: 'key1' }], Truncated: false }))
      const result = await listKeys()
      expect(result.Keys).toHaveLength(1)
      expect(result.Truncated).toBe(false)
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
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
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/encrypt')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
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
    it('sends KeyId in body and uses correct URL/method', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyId: 'key1', Plaintext: 'plain', CiphertextBlob: 'cipher' }))
      await generateDataKey('key1', { KeySpec: 'AES_256' })
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.KeyId).toBe('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/generate-data-key')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('sign', () => {
    it('sends base64 message with correct URL/method', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Signature: 'sig1' }))
      await sign('key1', 'msg', 'RSASSA_PSS_SHA_256')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Message).toBe(btoa('msg'))
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/sign')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('verify', () => {
    it('returns validation result', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyId: 'key1', SignatureValid: true }))
      const result = await verify('key1', 'msg', 'sig', 'RSASSA_PSS_SHA_256')
      expect(result.SignatureValid).toBe(true)
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/verify')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('scheduleKeyDeletion', () => {
    it('sends PendingWindowInDays in body and keyId in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await scheduleKeyDeletion('key1', 7)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PendingWindowInDays).toBe(7)
      expect(body.KeyId).toBeUndefined()
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/schedule-deletion')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('deleteKey', () => {
    it('calls scheduleKeyDeletion with 1 day', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteKey('key1')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.PendingWindowInDays).toBe(1)
      expect(body.KeyId).toBeUndefined()
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/schedule-deletion')
    })
  })

  describe('cancelKeyDeletion', () => {
    it('puts keyId in URL with no body', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await cancelKeyDeletion('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/cancel-deletion')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
      expect(mockFetch.mock.calls[0][1].body).toBeUndefined()
    })
  })

  describe('getKeyRotationStatus', () => {
    it('uses keyId in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({ KeyRotationEnabled: true }))
      const result = await getKeyRotationStatus('key1')
      expect(result.KeyRotationEnabled).toBe(true)
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/rotation')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('enableKeyRotation', () => {
    it('uses keyId in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await enableKeyRotation('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/rotation/enable')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('disableKeyRotation', () => {
    it('uses keyId in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await disableKeyRotation('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/rotation/disable')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('enableKey', () => {
    it('uses keyId in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await enableKey('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/enable')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('disableKey', () => {
    it('uses keyId in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await disableKey('key1')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/disable')
      expect(mockFetch.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('getKeyPolicy', () => {
    it('returns key policy from correct URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Policy: '{}' }))
      const result = await getKeyPolicy('key1')
      expect(result.Policy).toBe('{}')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/policy')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('listKeyPolicies', () => {
    it('lists policies from correct URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({ PolicyNames: ['default'] }))
      const result = await listKeyPolicies('key1')
      expect(result.PolicyNames).toContain('default')
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/policies')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('putKeyPolicy', () => {
    it('sends policy in body with keyId in URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await putKeyPolicy('key1', '{}', 'default')
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.Policy).toBe('{}')
      expect(body.PolicyName).toBe('default')
      expect(body.KeyId).toBeUndefined()
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/keys/key1/policy')
      expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
    })
  })

  describe('listAliases', () => {
    it('lists aliases from correct URL', async () => {
      mockFetch.mockResolvedValue(mockResponse({ Aliases: [{ AliasName: 'alias/my-key' }] }))
      const result = await listAliases()
      expect(result.Aliases).toHaveLength(1)
      expect(mockFetch.mock.calls[0][0]).toContain('/kms/aliases')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('deleteAlias', () => {
    it('uses aliasName in URL path', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlias('alias/my-key')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('/kms/aliases/alias%2Fmy-key')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
      expect(mockFetch.mock.calls[0][1].body).toBeUndefined()
    })

    it('encodes special characters in aliasName', async () => {
      mockFetch.mockResolvedValue(mockResponse({}))
      await deleteAlias('alias/foo+bar')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('alias%2Ffoo%2Bbar')
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
})
