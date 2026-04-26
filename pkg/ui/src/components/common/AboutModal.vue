<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Modal from '@/components/common/Modal.vue'

const settingsStore = useSettingsStore()

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const version = ref('dev')

onMounted(() => {
  fetch('/VERSION')
    .then(res => res.text())
    .then(text => {
      if (!text.startsWith('<')) {
        version.value = text.trim()
      }
    })
    .catch(() => {})
})

function handleClose() {
  emit('update:open', false)
  emit('close')
}
</script>

<template>
  <Modal
    :open="props.open"
    title="About MyDevStack"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div>
        <h3 class="font-medium">
          MyDevStack
        </h3>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Version {{ version }} - AWS Service Manager
        </p>
      </div>

      <div>
        <h3 class="font-medium">
          Supported Services
        </h3>
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          S3, Lambda, DynamoDB, SQS, SNS, IAM, KMS, Secrets Manager, API Gateway, Kinesis, and more.
        </p>
      </div>

      <div class="pt-4 flex items-center gap-6">
        <a 
          href="https://alfonsorodriguez.xyz" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
        >
          <img
            src="/me.png"
            alt="Website"
            class="w-8 h-8 rounded-full object-cover"
          >
          <span class="text-xs">Website</span>
        </a>
        <a 
          href="https://www.buymeacoffee.com/beabys" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
        >
          <svg
            viewBox="0 0 24 24"
            class="w-8 h-8"
            fill="currentColor"
          >
            <path d="M2.004 21.546h6.377v-1.409H5.59v-7.565h2.791v1.41h-2.79v4.744h2.204v1.41H2.004v-9.379h7.57v-1.41H2.004V21.546zm15.18-7.569c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195zm9.938-1.313c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195z" />
          </svg>
          <span class="text-xs">Support</span>
        </a>
        <a 
          href="https://github.com/my-devstack/mydevstack" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
        >
          <svg
            viewBox="0 0 24 24"
            class="w-8 h-8"
            fill="currentColor"
          >
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          <span class="text-xs">GitHub</span>
        </a>
      </div>
    </div>
  </Modal>
</template>