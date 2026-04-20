<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline'

export interface Snippet {
  language: string
  code: string
  label?: string
}

interface Props {
  snippets: Snippet[]
  title?: string
  defaultTab?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultTab: '',
})

const activeTab = ref(props.defaultTab || (props.snippets[0]?.language ?? ''))
const copiedIndex = ref<number | null>(null)

const tabs = computed(() =>
  props.snippets.map((s, i) => ({
    id: s.language,
    label: s.label || s.language,
    index: i,
  }))
)

const activeSnippet = computed(() =>
  props.snippets.find((s) => s.language === activeTab.value) || props.snippets[0]
)

const languageColors: Record<string, string> = {
  javascript: 'bg-yellow-500/20 text-yellow-500',
  typescript: 'bg-blue-500/20 text-blue-500',
  python: 'bg-green-500/20 text-green-500',
  go: 'bg-cyan-500/20 text-cyan-500',
  bash: 'bg-gray-500/20 text-gray-400',
  shell: 'bg-gray-500/20 text-gray-400',
  json: 'bg-orange-500/20 text-orange-400',
  yaml: 'bg-pink-500/20 text-pink-400',
  aws: 'bg-orange-500/20 text-orange-500',
  'aws-cli': 'bg-orange-500/20 text-orange-500',
  terraform: 'bg-purple-500/20 text-purple-400',
  sql: 'bg-blue-500/20 text-blue-400',
  html: 'bg-red-500/20 text-red-400',
  css: 'bg-blue-500/20 text-blue-400',
}

function getLanguageColor(lang: string): string {
  return languageColors[lang.toLowerCase()] || 'bg-gray-500/20 text-gray-400'
}

async function copyCode(code: string, index: number) {
  try {
    await navigator.clipboard.writeText(code)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

function downloadCode(snippet: Snippet) {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    go: 'go',
    bash: 'sh',
    shell: 'sh',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    terraform: 'tf',
    sql: 'sql',
    html: 'html',
    css: 'css',
    aws: 'sh',
    'aws-cli': 'sh',
  }

  const ext = extensions[snippet.language.toLowerCase()] || 'txt'
  const filename = `${props.title?.toLowerCase().replace(/\s+/g, '-') || 'code'}.${ext}`

  const blob = new Blob([snippet.code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Simple syntax highlighting
function highlightCode(code: string, language: string): string {
  // Escape HTML
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Basic syntax highlighting patterns
  const patterns: [RegExp, string][] = [
    // Comments
    [/(\/\/.*$|#.*$)/gm, 'text-gray-500 dark:text-gray-400'],
    [/\/\*[\s\S]*?\*\//g, 'text-gray-500 dark:text-gray-400'],
    // Strings
    [/(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g, 'text-emerald-600 dark:text-emerald-400'],
    // Numbers
    [/\b\d+\.?\d*\b/g, 'text-blue-600 dark:text-blue-400'],
    // Keywords
    [/\b(const|let|var|function|return|if|else|for|while|import|export|class|extends|new|this|async|await|try|catch|finally|throw|def|True|False|None|and|or|not|in|is|lambda|yield|from|as|with|type|struct|interface|package|func|go|chan|defer|select|case|default|switch)\b/g, 'text-violet-600 dark:text-violet-400'],
    // Booleans
    [/\b(true|false|null|undefined|nil)\b/g, 'text-amber-600 dark:text-amber-400'],
    // Functions
    [/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, 'text-sky-600 dark:text-sky-400'],
    // Types (for TypeScript/Go)
    [/\b(string|number|boolean|any|void|never|unknown|int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float|float32|float64|byte|rune|bool|error|map|slice|struct)\b/g, 'text-rose-600 dark:text-rose-400'],
  ]

  // Apply patterns with span wrapping
  patterns.forEach(([pattern, colorClass]) => {
    escaped = escaped.replace(pattern, (match) => `<span class="${colorClass}">${match}</span>`)
  })

  return escaped
}
</script>

<template>
  <div class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden">
    <!-- Header with Tabs -->
    <div class="border-b border-light-border dark:border-dark-border">
      <div class="flex items-center justify-between px-4 py-3 bg-light-bg dark:bg-dark-bg">
        <h3
          v-if="title"
          class="text-sm font-semibold text-light-text dark:text-dark-text"
        >
          {{ title }}
        </h3>
        <div class="flex items-center gap-2 ml-auto">
          <span
            v-if="activeSnippet"
            :class="getLanguageColor(activeSnippet.language)"
            class="px-2 py-0.5 text-xs font-medium rounded capitalize"
          >
            {{ activeSnippet.language }}
          </span>
        </div>
      </div>

      <!-- Language Tabs -->
      <div
        v-if="snippets.length > 1"
        class="flex overflow-x-auto px-2 bg-light-bg dark:bg-dark-bg"
      >
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
          :class="tab.id === activeTab
            ? 'border-primary-500 text-primary-500'
            : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:border-light-border dark:hover:border-dark-border'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Code Content -->
    <div class="relative group">
      <div class="flex items-center justify-end gap-1 absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          class="p-2 rounded-md bg-light-bg/80 dark:bg-dark-bg/80 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
          :title="copiedIndex === tabs.find(t => t.id === activeTab)?.index ? 'Copied!' : 'Copy code'"
          @click="copyCode(activeSnippet?.code || '', tabs.findIndex(t => t.id === activeTab))"
        >
          <CheckIcon
            v-if="copiedIndex === tabs.find(t => t.id === activeTab)?.index"
            class="h-4 w-4 text-emerald-500"
          />
          <ClipboardDocumentIcon
            v-else
            class="h-4 w-4"
          />
        </button>
        <button
          v-if="activeSnippet"
          type="button"
          class="p-2 rounded-md bg-light-bg/80 dark:bg-dark-bg/80 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
          title="Download"
          @click="downloadCode(activeSnippet)"
        >
          <ArrowDownTrayIcon class="h-4 w-4" />
        </button>
      </div>

      <pre class="p-4 pt-10 overflow-x-auto text-sm font-mono leading-relaxed bg-light-bg/50 dark:bg-dark-bg/50"><code v-html="highlightCode(activeSnippet?.code || '', activeSnippet?.language || 'text')" /></pre>
    </div>
  </div>
</template>

<style scoped>
pre {
  margin: 0;
}

code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgb(148 163 184 / 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184 / 0.7);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgb(71 85 105 / 0.5);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgb(71 85 105 / 0.7);
}
</style>
