<template>
  <div class="home">
    <!-- 餐牌头 -->
    <header class="masthead">
      <h1 class="masthead-title">今天吃啥</h1>
      <p class="masthead-sub">私房菜单 · 共 {{ recipeStore.recipes.length }} 道</p>
      <div class="masthead-rule" aria-hidden="true"></div>
    </header>

    <!-- 抽签入口 -->
    <button class="draw-hero" @click="doDraw">
      <AppIcon name="dice" :size="26" class="hero-dice" />
      <span class="hero-text">
        <span class="hero-title">随便吃点</span>
        <span class="hero-sub">拿不定主意，交给骰子</span>
      </span>
    </button>

    <!-- 工具行: 搜索 / 拿手菜 / 筛选 -->
    <div class="toolbar">
      <SearchBar />
      <button class="tool-chip" :class="{ on: bestOn }" @click="toggleBest">
        拿手菜
      </button>
      <button class="tool-filter" @click="showSheet = true">
        <AppIcon name="filter" :size="16" />
        筛选
        <span v-if="activeCount > 0" class="filter-badge">{{ activeCount }}</span>
      </button>
    </div>

    <!-- 已选条件 chips -->
    <div v-if="activeChips.length > 0" class="chips">
      <button
        v-for="chip in activeChips"
        :key="`${chip.dimension}-${chip.value}`"
        class="chip"
        @click="filterStore.toggleFilter(chip.dimension, chip.value)"
      >
        {{ chip.value }}
        <AppIcon name="x" :size="11" />
      </button>
      <button class="chip-clear" @click="filterStore.clearAll()">清空</button>
    </div>

    <!-- 菜单列表 -->
    <div v-if="recipeStore.isLoading" class="list-status">
      <p>菜谱加载中…</p>
    </div>
    <div v-else-if="recipeStore.error" class="list-status">
      <p>{{ recipeStore.error }}</p>
      <button class="retry-btn" @click="recipeStore.fetchRecipes()">重试</button>
    </div>
    <RecipeList v-else :recipes="filterStore.filteredRecipes" />

    <FilterSheet :visible="showSheet" @close="showSheet = false" />

    <DrawOverlay
      :visible="showDraw"
      :recipe="drawnRecipe"
      :reel-names="reelNames"
      :roll-id="rollId"
      @close="showDraw = false"
      @again="doDraw"
    />

    <MenuBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRecipeStore } from '@/stores/recipes'
import { useFilterStore } from '@/stores/filter'
import type { Recipe, FilterState } from '@/types'
import AppIcon from '@/components/AppIcon.vue'
import SearchBar from '@/components/SearchBar.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import RecipeList from '@/components/RecipeList.vue'
import DrawOverlay from '@/components/DrawOverlay.vue'
import MenuBar from '@/components/MenuBar.vue'

const recipeStore = useRecipeStore()
const filterStore = useFilterStore()

const showSheet = ref(false)
const showDraw = ref(false)
const drawnRecipe = ref<Recipe | null>(null)
const reelNames = ref<string[]>([])
const rollId = ref(0)

const DIMENSIONS: (keyof FilterState)[] = ['type', 'cuisines', 'cooking_method', 'ingredients', 'proficiency']

const activeCount = computed(() =>
  DIMENSIONS.reduce((sum, dim) => sum + filterStore.filters[dim].length, 0)
)

interface ActiveChip {
  dimension: keyof FilterState
  value: string
}

const activeChips = computed<ActiveChip[]>(() =>
  DIMENSIONS.flatMap(dimension =>
    filterStore.filters[dimension].map(value => ({ dimension, value }))
  )
)

const bestOn = computed(() => filterStore.filters.proficiency.includes('拿手菜'))

onMounted(async () => {
  await recipeStore.initialize()
})

function toggleBest() {
  filterStore.toggleFilter('proficiency', '拿手菜')
}

function doDraw() {
  const recipe = filterStore.getRandomRecipe()
  drawnRecipe.value = recipe

  if (recipe) {
    const others = filterStore.filteredRecipes
      .filter(r => r.id !== recipe.id)
      .map(r => r.name)
    // 打乱后取一段做滚轴，结尾落在抽中的菜上
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[others[i], others[j]] = [others[j], others[i]]
    }
    reelNames.value = [...others.slice(0, 13), recipe.name]
  } else {
    reelNames.value = []
  }

  rollId.value++
  showDraw.value = true
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-md);
  padding-top: calc(var(--space-md) + env(safe-area-inset-top));
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

/* 餐牌头 */
.masthead {
  text-align: center;
  padding: var(--space-sm) 0 var(--space-md);
  animation: fadeInUp 0.5s var(--ease-out);
}

.masthead-title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  color: var(--ink);
  line-height: 1.2;
}

.masthead-sub {
  margin-top: 2px;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.masthead-rule {
  margin-top: var(--space-md);
  height: 4px;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

/* 抽签入口 */
.draw-hero {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  min-height: 60px;
  padding: var(--space-sm) var(--space-md);
  background: var(--seal);
  border-radius: var(--radius-sm);
  color: white;
  margin-bottom: var(--space-md);
  transition: transform 0.15s, background-color 0.15s;
  animation: fadeInUp 0.5s var(--ease-out) 0.05s both;
}

.draw-hero:active {
  transform: scale(0.98);
  background: var(--seal-deep);
}

.hero-dice {
  flex-shrink: 0;
}

.hero-text {
  display: flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2px var(--space-sm);
}

.hero-title {
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.1em;
}

.hero-sub {
  font-size: 12px;
  color: oklch(0.95 0.02 50 / 0.85);
}

/* 工具行 */
.toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  animation: fadeInUp 0.5s var(--ease-out) 0.1s both;
}

.tool-chip {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  transition: color 0.15s, border-color 0.15s, background-color 0.15s, transform 0.15s;
}

.tool-chip:active {
  transform: scale(0.95);
}

.tool-chip.on {
  border-color: var(--seal);
  box-shadow: inset 0 0 0 0.5px var(--seal);
  color: var(--seal);
  background: var(--seal-wash);
}

.tool-filter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--ink-3);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
  transition: transform 0.15s, background-color 0.15s;
  position: relative;
}

.tool-filter:active {
  transform: scale(0.95);
  background: var(--paper-dim);
}

.filter-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  background: var(--seal);
  color: white;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 已选 chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--space-sm);
}

.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  background: var(--seal-wash);
  border: 1px solid oklch(0.55 0.13 35 / 0.35);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--seal);
  transition: transform 0.15s;
  animation: fadeIn 0.2s ease-out;
}

.chip:active {
  transform: scale(0.95);
}

.chip-clear {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--ink-3);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 加载/错误 */
.list-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xl) var(--space-md);
  color: var(--ink-3);
  font-size: 14px;
  text-align: center;
}

.retry-btn {
  padding: 8px 24px;
  background: var(--seal);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.15s, background-color 0.15s;
}

.retry-btn:active {
  transform: scale(0.96);
  background: var(--seal-deep);
}
</style>
