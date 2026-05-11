<script setup lang="ts">
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const props = defineProps<{
  examples: Array<{ language: string; label: string; code: string }>
}>()
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="props.examples"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>
