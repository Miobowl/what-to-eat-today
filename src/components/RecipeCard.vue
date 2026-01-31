<template>
  <div class="recipe-card" @click="openInNotion">
    <div class="card-content">
      <div class="recipe-name">{{ recipe.name }}</div>
      <div class="recipe-meta">
        <span v-for="cuisine in recipe.cuisines" :key="cuisine" class="tag cuisine">
          {{ cuisine }}
        </span>
        <span v-if="recipe.cookingMethod" class="tag method">
          {{ recipe.cookingMethod }}
        </span>
      </div>
    </div>
    <div class="card-arrow">
      <span class="arrow-icon">→</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'

const props = defineProps<{
  recipe: Recipe
}>()

function openInNotion() {
  window.open(props.recipe.notionUrl, '_blank')
}
</script>

<style scoped>
.recipe-card {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--cream-dark);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.recipe-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--sage);
  opacity: 0;
  transition: opacity 0.2s;
}

.recipe-card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

.recipe-card:active::before {
  opacity: 1;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.recipe-name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  letter-spacing: 0.02em;
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.tag.cuisine {
  background: var(--sage-light);
  color: var(--sage);
}

.tag.method {
  background: var(--terracotta-light);
  color: var(--terracotta);
}

.card-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--cream-dark);
  border-radius: var(--radius-full);
  margin-left: var(--space-sm);
  flex-shrink: 0;
  transition: all 0.2s;
}

.arrow-icon {
  font-size: 14px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.recipe-card:active .card-arrow {
  background: var(--sage);
}

.recipe-card:active .arrow-icon {
  color: white;
  transform: translateX(2px);
}
</style>
