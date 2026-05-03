<script setup lang="ts">
defineProps<{
  stack: {
    StackId?: string
    StackName?: string
    CreationTime?: string
    Description?: string
  }
}>()
</script>

<template>
  <div class="stack-details">
    <div v-if="stack.StackId">
      <p>Stack ID: {{ stack.StackId }}</p>
    </div>
  </div>
</template>