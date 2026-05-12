import { shallowRef, computed, watch } from 'vue'
import type { Ref } from 'vue'

export interface UsePaginationOptions {
  defaultPerPage?: number
  perPageOptions?: number[]
}

export function usePagination<T>(items: Ref<T[]>, options: UsePaginationOptions = {}) {
  const { defaultPerPage = 10, perPageOptions = [5, 10, 20, 50] } = options

  const currentPage = shallowRef(1)
  const itemsPerPage = shallowRef(defaultPerPage)

  const totalPages = computed(() => {
    const total = Math.ceil(items.value.length / itemsPerPage.value)
    return Math.max(1, total)
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    return items.value.slice(start, start + itemsPerPage.value)
  })

  const totalItems = computed(() => items.value.length)

  const startItem = computed(() => {
    if (totalItems.value === 0) return 0
    return (currentPage.value - 1) * itemsPerPage.value + 1
  })

  const endItem = computed(() => {
    return Math.min(currentPage.value * itemsPerPage.value, totalItems.value)
  })

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  // Reset to page 1 when itemsPerPage changes
  watch(itemsPerPage, () => {
    currentPage.value = 1
  })

  // Reset to page 1 if current page exceeds total pages (fewer items after data change)
  watch([items, itemsPerPage], () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = 1
    }
  })

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    goToPage,
    perPageOptions,
    totalItems,
    startItem,
    endItem,
  }
}
