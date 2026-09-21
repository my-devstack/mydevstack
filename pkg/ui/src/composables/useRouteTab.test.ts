import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive, nextTick } from 'vue'

const mockRoute = reactive({ query: {} as Record<string, string> })
const mockReplace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ replace: mockReplace }),
}))

import { useRouteTab } from './useRouteTab'

describe('useRouteTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
  })

  it('returns default tab when no query param', () => {
    const { activeTab } = useRouteTab('rest')
    expect(activeTab.value).toBe('rest')
  })

  it('uses query param when present', () => {
    mockRoute.query = { tab: 'http' }
    const { activeTab } = useRouteTab('rest')
    expect(activeTab.value).toBe('http')
  })

  it('setTab updates activeTab and URL', () => {
    const { activeTab, setTab } = useRouteTab('rest')
    setTab('http')
    expect(activeTab.value).toBe('http')
    expect(mockReplace).toHaveBeenCalledWith({ query: { tab: 'http' } })
  })

  it('setTab preserves other query params', () => {
    mockRoute.query = { foo: 'bar' }
    const { setTab } = useRouteTab('rest')
    setTab('http')
    expect(mockReplace).toHaveBeenCalledWith({ query: { foo: 'bar', tab: 'http' } })
  })

  it('watcher updates activeTab on route query change', async () => {
    const { activeTab } = useRouteTab('rest')
    expect(activeTab.value).toBe('rest')
    mockRoute.query = { tab: 'http' }
    await nextTick()
    expect(activeTab.value).toBe('http')
  })
})
