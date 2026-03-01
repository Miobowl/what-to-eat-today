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

  const filteredRecipes = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()

    return recipeStore.recipes.filter(recipe => {
      // 关键词模糊匹配（菜名）
      if (keyword && !recipe.name.toLowerCase().includes(keyword)) {
        return false
      }
      // 菜系：OR 逻辑
      if (filters.value.cuisines.length > 0) {
        if (!filters.value.cuisines.some(c => recipe.cuisines.includes(c))) {
          return false
        }
      }
      // 做法：OR 逻辑
      if (filters.value.cooking_method.length > 0) {
        if (!filters.value.cooking_method.includes(recipe.cooking_method)) {
          return false
        }
      }
      // 主材料：OR 逻辑
      if (filters.value.ingredients.length > 0) {
        if (!filters.value.ingredients.some(i => recipe.ingredients.includes(i))) {
          return false
        }
      }
      // 类型：OR 逻辑
      if (filters.value.type.length > 0) {
        if (!filters.value.type.includes(recipe.type)) {
          return false
        }
      }
      // 擅长程度：OR 逻辑
      if (filters.value.proficiency.length > 0) {
        if (!filters.value.proficiency.includes(recipe.proficiency)) {
          return false
        }
      }
      return true
    })
  })

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
    toggleFilter, clearDimension, clearAll, getRandomRecipe
  }
})
