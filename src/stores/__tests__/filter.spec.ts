import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFilterStore } from '@/stores/filter'
import { useRecipeStore } from '@/stores/recipes'
import type { Recipe } from '@/types'

function makeRecipe(overrides: Partial<Recipe> & { id: string; name: string }): Recipe {
  return {
    cuisines: [],
    cooking_method: '',
    ingredients: [],
    type: '',
    proficiency: '',
    cooking_time: null,
    difficulty: '',
    tips: '',
    cover_image: '',
    external_url: '',
    notion_url: '',
    created_at: '',
    updated_at: '',
    ...overrides
  }
}

const recipes: Recipe[] = [
  makeRecipe({ id: '1', name: '红烧肉', cuisines: ['本帮菜'], cooking_method: '炖', ingredients: ['猪肉'], type: '荤菜', proficiency: '拿手菜' }),
  makeRecipe({ id: '2', name: '清蒸鲈鱼', cuisines: ['粤菜'], cooking_method: '蒸', ingredients: ['鱼'], type: '荤菜', proficiency: '做过，还行' }),
  makeRecipe({ id: '3', name: '麻婆豆腐', cuisines: ['川菜'], cooking_method: '炒', ingredients: ['豆腐'], type: '素菜', proficiency: '拿手菜' }),
  makeRecipe({ id: '4', name: '水煮牛肉', cuisines: ['川菜'], cooking_method: '煮', ingredients: ['牛肉'], type: '荤菜', proficiency: '做过，不大行' })
]

describe('filter store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useRecipeStore().recipes = recipes
  })

  it('无筛选条件时返回全部菜谱', () => {
    const store = useFilterStore()
    expect(store.filteredRecipes).toHaveLength(4)
  })

  it('同一维度内为 OR 逻辑', () => {
    const store = useFilterStore()
    store.toggleFilter('cuisines', '粤菜')
    store.toggleFilter('cuisines', '川菜')
    expect(store.filteredRecipes.map(r => r.id).sort()).toEqual(['2', '3', '4'])
  })

  it('维度之间为 AND 逻辑', () => {
    const store = useFilterStore()
    store.toggleFilter('cuisines', '川菜')
    store.toggleFilter('type', '荤菜')
    expect(store.filteredRecipes.map(r => r.id)).toEqual(['4'])
  })

  it('关键词模糊匹配菜名，且与筛选条件叠加', () => {
    const store = useFilterStore()
    store.searchKeyword = '豆腐'
    expect(store.filteredRecipes.map(r => r.id)).toEqual(['3'])
    store.toggleFilter('type', '荤菜')
    expect(store.filteredRecipes).toHaveLength(0)
  })

  it('toggleFilter 再次调用同一值时取消选中', () => {
    const store = useFilterStore()
    store.toggleFilter('type', '素菜')
    expect(store.filters.type).toEqual(['素菜'])
    store.toggleFilter('type', '素菜')
    expect(store.filters.type).toEqual([])
  })

  it('clearAll 重置所有筛选和关键词', () => {
    const store = useFilterStore()
    store.toggleFilter('cuisines', '川菜')
    store.searchKeyword = '牛'
    store.clearAll()
    expect(store.filters.cuisines).toEqual([])
    expect(store.searchKeyword).toBe('')
    expect(store.filteredRecipes).toHaveLength(4)
  })

  it('getRandomRecipe 在筛选结果为空时返回 null', () => {
    const store = useFilterStore()
    store.searchKeyword = '不存在的菜'
    expect(store.getRandomRecipe()).toBeNull()
  })

  it('getRandomRecipe 返回的菜在筛选结果内', () => {
    const store = useFilterStore()
    store.toggleFilter('cuisines', '川菜')
    const recipe = store.getRandomRecipe()
    expect(recipe).not.toBeNull()
    expect(['3', '4']).toContain(recipe!.id)
  })

  it('randomizeDimension 只从与其他条件兼容的选项中选择', () => {
    const store = useFilterStore()
    store.toggleFilter('type', '素菜')
    store.randomizeDimension('cuisines')
    // 唯一的素菜是川菜的麻婆豆腐，随机结果必然是川菜
    expect(store.filters.cuisines).toEqual(['川菜'])
    expect(store.filteredRecipes.length).toBeGreaterThan(0)
  })

  it('randomizeDimension 替换该维度的已有选择', () => {
    const store = useFilterStore()
    store.toggleFilter('cuisines', '粤菜')
    store.toggleFilter('cuisines', '本帮菜')
    store.randomizeDimension('cuisines')
    expect(store.filters.cuisines).toHaveLength(1)
  })

  it('randomizeDimension 在没有兼容选项时不修改筛选', () => {
    const store = useFilterStore()
    store.searchKeyword = '不存在的菜'
    store.randomizeDimension('cuisines')
    expect(store.filters.cuisines).toEqual([])
  })
})
