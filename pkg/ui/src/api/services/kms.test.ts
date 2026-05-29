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
  scheduleKeyDeletion,
  deleteKey,
  enableKey,
  disableKey,
  getKeyPolicy,
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
