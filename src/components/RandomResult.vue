<template>
  <Teleport to="body">
    <div v-if="visible" class="random-overlay" @click="$emit('close')">
      <div class="random-modal" @click.stop>
        <div class="random-title">今天吃</div>
        <div class="random-name">{{ recipe?.name }}</div>
        <div class="random-tags">
          <span v-if="recipe?.type" class="tag">{{ recipe.type }}</span>
          <span v-if="recipe?.cookingMethod" class="tag">{{ recipe.cookingMethod }}</span>
        </div>
        <div class="random-actions">
          <button class="btn-again" @click="$emit('again')">再来一个</button>
          <button class="btn-go" @click="openNotion">查看菜谱</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'

const props = defineProps<{
  visible: boolean
  recipe: Recipe | null
}>()

defineEmits<{
  close: []
  again: []
}>()

function openNotion() {
  if (props.recipe) {
    window.open(props.recipe.notionUrl, '_blank')
  }
}
</script>

<style scoped>
.random-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.random-modal {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  width: 80%;
  max-width: 320px;
  text-align: center;
}

.random-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 16px;
}

.random-name {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.random-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.tag {
  font-size: 14px;
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #666;
}

.random-actions {
  display: flex;
  gap: 12px;
}

.btn-again, .btn-go {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}

.btn-again {
  background: #f5f5f5;
  color: #333;
}

.btn-go {
  background: #4CAF50;
  color: #fff;
}
</style>
