import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem } from '@/types'

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>([])

  const isEmpty = computed(() => items.value.length === 0)
  const count = computed(() => items.value.length)

  function addItem(item: MenuItem) {
    // 避免重复添加
    if (items.value.some(i => i.id === item.id)) return
    items.value.push(item)
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function hasItem(id: string): boolean {
    return items.value.some(i => i.id === id)
  }

  function clear() {
    items.value = []
  }

  function addCustomDish(name: string) {
    const id = `custom-${Date.now()}`
    items.value.push({ id, name, isCustom: true })
  }

  return {
    items,
    isEmpty,
    count,
    addItem,
    removeItem,
    hasItem,
    clear,
    addCustomDish
  }
})
