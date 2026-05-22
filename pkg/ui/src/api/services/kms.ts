/**
 * KMS Service API Client
 * RESTful HTTP client for KMS via Go proxy
 * @module api/services/kms
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

export class KMSService {
  private async request(action: string, method: string, path: string, body?: any): Promise<any> {
    const endpoint = PROXY_BACKEND.replace(/\/$/, '')
    const url = `${endpoint}${path}`
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body !== undefined) {
      options.body = JSON.stringify(body)
    }
    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        const errorText = await response.text()
        throw new APIError(`KMS ${action} failed: ${errorText}`, response.status, 'kms')
      }
      return response.json()
    } catch (error) {
      if (error instanceof APIError) throw error
      console.error(`KMS ${action} error:`, error)
      throw new APIError(`Failed to ${action}`, 500, 'kms')
    }
  }

  async createKey(params?: {
    Description?: string
    KeyUsage?: 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT'
    CustomerMasterKeySpec?: string
    Origin?: 'AWS_KMS' | 'EXTERNAL' | 'AWS_CLOUDHSM'
    BypassPolicyLockoutSafetyCheck?: boolean
    Policy?: string
    Tags?: Array<{ TagKey: string; TagValue: string }>
  }): Promise<any> {
    try {
      return await this.request('CreateKey', 'POST', '/kms/keys', params || {})
    } catch (error: any) {
      if (error.message?.includes('Unknown action') || error.message?.includes('NotImplemented')) {
        throw new APIError('KMS CreateKey not supported by this LocalStack version', 501, 'kms')
      }
      throw error
    }
  }

  async describeKey(keyId: string): Promise<any> {
    return await this.request('DescribeKey', 'GET', `/kms/keys/${encodeURIComponent(keyId)}`)
  }

  async listKeys(options?: { Limit?: number; Marker?: string }): Promise<{ Keys: any[]; NextMarker?: string; Truncated?: boolean }> {
    const params = new URLSearchParams()
    if (options?.Limit !== undefined) params.set('limit', String(options.Limit))
    if (options?.Marker !== undefined) params.set('marker', options.Marker)
    const query = params.toString()
    const path = `/kms/keys${query ? '?' + query : ''}`
    const response = await this.request('ListKeys', 'GET', path)
    return {
      Keys: response.Keys || [],
      NextMarker: response.NextMarker,
      Truncated: response.Truncated,
    }
  }

  async encrypt(keyId: string, plaintext: string, options?: {
    EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
    GrantTokens?: string[]
  }): Promise<{ CiphertextBlob: string; KeyId: string }> {
    try {
      const plaintextBase64 = btoa(plaintext)
      const response = await this.request('Encrypt', 'POST', '/kms/encrypt', {
        KeyId: keyId,
        Plaintext: plaintextBase64,
        ...options,
      })
      return {
        CiphertextBlob: response.CiphertextBlob || '',
        KeyId: response.KeyId || '',
      }
    } catch (error: any) {
      if (error.message?.includes('Unknown action') || error.message?.includes('NotImplemented')) {
        throw new APIError('KMS encrypt not supported by this LocalStack version', 501, 'kms')
      }
      throw error
    }
  }

  async decrypt(ciphertextBlob: string, options?: {
    EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
    GrantTokens?: string[]
  }): Promise<{ Plaintext: string; KeyId: string }> {
    try {
      const response = await this.request('Decrypt', 'POST', '/kms/decrypt', {
        CiphertextBlob: ciphertextBlob,
        ...options,
      })
      let plaintext = ''
      if (response.Plaintext) {
        try {
          plaintext = atob(response.Plaintext)
        } catch {
          plaintext = response.Plaintext
        }
      }
      return {
        Plaintext: plaintext,
        KeyId: response.KeyId || '',
      }
    } catch (error: any) {
      if (error.message?.includes('Unknown action') || error.message?.includes('NotImplemented')) {
        throw new APIError('KMS decrypt not supported by this LocalStack version', 501, 'kms')
      }
      throw error
    }
  }

  async generateDataKey(keyId: string, options?: {
    KeySpec?: 'AES_256' | 'AES_128'
    NumberOfBytes?: number
    GrantTokens?: string[]
  }): Promise<any> {
    return await this.request('GenerateDataKey', 'POST', '/kms/generate-data-key', {
      KeyId: keyId,
      ...options,
    })
  }

  async generateDataKeyWithoutPlaintext(keyId: string, options?: {
    KeySpec?: 'AES_256' | 'AES_128'
    NumberOfBytes?: number
  }): Promise<any> {
    return await this.request('GenerateDataKeyWithoutPlaintext', 'POST', '/kms/generate-data-key', {
      KeyId: keyId,
      ...options,
    })
  }

  async sign(keyId: string, message: string, signingAlgorithm: string, options?: {
    GrantTokens?: string[]
  }): Promise<any> {
    const messageBase64 = btoa(message)
    return await this.request('Sign', 'POST', '/kms/sign', {
      KeyId: keyId,
      Message: messageBase64,
      MessageType: 'RAW',
      SigningAlgorithm: signingAlgorithm,
      ...options,
    })
  }

  async verify(keyId: string, message: string, signature: string, signingAlgorithm: string): Promise<{ KeyId: string; SignatureValid: boolean }> {
    const messageBase64 = btoa(message)
    const response = await this.request('Verify', 'POST', '/kms/verify', {
      KeyId: keyId,
      Message: messageBase64,
      MessageType: 'RAW',
      Signature: signature,
      SigningAlgorithm: signingAlgorithm,
    })
    return {
      KeyId: response.KeyId || '',
      SignatureValid: response.SignatureValid || false,
    }
  }

  async scheduleKeyDeletion(keyId: string, pendingWindowInDays?: number): Promise<any> {
    try {
      return await this.request('ScheduleKeyDeletion', 'POST', `/kms/keys/${encodeURIComponent(keyId)}/schedule-deletion`, {
        PendingWindowInDays: pendingWindowInDays,
      })
    } catch (error: any) {
      if (error.statusCode === 400) {
        const msg = error.message || 'Unknown error'
        if (msg.includes('Unknown action')) {
          throw new APIError('ScheduleKeyDeletion not supported by this LocalStack version', 400, 'kms')
        }
        throw new APIError(`Failed to schedule key deletion: ${msg}`, 400, 'kms')
      }
      throw error
    }
  }

  async cancelKeyDeletion(keyId: string): Promise<any> {
    return await this.request('CancelKeyDeletion', 'POST', `/kms/keys/${encodeURIComponent(keyId)}/cancel-deletion`)
  }

  async getKeyRotationStatus(keyId: string): Promise<any> {
    return await this.request('GetKeyRotationStatus', 'GET', `/kms/keys/${encodeURIComponent(keyId)}/rotation`)
  }

  async enableKeyRotation(keyId: string): Promise<any> {
    return await this.request('EnableKeyRotation', 'POST', `/kms/keys/${encodeURIComponent(keyId)}/rotation/enable`)
  }

  async disableKeyRotation(keyId: string): Promise<any> {
    return await this.request('DisableKeyRotation', 'POST', `/kms/keys/${encodeURIComponent(keyId)}/rotation/disable`)
  }

  async enableKey(keyId: string): Promise<any> {
    return await this.request('EnableKey', 'POST', `/kms/keys/${encodeURIComponent(keyId)}/enable`)
  }

  async disableKey(keyId: string): Promise<any> {
    return await this.request('DisableKey', 'POST', `/kms/keys/${encodeURIComponent(keyId)}/disable`)
  }

  async getKeyPolicy(keyId: string, policyName: string = 'default'): Promise<any> {
    const path = `/kms/keys/${encodeURIComponent(keyId)}/policy?policyName=${encodeURIComponent(policyName)}`
    return await this.request('GetKeyPolicy', 'GET', path)
  }

  async listKeyPolicies(keyId: string): Promise<any> {
    return await this.request('ListKeyPolicies', 'GET', `/kms/keys/${encodeURIComponent(keyId)}/policies`)
  }

  async putKeyPolicy(keyId: string, policy: string, policyName: string = 'default'): Promise<any> {
    return await this.request('PutKeyPolicy', 'PUT', `/kms/keys/${encodeURIComponent(keyId)}/policy`, {
      Policy: policy,
      PolicyName: policyName,
    })
  }

  async listAliases(options?: { Limit?: number; Marker?: string }): Promise<any> {
    const params = new URLSearchParams()
    if (options?.Limit !== undefined) params.set('limit', String(options.Limit))
    if (options?.Marker !== undefined) params.set('marker', options.Marker)
    const query = params.toString()
    const path = `/kms/aliases${query ? '?' + query : ''}`
    return await this.request('ListAliases', 'GET', path)
  }

  async deleteAlias(aliasName: string): Promise<void> {
    return await this.request('DeleteAlias', 'DELETE', `/kms/aliases/${encodeURIComponent(aliasName)}`)
  }

  async generateRandom(options?: {
    NumberOfBytes?: number
    CustomKeyStoreId?: string
    EntropySource?: string
  }): Promise<{ Plaintext: string }> {
    const response = await this.request('GenerateRandom', 'POST', '/kms/generate-random', options || {})
    return {
      Plaintext: response.Plaintext || '',
    }
  }
}

export const kmsService = new KMSService()

export const createKey = (params?: Parameters<KMSService['createKey']>[0]) => kmsService.createKey(params)
export const describeKey = (keyId: string) => kmsService.describeKey(keyId)
export const listKeys = (options?: { Limit?: number; Marker?: string }) => kmsService.listKeys(options)
export const encrypt = (keyId: string, plaintext: string, options?: Parameters<KMSService['encrypt']>[2]) =>
  kmsService.encrypt(keyId, plaintext, options)
export const decrypt = (ciphertextBlob: string, options?: Parameters<KMSService['decrypt']>[1]) =>
  kmsService.decrypt(ciphertextBlob, options)
export const generateDataKey = (keyId: string, options?: { KeySpec?: 'AES_256' | 'AES_128'; NumberOfBytes?: number; GrantTokens?: string[] }) =>
  kmsService.generateDataKey(keyId, options)
export const sign = (keyId: string, message: string, signingAlgorithm: string, options?: Parameters<KMSService['sign']>[3]) =>
  kmsService.sign(keyId, message, signingAlgorithm, options)
export const verify = (keyId: string, message: string, signature: string, signingAlgorithm: string) =>
  kmsService.verify(keyId, message, signature, signingAlgorithm)
export const scheduleKeyDeletion = (keyId: string, pendingWindowInDays?: number) =>
  kmsService.scheduleKeyDeletion(keyId, pendingWindowInDays)
export const deleteKey = (keyId: string) => kmsService.scheduleKeyDeletion(keyId, 1)
export const cancelKeyDeletion = (keyId: string) => kmsService.cancelKeyDeletion(keyId)
export const getKeyRotationStatus = (keyId: string) => kmsService.getKeyRotationStatus(keyId)
export const enableKeyRotation = (keyId: string) => kmsService.enableKeyRotation(keyId)
export const disableKeyRotation = (keyId: string) => kmsService.disableKeyRotation(keyId)
export const enableKey = (keyId: string) => kmsService.enableKey(keyId)
export const disableKey = (keyId: string) => kmsService.disableKey(keyId)
export const getKeyPolicy = (keyId: string, policyName?: string) => kmsService.getKeyPolicy(keyId, policyName)
export const listKeyPolicies = (keyId: string) => kmsService.listKeyPolicies(keyId)
export const putKeyPolicy = (keyId: string, policy: string, policyName?: string) =>
  kmsService.putKeyPolicy(keyId, policy, policyName)
export const listAliases = (options?: any) => kmsService.listAliases(options)
export const deleteAlias = (aliasName: string) => kmsService.deleteAlias(aliasName)
export const generateRandom = (options?: { NumberOfBytes?: number; CustomKeyStoreId?: string; EntropySource?: string }) =>
  kmsService.generateRandom(options)

export default kmsService
