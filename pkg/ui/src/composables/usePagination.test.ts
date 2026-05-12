import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('handles empty items array', () => {
    const items = ref<string[]>([])
    const { totalPages, paginatedItems, currentPage, totalItems, startItem, endItem } = usePagination(items)
    expect(totalPages.value).toBe(1)
    expect(paginatedItems.value).toEqual([])
    expect(currentPage.value).toBe(1)
    expect(totalItems.value).toBe(0)
    expect(startItem.value).toBe(0)
    expect(endItem.value).toBe(0)
  })

  it('returns correct total pages and paginated items with default perPage=10', () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => `item-${i + 1}`))
    const { totalPages, paginatedItems, totalItems } = usePagination(items)
    expect(totalItems.value).toBe(25)
    expect(totalPages.value).toBe(3)
    expect(paginatedItems.value).toHaveLength(10)
    expect(paginatedItems.value[0]).toBe('item-1')
    expect(paginatedItems.value[9]).toBe('item-10')
  })

  it('navigates pages with goToPage', () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => `item-${i + 1}`))
    const { goToPage, currentPage, paginatedItems } = usePagination(items)

    // Go to page 2
    goToPage(2)
    expect(currentPage.value).toBe(2)
    expect(paginatedItems.value[0]).toBe('item-11')
    expect(paginatedItems.value[9]).toBe('item-20')

    // Go to page 3
    goToPage(3)
    expect(currentPage.value).toBe(3)
    expect(paginatedItems.value).toHaveLength(5)
    expect(paginatedItems.value[0]).toBe('item-21')

    // Go beyond bounds — should stay on page 3
    goToPage(99)
    expect(currentPage.value).toBe(3)

    // Go below bounds — should stay on page 3
    goToPage(0)
    expect(currentPage.value).toBe(3)
  })

  it('resets to page 1 when itemsPerPage changes', async () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => `item-${i + 1}`))
    const { goToPage, currentPage, itemsPerPage } = usePagination(items, { defaultPerPage: 10 })

    goToPage(3)
    expect(currentPage.value).toBe(3)

    // Change itemsPerPage
    itemsPerPage.value = 5
    await nextTick()
    expect(currentPage.value).toBe(1)
  })

  it('resets to page 1 when items array shrinks below current page', async () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => `item-${i + 1}`))
    const { goToPage, currentPage } = usePagination(items, { defaultPerPage: 10 })

    goToPage(3)
    expect(currentPage.value).toBe(3)

    // Shrink items to 5 (page 3 no longer exists)
    items.value = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5']
    await nextTick()
    expect(currentPage.value).toBe(1)
  })

  it('keeps page when items array changes but current page still valid', async () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => `item-${i + 1}`))
    const { goToPage, currentPage } = usePagination(items, { defaultPerPage: 10 })

    goToPage(2)
    expect(currentPage.value).toBe(2)

    // Replace items with 20 items — page 2 is still valid
    items.value = Array.from({ length: 20 }, (_, i) => `new-${i + 1}`)
    await nextTick()
    expect(currentPage.value).toBe(2)
  })

  it('computes startItem and endItem correctly', () => {
    const items = ref(Array.from({ length: 25 }, (_, i) => `item-${i + 1}`))
    const { goToPage, startItem, endItem } = usePagination(items, { defaultPerPage: 10 })

    // Page 1: showing items 1-10
    expect(startItem.value).toBe(1)
    expect(endItem.value).toBe(10)

    // Page 2: showing items 11-20
    goToPage(2)
    expect(startItem.value).toBe(11)
    expect(endItem.value).toBe(20)

    // Page 3: showing items 21-25
    goToPage(3)
    expect(startItem.value).toBe(21)
    expect(endItem.value).toBe(25)
  })

  it('uses custom defaultPerPage and perPageOptions', () => {
    const items = ref(Array.from({ length: 50 }, (_, i) => `item-${i + 1}`))
    const { totalPages, itemsPerPage, perPageOptions } = usePagination(items, {
      defaultPerPage: 20,
      perPageOptions: [10, 20, 50, 100],
    })

    expect(itemsPerPage.value).toBe(20)
    expect(totalPages.value).toBe(3) // 50 / 20 = 3 (ceil)
    expect(perPageOptions).toEqual([10, 20, 50, 100])
  })

  it('goToPage clamps to valid range', () => {
    const items = ref(Array.from({ length: 10 }, (_, i) => `item-${i + 1}`))
    const { goToPage, currentPage, totalPages } = usePagination(items, { defaultPerPage: 5 })

    expect(totalPages.value).toBe(2)
    // Page should stay at 1
    goToPage(-1)
    expect(currentPage.value).toBe(1)

    goToPage(0)
    expect(currentPage.value).toBe(1)

    goToPage(3) // beyond total pages (2)
    expect(currentPage.value).toBe(1)

    goToPage(2)
    expect(currentPage.value).toBe(2)

    goToPage(1)
    expect(currentPage.value).toBe(1)
  })
})
