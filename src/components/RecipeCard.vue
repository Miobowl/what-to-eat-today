<template>
  <div class="recipe-card" @click="openInNotion">
    <div class="recipe-name">{{ recipe.name }}</div>
    <div class="recipe-tags">
      <span v-if="recipe.type" class="tag type">{{ recipe.type }}</span>
      <span v-if="recipe.cookingMethod" class="tag method">{{ recipe.cookingMethod }}</span>
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
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:active {
  transform: scale(0.98);
}

.recipe-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.recipe-tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag.type {
  background: #E3F2FD;
  color: #1976D2;
}

.tag.method {
  background: #FFF3E0;
  color: #F57C00;
}
</style>
