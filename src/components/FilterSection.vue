<template>
  <div class="filter-section">
    <div class="filter-header">
      <span class="filter-title">{{ title }}</span>
      <button
        v-if="selectedCount > 0"
        class="clear-btn"
        @click="$emit('clear')"
      >
        清除
      </button>
      <button class="random-btn" @click="$emit('random')">
        🎲
      </button>
    </div>
    <div class="filter-tags">
      <FilterTag
        v-for="option in options"
        :key="option"
        :label="option"
        :is-active="selected.includes(option)"
        @toggle="$emit('toggle', option)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FilterTag from './FilterTag.vue'

const props = defineProps<{
  title: string
  options: string[]
  selected: string[]
}>()

defineEmits<{
  toggle: [value: string]
  clear: []
  random: []
}>()

const selectedCount = computed(() => props.selected.length)
</script>

<style scoped>
.filter-section {
  margin-bottom: 16px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  font-size: 12px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
}

.random-btn {
  margin-left: auto;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
}

.random-btn:active {
  background: #f5f5f5;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  margin: -4px;
}
</style>
