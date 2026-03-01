<script setup lang="ts">
import type { RecipeIngredient } from '@/types/recipe'

defineProps<{
  ingredients: RecipeIngredient[]
}>()
</script>

<template>
  <section class="ingredient-list" v-if="ingredients.length > 0">
    <h3 class="section-title">食材清单</h3>
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
.section-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: var(--space-sm);
}

.ingredients {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredient-item {
  display: flex;
  align-items: baseline;
  padding: var(--space-xs) 0;
  font-size: 0.95rem;
  color: var(--ink-light);
}

.ingredient-name {
  flex-shrink: 0;
}

.ingredient-dots {
  flex: 1;
  border-bottom: 1px dotted var(--cream-dark);
  margin: 0 var(--space-sm);
  min-width: 20px;
}

.ingredient-amount {
  flex-shrink: 0;
  color: var(--terracotta);
}
</style>
