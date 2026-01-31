<template>
  <div class="recipe-card">
    <div class="card-content" @click="openInNotion">
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
    <div class="card-actions">
      <button class="action-btn goto-btn" @click="openInNotion" title="查看菜谱">
        <span class="arrow-icon">→</span>
      </button>
      <button
        class="action-btn order-btn"
        :class="{ added: justAdded, disabled: isInMenu }"
        :disabled="isInMenu"
        @click="addToMenu"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Recipe } from '@/types'
import { useMenuStore } from '@/stores/menu'

const props = defineProps<{
  recipe: Recipe
}>()

const menuStore = useMenuStore()
const justAdded = ref(false)

const isInMenu = computed(() => menuStore.hasItem(props.recipe.id))
const buttonText = computed(() => {
  if (justAdded.value) return '已点'
  if (isInMenu.value) return '已点'
  return '点菜'
})

function openInNotion() {
  window.open(props.recipe.notionUrl, '_blank')
}

function addToMenu() {
  if (isInMenu.value) return

  menuStore.addItem({
    id: props.recipe.id,
    name: props.recipe.name,
    isCustom: false
  })

  justAdded.value = true
  setTimeout(() => {
    justAdded.value = false
  }, 500)
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

.recipe-card:active::before {
  opacity: 1;
}

.card-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.card-content:active {
  opacity: 0.7;
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

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: var(--space-sm);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  transition: all 0.2s;
}

.goto-btn {
  width: 28px;
  height: 28px;
  background: var(--cream-dark);
}

.goto-btn:active {
  background: var(--sage);
}

.goto-btn:active .arrow-icon {
  color: white;
  transform: translateX(2px);
}

.arrow-icon {
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.2s;
}

.order-btn {
  padding: 6px 12px;
  background: var(--mustard);
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.order-btn:active {
  transform: scale(0.95);
  background: var(--mustard-light);
  color: var(--ink);
}

.order-btn.added {
  background: var(--sage);
}

.order-btn.disabled {
  background: var(--cream-dark);
  color: var(--text-muted);
  cursor: default;
}

.order-btn.disabled:active {
  transform: none;
}
</style>
