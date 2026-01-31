<template>
  <div class="home">
    <!-- Decorative elements -->
    <div class="deco-top-left"></div>
    <div class="deco-top-right"></div>

    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="brand">
          <span class="brand-icon">🍳</span>
          <h1>今天吃啥</h1>
        </div>
        <div v-if="recipeStore.isSyncing" class="sync-badge">
          <span class="sync-dot"></span>
          同步中
        </div>
      </div>
      <p class="tagline">翻开菜谱，开启美味</p>
    </header>

    <!-- Hero Action -->
    <div class="hero-action">
      <button class="random-hero" @click="randomFromAll">
        <span class="dice" :class="{ rolling: isRolling }">🎲</span>
        <span class="hero-text">
          <span class="hero-title">随便吃点</span>
          <span class="hero-sub">让命运决定今天的美味</span>
        </span>
      </button>
    </div>

    <!-- Quick Actions -->
    <div class="quick-row">
      <button
        class="quick-btn"
        :class="{ active: showFavorites }"
        @click="toggleFavorites"
      >
        <span class="quick-icon">👨‍🍳</span>
        <span>拿手菜</span>
      </button>
      <SearchBar />
    </div>

    <!-- Filter Summary Bar (fixed) -->
    <FilterSummaryBar
      @random="doRandom"
      @scroll-to-results="scrollToResults"
    />
    <!-- Spacer for fixed summary bar -->
    <div v-if="hasActiveFilters" class="summary-bar-spacer"></div>

    <!-- Filter Sections -->
    <div class="filters-container">
      <FilterSection
        title="类型"
        icon="🍽️"
        :options="recipeStore.filterOptions.types"
        :selected="filterStore.filters.type"
        @toggle="(v) => filterStore.toggleFilter('type', v)"
        @clear="filterStore.clearDimension('type')"
        @random="() => randomWithFilter('type')"
      />
      <FilterSection
        title="菜系"
        icon="🌍"
        :options="recipeStore.filterOptions.cuisines"
        :selected="filterStore.filters.cuisines"
        @toggle="(v) => filterStore.toggleFilter('cuisines', v)"
        @clear="filterStore.clearDimension('cuisines')"
        @random="() => randomWithFilter('cuisines')"
      />
      <FilterSection
        title="做法"
        icon="🔥"
        :options="recipeStore.filterOptions.cookingMethods"
        :selected="filterStore.filters.cookingMethod"
        @toggle="(v) => filterStore.toggleFilter('cookingMethod', v)"
        @clear="filterStore.clearDimension('cookingMethod')"
        @random="() => randomWithFilter('cookingMethod')"
      />
      <FilterSection
        title="主材料"
        icon="🥬"
        :options="recipeStore.filterOptions.ingredients"
        :selected="filterStore.filters.ingredients"
        @toggle="(v) => filterStore.toggleFilter('ingredients', v)"
        @clear="filterStore.clearDimension('ingredients')"
        @random="() => randomWithFilter('ingredients')"
      />
    </div>

    <!-- Recipe List -->
    <div ref="recipeListRef">
      <RecipeList :recipes="filterStore.filteredRecipes" />
    </div>

    <!-- Random Result Modal -->
    <RandomResult
      :visible="showRandomResult"
      :recipe="randomRecipe"
      @close="showRandomResult = false"
      @again="doRandom"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRecipeStore } from '@/stores/recipes'
import { useFilterStore } from '@/stores/filter'
import type { Recipe, FilterState } from '@/types'
import SearchBar from '@/components/SearchBar.vue'
import FilterSection from '@/components/FilterSection.vue'
import FilterSummaryBar from '@/components/FilterSummaryBar.vue'
import RecipeList from '@/components/RecipeList.vue'
import RandomResult from '@/components/RandomResult.vue'

const recipeStore = useRecipeStore()
const filterStore = useFilterStore()

const showRandomResult = ref(false)
const randomRecipe = ref<Recipe | null>(null)
const showFavorites = ref(false)
const isRolling = ref(false)
const recipeListRef = ref<HTMLElement | null>(null)

const hasActiveFilters = computed(() => {
  const f = filterStore.filters
  return f.cuisines.length > 0 ||
         f.cookingMethod.length > 0 ||
         f.ingredients.length > 0 ||
         f.type.length > 0 ||
         f.proficiency.length > 0
})

onMounted(async () => {
  await recipeStore.initialize()
})

function doRandom() {
  randomRecipe.value = filterStore.getRandomRecipe()
  showRandomResult.value = true
}

function randomFromAll() {
  isRolling.value = true

  setTimeout(() => {
    isRolling.value = false
    doRandom()
  }, 600)
}

function randomWithFilter(_dimension: keyof FilterState) {
  isRolling.value = true
  setTimeout(() => {
    isRolling.value = false
    doRandom()
  }, 600)
}

function toggleFavorites() {
  showFavorites.value = !showFavorites.value
  if (showFavorites.value) {
    filterStore.clearAll()
    filterStore.toggleFilter('proficiency', '拿手菜')
  } else {
    filterStore.clearDimension('proficiency')
  }
}

function scrollToResults() {
  recipeListRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: var(--space-md);
  padding-bottom: calc(var(--space-xl) + env(safe-area-inset-bottom));
  position: relative;
  overflow-x: hidden;
}

/* Decorative corners */
.deco-top-left,
.deco-top-right {
  position: absolute;
  width: 120px;
  height: 120px;
  pointer-events: none;
  opacity: 0.15;
}

.deco-top-left {
  top: 0;
  left: 0;
  background: radial-gradient(circle at top left, var(--terracotta) 0%, transparent 70%);
}

.deco-top-right {
  top: 0;
  right: 0;
  background: radial-gradient(circle at top right, var(--sage) 0%, transparent 70%);
}

/* Header */
.header {
  text-align: center;
  margin-bottom: var(--space-lg);
  animation: fadeInUp 0.6s ease-out;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xs);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.brand-icon {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
}

.header h1 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  color: var(--text-primary);
  letter-spacing: 0.1em;
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--cream-dark);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-muted);
}

.sync-dot {
  width: 6px;
  height: 6px;
  background: var(--sage);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.tagline {
  font-size: 14px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

/* Hero Action */
.hero-action {
  margin-bottom: var(--space-lg);
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.random-hero {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--terracotta) 0%, #A84832 100%);
  border-radius: var(--radius-lg);
  color: white;
  text-align: left;
  box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.random-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.random-hero:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

.dice {
  font-size: 48px;
  position: relative;
  z-index: 1;
  transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.dice.rolling {
  animation: roll 0.6s ease-out;
}

.hero-text {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.05em;
}

.hero-sub {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 2px;
}

/* Quick Row */
.quick-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  height: 40px;
  background: var(--bg-card);
  border: 2px solid var(--cream-dark);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.quick-btn:active {
  transform: scale(0.96);
}

.quick-btn.active {
  background: var(--mustard-light);
  border-color: var(--mustard);
  color: var(--ink);
}

.quick-icon {
  font-size: 18px;
}

/* Summary Bar Spacer */
.summary-bar-spacer {
  height: 52px;
  margin-bottom: var(--space-sm);
}

/* Filters Container */
.filters-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
</style>
