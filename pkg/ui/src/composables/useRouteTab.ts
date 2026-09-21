import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useRouteTab(defaultTab: string) {
  let route: ReturnType<typeof useRoute> | undefined
  let router: ReturnType<typeof useRouter> | undefined
  try {
    route = useRoute()
    router = useRouter()
  } catch {
    // No router context (e.g., unit tests without router mock)
  }

  const queryTab = route?.query?.tab as string | undefined
  const activeTab = ref<string>(queryTab || defaultTab)

  function setTab(tab: string) {
    activeTab.value = tab
    if (router && route) {
      router.replace({ query: { ...route.query, tab } })
    }
  }

  if (route) {
    watch(() => route!.query.tab, (newTab) => {
      const t = (newTab as string | undefined) || defaultTab
      if (t !== activeTab.value) {
        activeTab.value = t
      }
    })
  }

  return { activeTab, setTab }
}
