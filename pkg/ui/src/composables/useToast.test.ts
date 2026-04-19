import { describe, it, expect, beforeEach } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    // Clear toasts before each test
    const { toasts, removeToast } = useToast()
    toasts.value.forEach(t => removeToast(t.id))
  })

  it('should create a success toast', () => {
    const { success, toasts } = useToast()
    const id = success('Test message')
    
    expect(id).toBeDefined()
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].message).toBe('Test message')
  })

  it('should create an error toast', () => {
    const { error, toasts } = useToast()
    const id = error('Error message')
    
    expect(id).toBeDefined()
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].type).toBe('error')
    expect(toasts.value[0].message).toBe('Error message')
  })

  it('should create a warning toast', () => {
    const { warning, toasts } = useToast()
    const id = warning('Warning message')
    
    expect(id).toBeDefined()
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].type).toBe('warning')
  })

  it('should create an info toast', () => {
    const { info, toasts } = useToast()
    const id = info('Info message')
    
    expect(id).toBeDefined()
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].type).toBe('info')
  })

  it('should remove a toast by id', () => {
    const { success, removeToast, toasts } = useToast()
    const id = success('Test')
    
    expect(toasts.value.length).toBe(1)
    
    removeToast(id)
    
    expect(toasts.value.length).toBe(0)
  })

  it('should generate unique ids', () => {
    const { success } = useToast()
    const id1 = success('Test 1')
    const id2 = success('Test 2')
    
    expect(id1).not.toBe(id2)
  })
})
