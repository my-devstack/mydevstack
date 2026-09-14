import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, ref } from 'vue'

vi.mock('@/api/services/api-gateway', () => ({
  listHttpApiAuthorizers: vi.fn().mockResolvedValue({ items: [] }),
  listRestApiAuthorizers: vi.fn().mockResolvedValue({ items: [] }),
  deleteHttpApiAuthorizer: vi.fn().mockResolvedValue({}),
  deleteRestApiAuthorizer: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => ({ darkMode: false }),
}))

import APIGatewayAuthorizersList from '@/components/apiGateway/APIGatewayAuthorizersList.vue'
import * as apigatewayApi from '@/api/services/api-gateway'

const modalStub = {
  template: '<div v-if="open" data-testid="modal">{{ title }}<slot /><slot name="footer" /></div>',
  props: ['open', 'title'],
}
const buttonStub = {
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'loading', 'disabled'],
  emits: ['click'],
}
const emptyStateStub = {
  template: '<div class="empty-state">{{ title }}</div>',
  props: ['icon', 'title', 'description'],
}
const loadingSpinnerStub = {
  template: '<div class="loading-spinner">Loading...</div>',
}
const dataTableStub = {
  template: '<div class="data-table"><div v-for="row in data" :key="row.authorizerId || row.id">{{ row.name }}</div></div>',
  props: ['columns', 'data', 'loading', 'emptyTitle', 'emptyText'],
}

const stubs = {
  Modal: modalStub,
  Button: buttonStub,
  LoadingSpinner: loadingSpinnerStub,
  EmptyState: emptyStateStub,
  DataTable: dataTableStub,
}

const Parent = defineComponent({
  components: { APIGatewayAuthorizersList },
  setup() {
    const show = ref(false)
    const listKey = ref(0)
    function open() { show.value = true }
    function bumpKey() { listKey.value++ }
    return { show, listKey, open, bumpKey }
  },
  template: `
    <div>
      <button data-testid="open" @click="open">open</button>
      <button data-testid="bump-key" @click="bumpKey">bump-key</button>
      <APIGatewayAuthorizersList
        v-if="show"
        :key="listKey"
        :open="show"
        api-id="api1"
        api-name="test"
        api-type="http"
        @update:open="show = $event"
      />
    </div>
  `,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.mocked(apigatewayApi.listHttpApiAuthorizers).mockResolvedValue({ items: [] })
})

describe('REPRO: does key bump force reload?', () => {
  it('counts listHttpApiAuthorizers calls across open and key bump', async () => {
    const wrapper = mount(Parent, { global: { stubs } })
    await flushPromises()

    await wrapper.find('[data-testid="open"]').trigger('click')
    await flushPromises()
    const afterOpen = vi.mocked(apigatewayApi.listHttpApiAuthorizers).mock.calls.length

    await wrapper.find('[data-testid="bump-key"]').trigger('click')
    await flushPromises()
    const afterBump = vi.mocked(apigatewayApi.listHttpApiAuthorizers).mock.calls.length

    console.log('calls after open:', afterOpen, 'calls after key bump:', afterBump)
    expect(afterBump).toBeGreaterThan(afterOpen)
  })
})