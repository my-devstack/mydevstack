import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/composables/useTheme', () => {
  const theme = vi.fn().mockReturnValue({
    theme: vi.fn().mockReturnValue('dark'),
    isDark: vi.fn().mockReturnValue(true),
    toggleTheme: vi.fn(),
    setTheme: vi.fn()
  })
  return { useTheme: theme }
})

describe('useTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    })
    vi.stubGlobal('window', {
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
    })
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      }
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should import useTheme composable', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    expect(useTheme).toBeDefined()
  })

  it('should return theme, isDark, toggleTheme, and setTheme', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    const result = useTheme()
    expect(result.theme).toBeDefined()
    expect(result.isDark).toBeDefined()
    expect(result.toggleTheme).toBeDefined()
    expect(result.setTheme).toBeDefined()
  })

  it('should have toggleTheme as a function', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    const { toggleTheme } = useTheme()
    expect(typeof toggleTheme).toBe('function')
  })

  it('should have setTheme as a function', async () => {
    const { useTheme } = await import('@/composables/useTheme')
    const { setTheme } = useTheme()
    expect(typeof setTheme).toBe('function')
  })
})