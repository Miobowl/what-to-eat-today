<template>
  <div class="filter-section">
    <div class="filter-header">
      <div class="filter-title-group">
        <span class="filter-icon">{{ icon }}</span>
        <span class="filter-title">{{ title }}</span>
        <span v-if="selectedCount > 0" class="selected-count">{{ selectedCount }}</span>
      </div>
      <div class="filter-actions">
        <button
          v-if="selectedCount > 0"
          class="clear-btn"
          @click="$emit('clear')"
        >
          清除
        </button>
        <button class="random-btn" @click="handleRandom">
          <span class="random-dice" :class="{ shake: isShaking }">🎲</span>
        </button>
      </div>
    </div>
    <div class="filter-tags-wrapper">
      <div class="filter-tags">
        <FilterTag
          v-for="(option, index) in options"
          :key="option"
          :label="option"
          :is-active="selected.includes(option)"
          :style="{ animationDelay: `${index * 0.03}s` }"
          @toggle="$emit('toggle', option)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import FilterTag from './FilterTag.vue'

const props = defineProps<{
  title: string
  icon: string
  options: string[]
  selected: string[]
}>()

const emit = defineEmits<{
  toggle: [value: string]
  clear: []
  random: []
}>()

const selectedCount = computed(() => props.selected.length)
const isShaking = ref(false)

function handleRandom() {
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
  }, 500)
  emit('random')
}
</script>

<style scoped>
.filter-section {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--cream-dark);
  animation: fadeInUp 0.5s ease-out both;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.filter-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.filter-icon {
  font-size: 18px;
}

.filter-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.05em;
}

.selected-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--terracotta);
  color: white;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.clear-btn {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--cream-dark);
  color: var(--text-secondary);
}

.random-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--cream-dark);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.random-btn:active {
  transform: scale(0.9);
}

.random-dice {
  font-size: 16px;
  transition: transform 0.3s;
}

.random-dice.shake {
  animation: shake 0.5s ease-in-out;
}

.filter-tags-wrapper {
  overflow-x: auto;
  margin: 0 calc(var(--space-md) * -1);
  padding: 0 var(--space-md);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filter-tags-wrapper::-webkit-scrollbar {
  display: none;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}
</style>
