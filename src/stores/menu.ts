import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { MenuItem } from '@/types'

const STORAGE_KEY = 'caipu-today-menu'

function loadItems(): MenuItem[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i): i is MenuItem => !!i && typeof i.id === 'string' && typeof i.name === 'string'
    )
  } catch {
    return []
  }
}

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>(loadItems())

  watch(items, (value) => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // 隐私模式或存储已满时静默降级为仅内存
    }
  }, { deep: true })

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
