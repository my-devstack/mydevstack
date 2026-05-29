/**
 * Secrets Manager Service API Client
 * REST HTTP client for Secrets Manager via Go proxy
 * @module api/services/secrets-manager
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

export class SecretsManagerService {
  async createSecret(params: {
    Name: string
    SecretString?: string
    SecretBinary?: string
    Description?: string
  }): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new APIError(`Create secret failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async getSecretValue(SecretId: string): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}/value`)
    if (!res.ok) throw new APIError(`Get secret value failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async putSecretValue(params: {
    SecretId: string
    SecretString?: string
    SecretBinary?: string
  }): Promise<any> {
    const { SecretId, ...body } = params
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}/value`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new APIError(`Put secret value failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async deleteSecret(SecretId: string, options?: {
    RecoveryWindowInDays?: number
    ForceDeleteWithoutRecovery?: boolean
  }): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    })
    if (!res.ok) throw new APIError(`Delete secret failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async updateSecret(params: {
    SecretId: string
    SecretString?: string
    Description?: string
  }): Promise<any> {
    const { SecretId, ...body } = params
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new APIError(`Update secret failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async describeSecret(SecretId: string): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}`)
    if (!res.ok) throw new APIError(`Describe secret failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async listSecrets(options?: { MaxResults?: number }): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets`)
    if (!res.ok) throw new APIError(`List secrets failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async rotateSecret(SecretId: string): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new APIError(`Rotate secret failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async restoreSecret(SecretId: string): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/secrets/${encodeURIComponent(SecretId)}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new APIError(`Restore secret failed`, res.status, 'secrets-manager')
    return res.json()
  }

  async getRandomPassword(options?: { PasswordLength?: number }): Promise<any> {
    const res = await fetch(`${api}/secrets-manager/random-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    })
    if (!res.ok) throw new APIError(`Get random password failed`, res.status, 'secrets-manager')
    return res.json()
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
