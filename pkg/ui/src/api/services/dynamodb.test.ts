import { describe, it, expect } from 'vitest'
import { unmarshall, marshall } from './dynamodb'

describe('DynamoDB Utils', () => {
  describe('unmarshall', () => {
    it('should import unmarshall function', async () => {
      const { unmarshall } = await import('./dynamodb')
      expect(unmarshall).toBeDefined()
      expect(typeof unmarshall).toBe('function')
    })

    it('should handle null input', () => {
      expect(unmarshall(null as any)).toEqual({})
      expect(unmarshall(undefined as any)).toEqual({})
    })

    it('should unmarshall string value', () => {
      const result = unmarshall({ name: { S: 'John' } })
      expect(result.name).toBe('John')
    })

    it('should unmarshall number value', () => {
      const result = unmarshall({ age: { N: '30' } })
      expect(result.age).toBe(30)
    })

    it('should unmarshall boolean value', () => {
      const result = unmarshall({ active: { BOOL: true } })
      expect(result.active).toBe(true)
    })

    it('should unmarshall null value', () => {
      const result = unmarshall({ value: { NULL: true } })
      expect(result.value).toBe(null)
    })

    it('should unmarshall binary value', () => {
      const result = unmarshall({ data: { B: 'abc123' } })
      expect(result.data).toBe('abc123')
    })

    it('should unmarshall map', () => {
      const result = unmarshall({ data: { M: { name: { S: 'John' } } } })
      expect(result.data).toEqual({ name: 'John' })
    })

    it('should pass through plain values', () => {
      const result = unmarshall({ value: 'plain' })
      expect(result.value).toBe('plain')
    })

    it('should handle complex object', () => {
      const input = {
        id: { S: '123' },
        count: { N: '42' },
        active: { BOOL: true },
        nested: { M: { name: { S: 'Test' } } }
      }
      const result = unmarshall(input)
      expect(result).toEqual({
        id: '123',
        count: 42,
        active: true,
        nested: { name: 'Test' }
      })
    })
  })

  describe('marshall', () => {
    it('should import marshall function', async () => {
      const { marshall } = await import('./dynamodb')
      expect(marshall).toBeDefined()
      expect(typeof marshall).toBe('function')
    })

    it('should handle null input', () => {
      expect(marshall(null as any)).toEqual({})
      expect(marshall(undefined as any)).toEqual({})
    })

    it('should marshall string value', () => {
      const result = marshall({ name: 'John' })
      expect(result.name).toEqual({ S: 'John' })
    })

    it('should marshall number value', () => {
      const result = marshall({ age: 30 })
      expect(result.age).toEqual({ N: '30' })
    })

    it('should marshall boolean true', () => {
      const result = marshall({ active: true })
      expect(result.active).toEqual({ BOOL: true })
    })

    it('should marshall boolean false', () => {
      const result = marshall({ active: false })
      expect(result.active).toEqual({ BOOL: false })
    })

    it('should marshall null value', () => {
      const result = marshall({ value: null })
      expect(result.value).toEqual({ NULL: true })
    })

    it('should marshall array as list', () => {
      const result = marshall({ tags: ['a', 'b', 'c'] })
      expect(result.tags).toEqual({ L: [{ S: 'a' }, { S: 'b' }, { S: 'c' }] })
    })

    it('should marshall object', () => {
      const result = marshall({ data: { name: 'John' } })
      expect(result.data).toEqual({ M: { name: { S: 'John' } } })
    })

    it('should handle complex object', () => {
      const input = {
        id: '123',
        count: 42,
        active: true
      }
      const result = marshall(input)
      expect(result).toEqual({
        id: { S: '123' },
        count: { N: '42' },
        active: { BOOL: true }
      })
    })
  })
})