import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useMenuStore } from '@/stores/menu'

const STORAGE_KEY = 'caipu-today-menu'

function stubLocalStorage() {
  const map = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v) },
    removeItem: (k: string) => { map.delete(k) },
    clear: () => map.clear()
  })
  return map
}

describe('menu store', () => {
  let storage: Map<string, string>

  beforeEach(() => {
    storage = stubLocalStorage()
    setActivePinia(createPinia())
  })

  it('addItem 去重，count 正确', () => {
    const store = useMenuStore()
    store.addItem({ id: 'a', name: '红烧肉', isCustom: false })
    store.addItem({ id: 'a', name: '红烧肉', isCustom: false })
    expect(store.count).toBe(1)
  })

  it('items 变化后写入 localStorage', async () => {
    const store = useMenuStore()
    store.addItem({ id: 'a', name: '红烧肉', isCustom: false })
    await nextTick()
    expect(JSON.parse(storage.get(STORAGE_KEY)!)).toEqual([
      { id: 'a', name: '红烧肉', isCustom: false }
    ])
  })

  it('新实例从 localStorage 恢复菜单', () => {
    storage.set(STORAGE_KEY, JSON.stringify([{ id: 'b', name: '麻婆豆腐', isCustom: false }]))
    setActivePinia(createPinia())
    const store = useMenuStore()
    expect(store.items).toEqual([{ id: 'b', name: '麻婆豆腐', isCustom: false }])
  })

  it('localStorage 数据损坏时回退为空菜单', () => {
    storage.set(STORAGE_KEY, '{not valid json')
    setActivePinia(createPinia())
    const store = useMenuStore()
    expect(store.items).toEqual([])
  })

  it('clear 清空并同步到 localStorage', async () => {
    const store = useMenuStore()
    store.addItem({ id: 'a', name: '红烧肉', isCustom: false })
    await nextTick()
    store.clear()
    await nextTick()
    expect(JSON.parse(storage.get(STORAGE_KEY)!)).toEqual([])
  })
})
