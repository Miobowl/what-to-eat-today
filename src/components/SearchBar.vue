<template>
  <div class="search-bar">
    <AppIcon name="search" :size="15" class="search-icon" />
    <input
      v-model="filterStore.searchKeyword"
      type="text"
      placeholder="搜菜名"
      aria-label="搜索菜谱"
    />
    <button
      v-if="filterStore.searchKeyword"
      class="clear-btn"
      aria-label="清除搜索"
      @click="filterStore.searchKeyword = ''"
    >
      <AppIcon name="x" :size="12" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useFilterStore } from '@/stores/filter'
import AppIcon from './AppIcon.vue'

const filterStore = useFilterStore()
</script>

<style scoped>
.search-bar {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 2px;
  border-bottom: 1px solid var(--rule);
  transition: border-color 0.2s;
}

.search-bar:focus-within {
  border-color: var(--ink-3);
}

.search-icon {
  color: var(--ink-3);
  flex-shrink: 0;
}

input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--ink);
  outline: none;
}

input::placeholder {
  color: var(--ink-3);
}

.clear-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--ink-3);
  position: relative;
}

.clear-btn::after {
  content: '';
  position: absolute;
  inset: -8px;
}

.clear-btn:active {
  background: var(--paper-dim);
}
</style>
