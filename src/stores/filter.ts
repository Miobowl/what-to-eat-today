import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterState, Recipe } from '@/types'
import { useRecipeStore } from './recipes'

export const useFilterStore = defineStore('filter', () => {
  const filters = ref<FilterState>({
    cuisines: [],
    cooking_method: [],
    ingredients: [],
    type: [],
    proficiency: []
  })

  const searchKeyword = ref('')

  const recipeStore = useRecipeStore()

  // 各维度内部 OR，维度之间 AND；skip 指定的维度不参与判断（供维度随机使用）
  function matchesFilters(recipe: Recipe, skip?: keyof FilterState): boolean {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (keyword && !recipe.name.toLowerCase().includes(keyword)) {
      return false
    }
    const f = filters.value
    if (skip !== 'cuisines' && f.cuisines.length > 0 && !f.cuisines.some(c => recipe.cuisines.includes(c))) {
      return false
    }
    if (skip !== 'cooking_method' && f.cooking_method.length > 0 && !f.cooking_method.includes(recipe.cooking_method)) {
      return false
    }
    if (skip !== 'ingredients' && f.ingredients.length > 0 && !f.ingredients.some(i => recipe.ingredients.includes(i))) {
      return false
    }
    if (skip !== 'type' && f.type.length > 0 && !f.type.includes(recipe.type)) {
      return false
    }
    if (skip !== 'proficiency' && f.proficiency.length > 0 && !f.proficiency.includes(recipe.proficiency)) {
      return false
    }
    return true
  }

  const filteredRecipes = computed(() =>
    recipeStore.recipes.filter(recipe => matchesFilters(recipe))
  )

  function dimensionValues(recipe: Recipe, dimension: keyof FilterState): string[] {
    switch (dimension) {
      case 'cuisines': return recipe.cuisines
      case 'ingredients': return recipe.ingredients
      case 'cooking_method': return recipe.cooking_method ? [recipe.cooking_method] : []
      case 'type': return recipe.type ? [recipe.type] : []
      case 'proficiency': return recipe.proficiency ? [recipe.proficiency] : []
    }
  }

  // 在该维度随机锁定一个选项，只从与其他维度已选条件兼容的选项里挑，保证筛选结果非空
  function randomizeDimension(dimension: keyof FilterState) {
    const candidates = new Set<string>()
    for (const recipe of recipeStore.recipes) {
      if (matchesFilters(recipe, dimension)) {
        dimensionValues(recipe, dimension).forEach(v => candidates.add(v))
      }
    }
    if (candidates.size === 0) return
    const values = [...candidates]
    filters.value[dimension] = [values[Math.floor(Math.random() * values.length)]]
  }

  function toggleFilter(dimension: keyof FilterState, value: string) {
    const arr = filters.value[dimension]
    const index = arr.indexOf(value)
    if (index === -1) {
      arr.push(value)
    } else {
      arr.splice(index, 1)
    }
  }

  function clearDimension(dimension: keyof FilterState) {
    filters.value[dimension] = []
  }

  function clearAll() {
    filters.value = {
      cuisines: [], cooking_method: [], ingredients: [], type: [], proficiency: []
    }
    searchKeyword.value = ''
  }

  function getRandomRecipe(): Recipe | null {
    const recipes = filteredRecipes.value
    if (recipes.length === 0) return null
    const index = Math.floor(Math.random() * recipes.length)
    return recipes[index]
  }

  return {
    filters, filteredRecipes, searchKeyword,
    toggleFilter, clearDimension, clearAll, getRandomRecipe, randomizeDimension
  }
})
