<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/solid'

interface JsonNode {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array'
  depth: number
  path: string
  isLast: boolean
}

interface FlatNode {
  node: JsonNode
  hasChildren: boolean
  childrenCount: number
}

const props = defineProps<{
  data: object | string
  expanded?: boolean
}>()

const copied = ref(false)
const expandedPaths = ref<Set<string>>(new Set())

const inputData = computed(() => {
  if (typeof props.data === 'string') {
    try {
      return JSON.parse(props.data)
    } catch {
      return props.data
    }
  }
  return props.data
})

const flatNodes = computed<FlatNode[]>(() => {
  const nodes: FlatNode[] = []
  
  function traverse(obj: any, key: string = 'root', depth: number = 0, path: string = '', isLast: boolean = true) {
    if (obj === null) {
      nodes.push({
        node: { key, value: null, type: 'null', depth, path, isLast },
        hasChildren: false,
        childrenCount: 0
      })
      return
    }
    
    if (typeof obj === 'object') {
      const isArray = Array.isArray(obj)
      const keys = isArray ? obj.map((_, i) => i) : Object.keys(obj)
      const items = isArray ? obj : obj
      
      nodes.push({
        node: { key, value: obj, type: isArray ? 'array' : 'object', depth, path, isLast },
        hasChildren: keys.length > 0,
        childrenCount: keys.length
      })
      
      if (isExpanded(path) && keys.length > 0) {
        keys.forEach((k, i) => {
          const childPath = path ? `${path}.${k}` : String(k)
          traverse(items[k], String(k), depth + 1, childPath, i === keys.length - 1)
        })
      }
    } else {
      let type: JsonNode['type'] = 'string'
      if (typeof obj === 'number') type = 'number'
      else if (typeof obj === 'boolean') type = 'boolean'
      
      nodes.push({
        node: { key, value: obj, type, depth, path, isLast },
        hasChildren: false,
        childrenCount: 0
      })
    }
  }
  
  traverse(inputData.value)
  return nodes
})

function isExpanded(path: string): boolean {
  if (props.expanded !== undefined) return props.expanded
  return expandedPaths.value.has(path) || path === ''
}

function toggleExpand(path: string) {
  if (expandedPaths.value.has(path)) {
    expandedPaths.value.delete(path)
  } else {
    expandedPaths.value.add(path)
  }
}

function expandAll() {
  const paths = new Set<string>()
  flatNodes.value.forEach(item => {
    if (item.hasChildren) {
      paths.add(item.node.path)
    }
  })
  expandedPaths.value = paths
}

function collapseAll() {
  expandedPaths.value.clear()
}

function getValueColor(type: JsonNode['type']): string {
  switch (type) {
    case 'string':
      return 'text-green-600 dark:text-green-400'
    case 'number':
      return 'text-blue-600 dark:text-blue-400'
    case 'boolean':
      return 'text-amber-600 dark:text-amber-400'
    case 'null':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-light-text dark:text-dark-text'
  }
}

function formatValue(value: any, type: JsonNode['type']): string {
  if (type === 'string') return `"${value}"`
  if (type === 'null') return 'null'
  return String(value)
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(inputData.value, null, 2))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

watch(() => props.expanded, (val) => {
  if (val !== undefined) {
    if (val) expandAll()
    else collapseAll()
  }
}, { immediate: true })
</script>

<template>
  <div
    class="rounded-lg border overflow-hidden"
    :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="text-xs px-2 py-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          @click="expandAll"
        >
          Expand All
        </button>
        <button
          type="button"
          class="text-xs px-2 py-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          @click="collapseAll"
        >
          Collapse All
        </button>
      </div>
      <button
        type="button"
        class="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
        :class="settingsStore.darkMode ? 'text-dark-muted hover:text-dark-text' : 'text-light-muted hover:text-light-text'"
        @click="copyToClipboard"
      >
        <CheckIcon
          v-if="copied"
          class="h-4 w-4"
        />
        <ClipboardDocumentIcon
          v-else
          class="h-4 w-4"
        />
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>

    <!-- JSON Content -->
    <div class="overflow-auto max-h-[600px]">
      <pre
        class="p-4 text-sm font-mono leading-relaxed"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >{{ JSON.stringify(inputData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { useSettingsStore } from '@/stores/settings'

export default {
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  }
}
</script>

<style scoped>
pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
