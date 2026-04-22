import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useContentReload } from './useContentReload'

describe('useContentReload', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return readonly reloadTrigger', () => {
    const { reloadTrigger, triggerReload } = useContentReload()
    
    expect(reloadTrigger.value).toBe(0)
    expect(typeof triggerReload).toBe('function')
  })

  it('should increment reloadTrigger when triggerReload is called', () => {
    const { reloadTrigger, triggerReload } = useContentReload()
    
    expect(reloadTrigger.value).toBe(0)
    
    triggerReload()
    expect(reloadTrigger.value).toBe(1)
    
    triggerReload()
    expect(reloadTrigger.value).toBe(2)
  })

  it('should return a function for triggerReload', () => {
    const { triggerReload } = useContentReload()
    
    expect(typeof triggerReload).toBe('function')
  })
})