<script setup lang="ts">
import type { RecipeIngredient } from '@/types/recipe'

defineProps<{
  ingredients: RecipeIngredient[]
}>()
</script>

<template>
  <section class="ingredient-list" v-if="ingredients.length > 0">
    <div class="section-head">
      <span class="head-line"></span>
      <h3 class="head-text">食材</h3>
      <span class="head-line"></span>
    </div>
    <ul class="ingredients">
      <li v-for="item in ingredients" :key="item.id" class="ingredient-item">
        <span class="ingredient-name">{{ item.name }}</span>
        <span class="ingredient-dots"></span>
        <span class="ingredient-amount">{{ item.amount }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ingredient-list {
  margin-bottom: var(--space-lg);
}

.section-head {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.head-line {
  flex: 1;
  height: 1px;
  background: var(--rule);
}

.head-text {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: var(--ink-2);
}

.ingredients {
  list-style: none;
}

.ingredient-item {
  display: flex;
  align-items: baseline;
  padding: 6px 0;
  font-size: 14px;
  color: var(--ink);
}

.ingredient-name {
  flex-shrink: 0;
}

.ingredient-dots {
  flex: 1;
  border-bottom: 1px dotted var(--rule);
  margin: 0 var(--space-sm);
  min-width: 20px;
}

.ingredient-amount {
  flex-shrink: 0;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}
</style>
