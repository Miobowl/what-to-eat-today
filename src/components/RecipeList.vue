<template>
  <div class="recipe-list">
    <div v-if="recipes.length === 0" class="empty">
      <span class="empty-title">没有找到符合条件的菜</span>
      <span class="empty-hint">试试调整筛选条件</span>
    </div>

    <template v-else>
      <section v-for="group in groups" :key="group.type" class="menu-section">
        <div class="section-head">
          <span class="head-line"></span>
          <span class="head-text">{{ group.type }}<span class="head-count"> · {{ group.recipes.length }}</span></span>
          <span class="head-line"></span>
        </div>
        <RecipeCard
          v-for="item in group.recipes"
          :key="item.recipe.id"
          :recipe="item.recipe"
          :number="item.number"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Recipe } from '@/types'
import RecipeCard from './RecipeCard.vue'

const props = defineProps<{
  recipes: Recipe[]
}>()

const TYPE_ORDER = ['主菜', '小荤', '素菜', '蔬菜', '汤', '主食']

interface NumberedRecipe {
  recipe: Recipe
  number: number
}

interface RecipeGroup {
  type: string
  recipes: NumberedRecipe[]
}

const groups = computed<RecipeGroup[]>(() => {
  const byType = new Map<string, Recipe[]>()
  for (const recipe of props.recipes) {
    const type = recipe.type || '其他'
    const list = byType.get(type) ?? []
    list.push(recipe)
    byType.set(type, list)
  }

  const orderedTypes = [...byType.keys()].sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a)
    const bi = TYPE_ORDER.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b, 'zh-CN')
  })

  let counter = 0
  return orderedTypes.map(type => ({
    type,
    recipes: (byType.get(type) ?? []).map(recipe => ({ recipe, number: ++counter }))
  }))
})
</script>

<style scoped>
.recipe-list {
  animation: fadeInUp 0.4s var(--ease-out) both;
}

.menu-section + .menu-section {
  margin-top: var(--space-lg);
}

.section-head {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xs);
}

.head-line {
  flex: 1;
  height: 1px;
  background: var(--rule);
}

.head-text {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.2em;
  text-indent: 0.2em;
  color: var(--ink-2);
  white-space: nowrap;
}

.head-count {
  font-size: 12px;
  letter-spacing: 0;
  text-indent: 0;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  gap: var(--space-xs);
}

.empty-title {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--ink-2);
}

.empty-hint {
  font-size: 13px;
  color: var(--ink-3);
}
</style>
