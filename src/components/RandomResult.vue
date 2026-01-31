<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="random-overlay" @click="$emit('close')">
        <div class="random-modal" @click.stop>
          <!-- Decorative elements -->
          <div class="modal-deco-tl"></div>
          <div class="modal-deco-br"></div>

          <!-- Content -->
          <div class="modal-header">
            <span class="header-emoji">🎉</span>
            <span class="header-text">今天就吃</span>
          </div>

          <div class="recipe-reveal">
            <div class="recipe-name">{{ recipe?.name }}</div>
            <div class="recipe-underline"></div>
          </div>

          <div class="recipe-tags">
            <span v-for="cuisine in recipe?.cuisines" :key="cuisine" class="tag cuisine">
              {{ cuisine }}
            </span>
            <span v-if="recipe?.type" class="tag type">{{ recipe.type }}</span>
            <span v-if="recipe?.cookingMethod" class="tag method">{{ recipe.cookingMethod }}</span>
          </div>

          <div class="modal-actions">
            <button class="btn-again" @click="$emit('again')">
              <span class="btn-icon">🎲</span>
              <span>换一个</span>
            </button>
            <button class="btn-go" @click="openNotion">
              <span class="btn-icon">📖</span>
              <span>看菜谱</span>
            </button>
          </div>

          <button class="close-btn" @click="$emit('close')">
            ✕
          </button>
        </div>
      </div>
    </Transition>
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
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .random-modal {
  animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .random-modal {
  animation: modalIn 0.2s ease-in reverse;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.random-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(44, 24, 16, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-md);
}

.random-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-lg);
  width: 100%;
  max-width: 320px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--cream-dark);
}

/* Decorative corners */
.modal-deco-tl,
.modal-deco-br {
  position: absolute;
  width: 80px;
  height: 80px;
  pointer-events: none;
}

.modal-deco-tl {
  top: 0;
  left: 0;
  background: radial-gradient(circle at top left, var(--mustard-light) 0%, transparent 70%);
  opacity: 0.5;
}

.modal-deco-br {
  bottom: 0;
  right: 0;
  background: radial-gradient(circle at bottom right, var(--sage-light) 0%, transparent 70%);
  opacity: 0.5;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.header-emoji {
  font-size: 24px;
  animation: float 2s ease-in-out infinite;
}

.header-text {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
}

.recipe-reveal {
  margin-bottom: var(--space-md);
  position: relative;
}

.recipe-name {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  line-height: 1.3;
  animation: revealText 0.5s ease-out 0.2s both;
}

@keyframes revealText {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recipe-underline {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--terracotta), var(--mustard));
  margin: var(--space-sm) auto 0;
  border-radius: var(--radius-full);
  animation: expandLine 0.4s ease-out 0.4s both;
}

@keyframes expandLine {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 60px;
    opacity: 1;
  }
}

.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  animation: fadeInUp 0.3s ease-out 0.5s both;
}

.tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.tag.cuisine {
  background: var(--sage-light);
  color: var(--sage);
}

.tag.type {
  background: var(--mustard-light);
  color: var(--ink-light);
}

.tag.method {
  background: var(--terracotta-light);
  color: var(--terracotta);
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  animation: fadeInUp 0.3s ease-out 0.6s both;
}

.btn-again,
.btn-go {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-again {
  background: var(--cream-dark);
  color: var(--text-secondary);
  border: 1px solid var(--cream-dark);
}

.btn-again:active {
  transform: scale(0.96);
  background: var(--cream);
}

.btn-go {
  background: linear-gradient(135deg, var(--sage) 0%, #6B8560 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(125, 148, 113, 0.3);
}

.btn-go:active {
  transform: scale(0.96);
  box-shadow: 0 1px 4px rgba(125, 148, 113, 0.2);
}

.btn-icon {
  font-size: 16px;
}

.close-btn {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-muted);
  border-radius: var(--radius-full);
  transition: all 0.2s;
}

.close-btn:active {
  background: var(--cream-dark);
  color: var(--text-secondary);
}
</style>
