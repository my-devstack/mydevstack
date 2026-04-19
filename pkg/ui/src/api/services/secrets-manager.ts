/**
 * Secrets Manager Service API Client
 * Simple HTTP client for Secrets Manager via Go proxy
 * @module api/services/secrets-manager
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function secretsRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')

  const url = `${endpoint}/secretsmanager/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `secretsmanager.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`Secrets Manager ${action} failed: ${errorText}`, response.status, 'secrets-manager')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`Secrets Manager ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'secrets-manager')
  }
}

export class SecretsManagerService {
  async createSecret(params: {
    Name: string
    SecretString?: string
    SecretBinary?: string
    Description?: string
  }): Promise<any> {
    return secretsRequest('CreateSecret', params)
  }

  async getSecretValue(SecretId: string): Promise<any> {
    return secretsRequest('GetSecretValue', { SecretId })
  }

  async putSecretValue(params: {
    SecretId: string
    SecretString?: string
    SecretBinary?: string
  }): Promise<any> {
    return secretsRequest('PutSecretValue', params)
  }

  async deleteSecret(SecretId: string, options?: {
    RecoveryWindowInDays?: number
    ForceDeleteWithoutRecovery?: boolean
  }): Promise<any> {
    return secretsRequest('DeleteSecret', { SecretId, ...options })
  }

  async updateSecret(params: {
    SecretId: string
    SecretString?: string
    Description?: string
  }): Promise<any> {
    return secretsRequest('UpdateSecret', params)
  }

  async describeSecret(SecretId: string): Promise<any> {
    return secretsRequest('DescribeSecret', { SecretId })
  }

  async listSecrets(options?: { MaxResults?: number }): Promise<any> {
    return secretsRequest('ListSecrets', options || {})
  }

  async rotateSecret(SecretId: string): Promise<any> {
    return secretsRequest('RotateSecret', { SecretId })
  }

  async restoreSecret(SecretId: string): Promise<any> {
    return secretsRequest('RestoreSecret', { SecretId })
  }

  async getRandomPassword(options?: { PasswordLength?: number }): Promise<any> {
    return secretsRequest('GetRandomPassword', options || {})
  }
}

export const secretsManagerService = new SecretsManagerService()

export const createSecret = (params: Parameters<SecretsManagerService['createSecret']>[0]) =>
  secretsManagerService.createSecret(params)
export const getSecretValue = (SecretId: string) => secretsManagerService.getSecretValue(SecretId)
export const putSecretValue = (params: Parameters<SecretsManagerService['putSecretValue']>[0]) =>
  secretsManagerService.putSecretValue(params)
export const deleteSecret = (SecretId: string, options?: Parameters<SecretsManagerService['deleteSecret']>[1]) =>
  secretsManagerService.deleteSecret(SecretId, options)
export const updateSecret = (params: Parameters<SecretsManagerService['updateSecret']>[0]) =>
  secretsManagerService.updateSecret(params)
export const describeSecret = (SecretId: string) => secretsManagerService.describeSecret(SecretId)
export const listSecrets = (options?: Parameters<SecretsManagerService['listSecrets']>[0]) =>
  secretsManagerService.listSecrets(options)
export const rotateSecret = (SecretId: string) => secretsManagerService.rotateSecret(SecretId)
export const restoreSecret = (SecretId: string) => secretsManagerService.restoreSecret(SecretId)
export const getRandomPassword = (options?: Parameters<SecretsManagerService['getRandomPassword']>[0]) =>
  secretsManagerService.getRandomPassword(options)

export default secretsManagerService
