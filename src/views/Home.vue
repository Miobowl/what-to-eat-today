<template>
  <div class="home">
    <!-- 顶部标题 -->
    <header class="header">
      <h1>今天吃啥</h1>
      <span v-if="recipeStore.isSyncing" class="sync-status">同步中...</span>
    </header>

    <!-- 搜索栏 -->
    <SearchBar />

    <!-- 快捷入口 -->
    <div class="quick-actions">
      <button class="action-btn primary" @click="randomFromAll">
        🎲 随便吃点
      </button>
      <button
        class="action-btn"
        :class="{ active: showFavorites }"
        @click="toggleFavorites"
      >
        ⭐ 拿手菜
      </button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-area">
      <FilterSection
        title="菜系"
        :options="recipeStore.filterOptions.cuisines"
        :selected="filterStore.filters.cuisines"
        @toggle="(v) => filterStore.toggleFilter('cuisines', v)"
        @clear="filterStore.clearDimension('cuisines')"
        @random="randomFromDimension('cuisines')"
      />
      <FilterSection
        title="做法"
        :options="recipeStore.filterOptions.cookingMethods"
        :selected="filterStore.filters.cookingMethod"
        @toggle="(v) => filterStore.toggleFilter('cookingMethod', v)"
        @clear="filterStore.clearDimension('cookingMethod')"
        @random="randomFromDimension('cookingMethod')"
      />
      <FilterSection
        title="主材料"
        :options="recipeStore.filterOptions.ingredients"
        :selected="filterStore.filters.ingredients"
        @toggle="(v) => filterStore.toggleFilter('ingredients', v)"
        @clear="filterStore.clearDimension('ingredients')"
        @random="randomFromDimension('ingredients')"
      />
      <FilterSection
        title="类型"
        :options="recipeStore.filterOptions.types"
        :selected="filterStore.filters.type"
        @toggle="(v) => filterStore.toggleFilter('type', v)"
        @clear="filterStore.clearDimension('type')"
        @random="randomFromDimension('type')"
      />
    </div>

    <!-- 菜谱列表 -->
    <RecipeList :recipes="filterStore.filteredRecipes" />

    <!-- 随机结果弹窗 -->
    <RandomResult
      :visible="showRandomResult"
      :recipe="randomRecipe"
      @close="showRandomResult = false"
      @again="doRandom"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecipeStore } from '@/stores/recipes'
import { useFilterStore } from '@/stores/filter'
import type { Recipe, FilterState } from '@/types'
import SearchBar from '@/components/SearchBar.vue'
import FilterSection from '@/components/FilterSection.vue'
import RecipeList from '@/components/RecipeList.vue'
import RandomResult from '@/components/RandomResult.vue'

const recipeStore = useRecipeStore()
const filterStore = useFilterStore()

const showRandomResult = ref(false)
const randomRecipe = ref<Recipe | null>(null)
const showFavorites = ref(false)

onMounted(async () => {
  await recipeStore.initialize()
})

function doRandom() {
  randomRecipe.value = filterStore.getRandomRecipe()
  showRandomResult.value = true
}

function randomFromAll() {
  filterStore.clearAll()
  doRandom()
}

function randomFromDimension(_dimension: keyof FilterState) {
  doRandom()
}

function toggleFavorites() {
  showFavorites.value = !showFavorites.value
  if (showFavorites.value) {
    filterStore.clearAll()
    filterStore.toggleFilter('proficiency', '擅长')
  } else {
    filterStore.clearDimension('proficiency')
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 16px;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.sync-status {
  font-size: 12px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #4CAF50;
  border-color: #4CAF50;
  color: #fff;
}

.action-btn.active {
  background: #FFF3E0;
  border-color: #FF9800;
  color: #FF9800;
}

.filter-area {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}
</style>
