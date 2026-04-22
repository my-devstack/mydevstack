import { describe, it, expect } from 'vitest'
import { SERVICES, getServiceById, searchServices } from './useServices'

describe('useServices', () => {
  describe('SERVICES', () => {
    it('should have services defined', () => {
      expect(SERVICES).toBeDefined()
      expect(Array.isArray(SERVICES)).toBe(true)
      expect(SERVICES.length).toBeGreaterThan(0)
    })

    it('should have valid service structure', () => {
      const service = SERVICES[0]
      expect(service).toHaveProperty('id')
      expect(service).toHaveProperty('name')
      expect(service).toHaveProperty('category')
      expect(service).toHaveProperty('icon')
      expect(service).toHaveProperty('route')
    })

    it('should include core AWS services', () => {
      const serviceIds = SERVICES.map(s => s.id)
      expect(serviceIds).toContain('lambda')
      expect(serviceIds).toContain('s3')
      expect(serviceIds).toContain('dynamodb')
    })
  })

  describe('getServiceById', () => {
    it('should return service by id', () => {
      const service = getServiceById('lambda')
      expect(service).toBeDefined()
      expect(service?.id).toBe('lambda')
      expect(service?.name).toBe('Lambda')
    })

    it('should return undefined for unknown id', () => {
      const service = getServiceById('unknown-service')
      expect(service).toBeUndefined()
    })

    it('should return undefined for empty id', () => {
      const service = getServiceById('')
      expect(service).toBeUndefined()
    })
  })

  describe('searchServices', () => {
    it('should find services by name', () => {
      const results = searchServices('lambda')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(s => s.name.toLowerCase().includes('lambda'))).toBe(true)
    })

    it('should find services by id', () => {
      const results = searchServices('s3')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(s => s.id === 's3')).toBe(true)
    })

    it('should be case insensitive', () => {
      const results = searchServices('LAMBDA')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should return empty array for no matches', () => {
      const results = searchServices('xyz123nonexistent')
      expect(results).toEqual([])
    })
  })
})