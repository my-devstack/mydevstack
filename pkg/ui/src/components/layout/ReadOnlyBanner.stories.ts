import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import ReadOnlyBanner from './ReadOnlyBanner.vue'

const pinia = createPinia()

const meta: Meta<typeof ReadOnlyBanner> = {
  title: 'Layout/ReadOnlyBanner',
  component: ReadOnlyBanner,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      setup() {
        setActivePinia(pinia)
        const store = useSettingsStore()
        store.setReadOnly(true)
        return {}
      },
      template: '<div><story /></div>',
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
