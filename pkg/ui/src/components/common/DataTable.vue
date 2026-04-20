<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from './LoadingSpinner.vue'
import EmptyState from './EmptyState.vue'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: Column[]
  data: Record<string, unknown>[]
  loading?: boolean
  emptyText?: string
  emptyTitle?: string
  selectable?: boolean
  selectedKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: 'No data available',
  emptyTitle: 'No Results',
  selectable: false,
  selectedKey: '',
})

const emit = defineEmits<{
  'row-click': [row: Record<string, unknown>]
  'update:selectedKey': [key: string]
}>()

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Sorting
const sortKey = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

const sortedData = computed(() => {
  if (!sortKey.value) return props.data

  return [...props.data].sort((a, b) => {
    const aVal = a[sortKey.value!]
    const bVal = b[sortKey.value!]

    if (aVal === bVal) return 0

    const comparison = aVal < bVal ? -1 : 1
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const totalPages = computed(() => Math.ceil(props.data.length / pageSize.value))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

const totalItems = computed(() => props.data.length)
const startItem = computed(() => (currentPage.value - 1) * pageSize.value + 1)
const endItem = computed(() => Math.min(currentPage.value * pageSize.value, totalItems.value))

function handleSort(column: Column) {
  if (!column.sortable) return

  if (sortKey.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = column.key
    sortDirection.value = 'asc'
  }
}

function handleRowClick(row: Record<string, unknown>) {
  if (props.selectable) {
    const key = row.id as string || row.key as string
    emit('update:selectedKey', key)
  }
  emit('row-click', row)
}

function isSelected(row: Record<string, unknown>): boolean {
  if (!props.selectable || !props.selectedKey) return false
  const key = row.id as string || row.key as string
  return key === props.selectedKey
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function nextPage() {
  goToPage(currentPage.value + 1)
}

function prevPage() {
  goToPage(currentPage.value - 1)
}
</script>

<template>
  <div class="w-full">
    <!-- Table Container -->
    <div class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
      <table class="w-full min-w-full divide-y divide-light-border dark:divide-dark-border">
        <!-- Table Head -->
        <thead class="bg-light-bg dark:bg-dark-bg">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width, textAlign: column.align || 'left' }"
              class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted"
              :class="{ 'cursor-pointer select-none hover:bg-light-border dark:hover:bg-dark-border': column.sortable }"
              @click="handleSort(column)"
            >
              <div
                class="flex items-center gap-1"
                :class="{ 'justify-center': column.align === 'center', 'justify-end': column.align === 'right' }"
              >
                <span>{{ column.label }}</span>
                <template v-if="column.sortable">
                  <ChevronUpIcon
                    v-if="sortKey === column.key && sortDirection === 'asc'"
                    class="h-4 w-4 text-primary-500"
                  />
                  <ChevronDownIcon
                    v-else-if="sortKey === column.key && sortDirection === 'desc'"
                    class="h-4 w-4 text-primary-500"
                  />
                  <span
                    v-else
                    class="h-4 w-4 opacity-30"
                  >
                    <ChevronUpIcon class="h-3 w-3" />
                  </span>
                </template>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-light-border dark:divide-dark-border">
          <!-- Loading State -->
          <template v-if="loading">
            <tr
              v-for="i in pageSize"
              :key="`loading-${i}`"
            >
              <td
                v-for="column in columns"
                :key="`loading-${i}-${column.key}`"
                class="px-4 py-4"
              >
                <div class="h-4 bg-light-border dark:bg-dark-border rounded animate-pulse" />
              </td>
              <td class="px-4 py-4">
                <div class="h-4 bg-light-border dark:bg-dark-border rounded animate-pulse" />
              </td>
            </tr>
          </template>

          <!-- Data Rows -->
          <template v-else-if="paginatedData.length > 0">
            <tr
              v-for="(row, index) in paginatedData"
              :key="index"
              class="transition-colors duration-150"
              :class="{
                'cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg': $attrs['row-click'] || selectable,
                'bg-primary-50 dark:bg-primary-900/20': isSelected(row),
              }"
              @click="handleRowClick(row)"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-4 text-sm text-light-text dark:text-dark-text whitespace-nowrap"
                :class="{ 'text-center': column.align === 'center', 'text-right': column.align === 'right' }"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="row[column.key]"
                >
                  {{ row[column.key] }}
                </slot>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <slot
                  name="row-actions"
                  :row="row"
                >
                  <!-- Default: no actions -->
                </slot>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <template v-else>
            <tr>
              <td
                :colspan="columns.length + 1"
                class="px-4 py-12"
              >
                <EmptyState
                  icon="table-cells"
                  :title="emptyTitle"
                  :description="emptyText"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && totalItems > 0"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2"
    >
      <div class="text-sm text-light-muted dark:text-dark-muted">
        Showing <span class="font-medium">{{ startItem }}</span> to <span class="font-medium">{{ endItem }}</span> of <span class="font-medium">{{ totalItems }}</span> results
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="currentPage === 1"
          class="px-3 py-1.5 text-sm font-medium rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="prevPage"
        >
          Previous
        </button>

        <div class="flex items-center gap-1">
          <template
            v-for="page in totalPages"
            :key="page"
          >
            <button
              v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              type="button"
              class="min-w-[2rem] px-2 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="page === currentPage
                ? 'bg-primary-500 text-white'
                : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg border border-light-border dark:border-dark-border'"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span
              v-else-if="page === currentPage - 2 || page === currentPage + 2"
              class="px-1 text-light-muted dark:text-dark-muted"
            >
              ...
            </span>
          </template>
        </div>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="px-3 py-1.5 text-sm font-medium rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
