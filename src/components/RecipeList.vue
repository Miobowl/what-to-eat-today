<template>
  <div class="recipe-list">
    <div class="list-header">
      <div class="header-line"></div>
      <span class="header-text">
        <span class="header-icon">📋</span>
        共 {{ recipes.length }} 道菜
      </span>
      <div class="header-line"></div>
    </div>
    <div class="list-content">
      <TransitionGroup name="recipe">
        <RecipeCard
          v-for="(recipe, index) in recipes"
          :key="recipe.id"
          :recipe="recipe"
          :style="{ animationDelay: `${index * 0.05}s` }"
        />
      </TransitionGroup>
      <div v-if="recipes.length === 0" class="empty">
        <span class="empty-icon">🍽️</span>
        <span class="empty-text">没有找到符合条件的菜品</span>
        <span class="empty-hint">试试调整筛选条件</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'
import RecipeCard from './RecipeCard.vue'

defineProps<{
  recipes: Recipe[]
}>()
</script>

<style scoped>
.recipe-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  animation: fadeInUp 0.5s ease-out 0.3s both;
}

.list-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  margin-bottom: var(--space-sm);
}

.header-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--cream-dark), transparent);
}

.header-text {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.header-icon {
  font-size: 14px;
}

.list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  overflow-y: auto;
  padding-bottom: calc(var(--space-xl) * 2 + env(safe-area-inset-bottom));
}

/* Recipe card animation */
.recipe-enter-active {
  animation: fadeInUp 0.3s ease-out both;
}

.recipe-leave-active {
  animation: fadeInUp 0.2s ease-in reverse both;
}

.recipe-move {
  transition: transform 0.3s ease;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

.empty-text {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
