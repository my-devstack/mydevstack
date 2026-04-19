import { ref, readonly } from 'vue'

const reloadTrigger = ref(0)

export function useContentReload() {
  function triggerReload() {
    reloadTrigger.value++
  }

  return {
    reloadTrigger: readonly(reloadTrigger),
    triggerReload
  }
}
