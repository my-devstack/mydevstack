import { describe, it, expect } from 'vitest'
import {
  SERVICE_COLORS,
  getServiceColor,
  getServiceBgColor,
  determineStatus,
  type ServiceStats,
  type ServiceStatus,
} from '@/types/serviceRegistry'

describe('serviceRegistry', () => {
  describe('SERVICE_COLORS', () => {
    it('should have color definitions for all services', () => {
      expect(SERVICE_COLORS.s3).toBeDefined()
      expect(SERVICE_COLORS.lambda).toBeDefined()
      expect(SERVICE_COLORS.dynamodb).toBeDefined()
      expect(SERVICE_COLORS.sqs).toBeDefined()
      expect(SERVICE_COLORS.sns).toBeDefined()
      expect(SERVICE_COLORS.iam).toBeDefined()
    })

    it('should have text and bg colors', () => {
      expect(SERVICE_COLORS.s3.text).toBe('text-orange-500')
      expect(SERVICE_COLORS.s3.bg).toBe('bg-orange-500')
    })
  })

  describe('getServiceColor', () => {
    it('should return correct color for known service', () => {
      expect(getServiceColor('s3')).toBe('text-orange-500')
      expect(getServiceColor('lambda')).toBe('text-yellow-500')
      expect(getServiceColor('dynamodb')).toBe('text-blue-500')
    })

    it('should return default color for unknown service', () => {
      expect(getServiceColor('unknown')).toBe('text-gray-500')
      expect(getServiceColor('')).toBe('text-gray-500')
    })
  })

  describe('getServiceBgColor', () => {
    it('should return correct bg color for known service', () => {
      expect(getServiceBgColor('s3')).toBe('bg-orange-500')
      expect(getServiceBgColor('lambda')).toBe('bg-yellow-500')
    })

    it('should return default color for unknown service', () => {
      expect(getServiceBgColor('unknown')).toBe('bg-gray-500')
    })
  })

  describe('determineStatus', () => {
    it('should return healthy when count > 0', () => {
      expect(determineStatus(1)).toBe('healthy')
      expect(determineStatus(100)).toBe('healthy')
    })

    it('should return healthy when count is 0 and no error', () => {
      expect(determineStatus(0)).toBe('healthy')
    })

    it('should return error when error flag is true', () => {
      expect(determineStatus(0, true)).toBe('error')
      expect(determineStatus(10, true)).toBe('error')
    })
  })
})

describe('ServiceStats type', () => {
  it('should allow correct status values', () => {
    const stats: ServiceStats = {
      serviceId: 's3',
      count: 5,
      status: 'healthy',
      loading: false,
    }
    expect(stats.status).toBe('healthy')

    const warningStats: ServiceStats = { ...stats, status: 'warning', count: 0 }
    expect(warningStats.status).toBe('warning')

    const errorStats: ServiceStats = { ...stats, status: 'error' }
    expect(errorStats.status).toBe('error')

    const unknownStats: ServiceStats = { ...stats, status: 'unknown' }
    expect(unknownStats.status).toBe('unknown')
  })
})