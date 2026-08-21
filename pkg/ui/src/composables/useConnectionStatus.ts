// Connection status composable for AWS-compatible services
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PROXY_BACKEND } from '@/config'
import { useSettingsStore } from '@/stores/settings'

const CONNECTION_CHECK_INTERVAL = 30000 // 30 seconds

// Global singleton state
const connectionStatus = ref({
  isConnected: false,
  isReachable: false,
  lastChecked: null as Date | null,
  endpoint: PROXY_BACKEND
})

let checkInterval: ReturnType<typeof setInterval> | null = null
let hasStartedMonitoring = false

// Check AWS endpoint connectivity
async function checkConnection(): Promise<boolean> {
  const targetEndpoint = PROXY_BACKEND

  const strategies = [
    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${targetEndpoint}/health`, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.status === 403 || response.status === 404 || response.type === 'opaque'
      } catch {
        return false
      }
    },

    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${targetEndpoint}/s3`, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.status === 404 || response.type === 'opaque'
      } catch {
        return false
      }
    },
    
    async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(`${targetEndpoint}/lambda/2015-03-31/functions`, {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        return response.ok || response.status === 200 || response.status === 404 || response.type === 'opaque'
      } catch {
        return false
      }
    },
  ]
  
  // Try to get target and region from health endpoint
  let backendTarget = ''
  let backendRegion = ''
  let backendEmulator = ''
  let backendEndpointOverride = ''
  try {
    const healthResponse = await fetch(`${targetEndpoint}/health`, { method: 'GET' })
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      backendTarget = healthData.target || healthData.endpoint_url || ''
      backendRegion = healthData.region || ''
      backendEmulator = healthData.emulator || ''
      backendEndpointOverride = healthData.endpoint_override || ''
    }
  } catch {
    // Ignore - will use default
  }

  // Sync region and emulator from backend response
  if (backendRegion) {
    const settingsStore = useSettingsStore()
    if (settingsStore.region !== backendRegion) {
      settingsStore.setRegion(backendRegion)
    }
  }

  // Set default region to us-east-1 for MINISTACK emulator
  if (backendEmulator === 'MINISTACK') {
    const settingsStore = useSettingsStore()
    settingsStore.setRegion('us-east-1')
    settingsStore.setEmulator(backendEmulator)
  } else if (backendEmulator) {
    const settingsStore = useSettingsStore()
    settingsStore.setEmulator(backendEmulator)
  }

  for (const strategy of strategies) {
    try {
      const result = await strategy()
      if (result) {
        connectionStatus.value = {
          ...connectionStatus.value,
          isReachable: true,
          isConnected: true,
          lastChecked: new Date(),
          endpoint: backendTarget || targetEndpoint
        }
        // Update public endpoint for code examples
        const settingsStore = useSettingsStore()
        if (backendEndpointOverride) {
          settingsStore.setPublicEndpoint(backendEndpointOverride)
        } else {
          settingsStore.setPublicEndpoint(backendTarget || targetEndpoint)
        }
        return true
      }
    } catch (e) {
      continue
    }
  }

  connectionStatus.value = {
    ...connectionStatus.value,
    isReachable: false,
    isConnected: false,
    lastChecked: new Date(),
    endpoint: backendTarget || targetEndpoint
  }
  // Update public endpoint for code examples
  const settingsStore = useSettingsStore()
  if (backendEndpointOverride) {
    settingsStore.setPublicEndpoint(backendEndpointOverride)
  } else {
    settingsStore.setPublicEndpoint(backendTarget || targetEndpoint)
  }
  
  return false
}

// Get current endpoint from config
function getEndpoint(): string {
  return PROXY_BACKEND
}

// Start periodic checks - singleton pattern
function startMonitoring(): void {
  if (hasStartedMonitoring) return
  
  hasStartedMonitoring = true
  checkConnection()
  checkInterval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL)
}

// Stop periodic checks
function stopMonitoring(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
    hasStartedMonitoring = false
  }
}

export function useConnectionStatus() {
  onMounted(() => {
    startMonitoring()
  })

  return {
    status: computed(() => connectionStatus.value),
    isConnected: computed(() => connectionStatus.value.isConnected),
    isReachable: computed(() => connectionStatus.value.isReachable),
    lastChecked: computed(() => connectionStatus.value.lastChecked),
    endpoint: computed(() => getEndpoint()),
    checkConnection,
    getEndpoint,
    startMonitoring,
    stopMonitoring
  }
}

// Export for direct access
export { connectionStatus, checkConnection, startMonitoring, stopMonitoring, getEndpoint }
