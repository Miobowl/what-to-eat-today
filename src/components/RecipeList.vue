<template>
  <div class="recipe-list">
    <div class="list-header">
      <span>共 {{ recipes.length }} 道菜</span>
    </div>
    <div class="list-content">
      <RecipeCard
        v-for="recipe in recipes"
        :key="recipe.id"
        :recipe="recipe"
      />
      <div v-if="recipes.length === 0" class="empty">
        没有找到符合条件的菜品
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
}

.list-header {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-bottom: 80px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>
