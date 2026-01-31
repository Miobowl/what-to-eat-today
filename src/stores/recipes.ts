import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Recipe } from '@/types'
import { getAllRecipes, saveRecipes } from '@/db/recipes'
import { getLastSyncTime, setLastSyncTime, shouldSync } from '@/db/sync'
import { fetchRecipesFromNotion } from '@/api/notion'
import { transformAllRecipes } from '@/api/transform'

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number | null>(null)
  const error = ref<string | null>(null)

  async function loadFromDB() {
    isLoading.value = true
    try {
      recipes.value = await getAllRecipes()
      lastSyncTime.value = await getLastSyncTime()
    } catch (e) {
      error.value = '加载本地数据失败'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  async function syncFromNotion() {
    if (isSyncing.value) return
    isSyncing.value = true
    error.value = null
    try {
      const notionRecipes = await fetchRecipesFromNotion()
      const transformed = transformAllRecipes(notionRecipes)
      await saveRecipes(transformed)
      await setLastSyncTime(Date.now())
      recipes.value = transformed
      lastSyncTime.value = Date.now()
      console.log(`同步完成，共 ${transformed.length} 条菜谱`)
    } catch (e) {
      error.value = '同步失败，将使用本地缓存'
      console.error(e)
    } finally {
      isSyncing.value = false
    }
  }

  async function initialize() {
    await loadFromDB()
    if (await shouldSync()) {
      syncFromNotion()
    }
  }

  const filterOptions = computed(() => {
    const cuisines = new Set<string>()
    const cookingMethods = new Set<string>()
    const ingredients = new Set<string>()
    const types = new Set<string>()
    const proficiencies = new Set<string>()

    recipes.value.forEach(recipe => {
      recipe.cuisines.forEach(c => cuisines.add(c))
      if (recipe.cookingMethod) cookingMethods.add(recipe.cookingMethod)
      recipe.ingredients.forEach(i => ingredients.add(i))
      if (recipe.type) types.add(recipe.type)
      if (recipe.proficiency) proficiencies.add(recipe.proficiency)
    })

    return {
      cuisines: Array.from(cuisines).sort(),
      cookingMethods: Array.from(cookingMethods).sort(),
      ingredients: Array.from(ingredients).sort(),
      types: Array.from(types).sort(),
      proficiencies: Array.from(proficiencies).sort()
    }
  })

  return {
    recipes, isLoading, isSyncing, lastSyncTime, error, filterOptions,
    loadFromDB, syncFromNotion, initialize
  }
})
