// Integration test for useRouteTab composable
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useRouteTab } from './useRouteTab'

const StubComponent = defineComponent({
  props: {
    defaultTab: { type: String, required: true },
  },
  setup(props) {
    const { activeTab, setTab } = useRouteTab(props.defaultTab)
    return { activeTab, setTab }
  },
  render() {
    return h('div', [
      h('span', { 'data-testid': 'active-tab' }, this.activeTab),
      h('button', { 'data-testid': 'set-http', onClick: () => this.setTab('http') }, 'http'),
      h('button', { 'data-testid': 'set-rest', onClick: () => this.setTab('rest') }, 'rest'),
    ])
  },
})

function createTestRouter(initialRoute = '/') {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
    ],
  })
}

async function mountWithRouter(defaultTab = 'rest', initialRoute = '/') {
  const router = createTestRouter()
  await router.push(initialRoute)
  const wrapper = mount(StubComponent, {
    props: { defaultTab },
    global: {
      plugins: [router],
    },
  })
  await router.isReady()
  return { wrapper, router }
}

describe('useRouteTab integration', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    // Fresh router per test
  })

  it('returns default tab when no query param in URL', async () => {
    const { wrapper } = await mountWithRouter('rest')
    expect(wrapper.find('[data-testid="active-tab"]').text()).toBe('rest')
  })

  it('reads tab from URL query param on mount', async () => {
    const { wrapper } = await mountWithRouter('rest', '/?tab=http')
    expect(wrapper.find('[data-testid="active-tab"]').text()).toBe('http')
  })

  it('setTab updates URL query param', async () => {
    const { wrapper, router } = await mountWithRouter('rest')
    await wrapper.find('[data-testid="set-http"]').trigger('click')
    await flushPromises()
    await nextTick()
    expect(router.currentRoute.value.query.tab).toBe('http')
    expect(wrapper.find('[data-testid="active-tab"]').text()).toBe('http')
  })

  it('round-trip: tab change → URL update → tab read from URL', async () => {
    const { wrapper, router } = await mountWithRouter('rest')

    // Change tab → URL updates
    await wrapper.find('[data-testid="set-http"]').trigger('click')
    await flushPromises()
    await nextTick()
    expect(router.currentRoute.value.query.tab).toBe('http')

    // Navigate externally → tab reads from URL
    await router.replace({ query: { tab: 'websocket' } })
    await flushPromises()
    await nextTick()
    expect(wrapper.find('[data-testid="active-tab"]').text()).toBe('websocket')
  })

  it('tab resets to default when query param removed', async () => {
    const { wrapper, router } = await mountWithRouter('rest', '/?tab=http')
    expect(wrapper.find('[data-testid="active-tab"]').text()).toBe('http')

    await router.replace({ query: {} })
    await flushPromises()
    await nextTick()
    expect(wrapper.find('[data-testid="active-tab"]').text()).toBe('rest')
  })

  it('preserves other query params when setting tab', async () => {
    const { wrapper, router } = await mountWithRouter('rest', '/?foo=bar')
    await wrapper.find('[data-testid="set-http"]').trigger('click')
    await flushPromises()
    await nextTick()
    expect(router.currentRoute.value.query).toEqual({ foo: 'bar', tab: 'http' })
  })
})
