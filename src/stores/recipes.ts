import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { fetchAllRecipes } from '@/api/recipes'
import type { Recipe } from '@/types/recipe'

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const filterOptions = computed(() => {
    const cuisineSet = new Set<string>()
    const methodSet = new Set<string>()
    const ingredientSet = new Set<string>()
    const typeSet = new Set<string>()
    const proficiencySet = new Set<string>()

    for (const recipe of recipes.value) {
      recipe.cuisines.forEach(c => cuisineSet.add(c))
      if (recipe.cooking_method) methodSet.add(recipe.cooking_method)
      recipe.ingredients.forEach(i => ingredientSet.add(i))
      if (recipe.type) typeSet.add(recipe.type)
      if (recipe.proficiency) proficiencySet.add(recipe.proficiency)
    }

    // 主材料优先排序：常用肉类和豆腐排在前面
    const ingredientPriority = ['牛', '猪', '羊', '鸡', '豆腐']
    const sortedIngredients = [...ingredientSet].sort((a, b) => {
      const aPriority = ingredientPriority.findIndex(p => a.includes(p))
      const bPriority = ingredientPriority.findIndex(p => b.includes(p))
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority
      if (aPriority !== -1) return -1
      if (bPriority !== -1) return 1
      return a.localeCompare(b, 'zh-CN')
    })

    return {
      cuisines: [...cuisineSet].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      cookingMethods: [...methodSet].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      ingredients: sortedIngredients,
      types: [...typeSet].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      proficiencies: [...proficiencySet].sort((a, b) => a.localeCompare(b, 'zh-CN'))
    }
  })

  async function fetchRecipes() {
    isLoading.value = true
    error.value = null
    try {
      recipes.value = await fetchAllRecipes()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载菜谱失败'
      console.error('加载菜谱失败:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function initialize() {
    await fetchRecipes()
  }

  return {
    recipes,
    isLoading,
    error,
    filterOptions,
    fetchRecipes,
    initialize
  }
})
