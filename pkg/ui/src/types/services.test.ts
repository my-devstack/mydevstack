import { describe, it, expect } from 'vitest'
import type { Service, ServiceCategory, Theme, ServiceResource, AppNotification } from './services'

describe('Service Types', () => {
  describe('Service', () => {
    it('should have required properties', () => {
      const service: Service = {
        id: 's3',
        name: 'S3',
        category: 'storage',
        icon: 'ArchiveBoxIcon',
        route: '/services/s3'
      }
      expect(service.id).toBe('s3')
      expect(service.name).toBe('S3')
      expect(service.category).toBe('storage')
      expect(service.icon).toBe('ArchiveBoxIcon')
      expect(service.route).toBe('/services/s3')
    })

    it('should allow optional description', () => {
      const service: Service = {
        id: 's3',
        name: 'S3',
        category: 'storage',
        icon: 'ArchiveBoxIcon',
        route: '/services/s3',
        description: 'Simple storage service'
      }
      expect(service.description).toBe('Simple storage service')
    })
  })

  describe('ServiceCategory', () => {
    it('should allow valid categories', () => {
      const categories: ServiceCategory[] = [
        'compute',
        'storage',
        'database',
        'messaging',
        'security',
        'networking',
        'analytics',
        'orchestration',
        'monitoring',
        'parameters'
      ]
      expect(categories).toHaveLength(10)
    })
  })

  describe('Theme', () => {
    it('should allow valid theme values', () => {
      const themes: Theme[] = ['light', 'dark', 'system']
      expect(themes).toContain('light')
      expect(themes).toContain('dark')
      expect(themes).toContain('system')
    })
  })

  describe('ServiceResource', () => {
    it('should have required properties', () => {
      const resource: ServiceResource = {
        id: 'my-bucket',
        name: 'my-bucket',
        serviceId: 's3',
        status: 'active',
        lastUpdated: new Date()
      }
      expect(resource.id).toBe('my-bucket')
      expect(resource.serviceId).toBe('s3')
      expect(resource.status).toBe('active')
    })

    it('should allow all status values', () => {
      const statuses: ServiceResource['status'][] = ['active', 'inactive', 'pending', 'error']
      expect(statuses).toContain('active')
      expect(statuses).toContain('inactive')
      expect(statuses).toContain('pending')
      expect(statuses).toContain('error')
    })

    it('should allow optional metadata', () => {
      const resource: ServiceResource = {
        id: 'my-bucket',
        name: 'my-bucket',
        serviceId: 's3',
        status: 'active',
        lastUpdated: new Date(),
        metadata: { region: 'us-east-1', size: '1GB' }
      }
      expect(resource.metadata).toBeDefined()
      expect(resource.metadata?.region).toBe('us-east-1')
    })
  })

  describe('AppNotification', () => {
    it('should have required properties', () => {
      const notification: AppNotification = {
        id: '1',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        read: false,
        timestamp: new Date()
      }
      expect(notification.id).toBe('1')
      expect(notification.title).toBe('Test')
      expect(notification.type).toBe('info')
    })

    it('should allow all notification types', () => {
      const types: AppNotification['type'][] = ['info', 'success', 'warning', 'error']
      expect(types).toContain('info')
      expect(types).toContain('success')
      expect(types).toContain('warning')
      expect(types).toContain('error')
    })
  })
})