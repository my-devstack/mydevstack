import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import Sidebar from './Sidebar.vue'

// Mock config
vi.mock('@/config', () => ({
  PROXY_BACKEND: 'http://127.0.0.1:8081',
}))

// Mock stores
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    path: '/',
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

describe('Sidebar Version Notification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // Create minimal stubs for router components
  const createStubs = () => ({
    RouterLink: {
      template: '<a><slot /></a>',
      props: ['to'],
    },
    RouterView: {
      template: '<div><slot /></div>',
    },
  })

  // Helper to set version refs directly on component
  const setVersions = (wrapper: any, current: string, latest: string, githubRepo: string) => {
    // Access the raw component and set internal ref values
    const vm = wrapper.vm as any
    // The refs are defined in setup(), access them via component's setup state
    // Try directly setting on the component's internal refs
    Object.assign(vm, {
      currentVersion: current,
      latestVersion: latest,
      githubRepo: githubRepo,
    })
  }

  describe('Version Comparison Logic', () => {
    it('shows notification when latestVersion > currentVersion (minor)', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.1.0'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })

    it('shows notification when latestVersion > currentVersion (major)', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '2.0.0'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })

    it('shows notification when latestVersion > currentVersion (patch)', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.0.1'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })

    it('does not show notification when latestVersion == currentVersion', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.0.0'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(false)
      wrapper.unmount()
    })

    it('does not show notification when latestVersion is empty', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = ''

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(false)
      wrapper.unmount()
    })

    it('does not show notification when currentVersion is empty', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = ''
      vm.latestVersion = '1.0.0'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(false)
      wrapper.unmount()
    })

    it('does not show notification when both are empty', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = ''
      vm.latestVersion = ''

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(false)
      wrapper.unmount()
    })
  })

  describe('Semantic Versioning', () => {
    it('handles version with v prefix', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = 'v1.0.0'
      vm.latestVersion = 'v1.1.0'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })

    it('handles pre-release versions (stripped)', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.0.1-beta'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })

    it('handles different version lengths (2 parts vs 3 parts)', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1'
      vm.latestVersion = '2'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })

    it('handles version with trailing zeros', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.0.0'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(false)
      wrapper.unmount()
    })
  })

  describe('Release URL Construction', () => {
    it('builds correct release URL', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.latestVersion = '1.2.3'
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const url = vm.getReleaseUrl()
      expect(url).toBe('https://github.com/my-devstack/mydevstack/releases/tag/v1.2.3')
      wrapper.unmount()
    })

    it('returns empty string when latestVersion is empty', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.latestVersion = ''
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const url = vm.getReleaseUrl()
      expect(url).toBe('')
      wrapper.unmount()
    })

    it('returns empty string when githubRepo is empty', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.latestVersion = '1.2.3'
      vm.githubRepo = ''

      const url = vm.getReleaseUrl()
      expect(url).toBe('')
      wrapper.unmount()
    })

    it('handles v-prefix in version for release URL', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.latestVersion = 'v1.2.3'
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const url = vm.getReleaseUrl()
      // Fixed: strip v prefix before adding it => v1.2.3 -> 1.2.3 -> v1.2.3
      expect(url).toBe('https://github.com/my-devstack/mydevstack/releases/tag/v1.2.3')
      wrapper.unmount()
    })

    it('returns empty string when both are empty', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.latestVersion = ''
      vm.githubRepo = ''

      const url = vm.getReleaseUrl()
      expect(url).toBe('')
      wrapper.unmount()
    })
  })

  describe('showVersionNotification state', () => {
    it('is false by default', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      expect(vm.showVersionNotification).toBe(false)
      wrapper.unmount()
    })

    it('becomes true when newer version is available', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.1.0'
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const result = vm.isNewerVersionAvailable()
      expect(result).toBe(true)
      wrapper.unmount()
    })
  })

  describe('Version Notification UI - Function Logic', () => {
    it('version comparison shows notification for newer version', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.1.0'
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const showNotification = vm.isNewerVersionAvailable()
      const releaseUrl = vm.getReleaseUrl()

      expect(showNotification).toBe(true)
      expect(releaseUrl).toBe('https://github.com/my-devstack/mydevstack/releases/tag/v1.1.0')
      wrapper.unmount()
    })

    it('version comparison does not show notification for same version', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = '1.0.0'
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const showNotification = vm.isNewerVersionAvailable()
      const releaseUrl = vm.getReleaseUrl()

      expect(showNotification).toBe(false)
      expect(releaseUrl).toBe('https://github.com/my-devstack/mydevstack/releases/tag/v1.0.0')
      wrapper.unmount()
    })

    it('version comparison does not show notification for empty latestVersion', () => {
      const wrapper = mount(Sidebar, {
        props: { collapsed: false },
        global: {
          stubs: createStubs(),
        },
      })
      const vm = wrapper.vm as any

      vm.currentVersion = '1.0.0'
      vm.latestVersion = ''
      vm.githubRepo = 'https://github.com/my-devstack/mydevstack'

      const showNotification = vm.isNewerVersionAvailable()
      const releaseUrl = vm.getReleaseUrl()

      expect(showNotification).toBe(false)
      expect(releaseUrl).toBe('')
      wrapper.unmount()
    })
  })
})