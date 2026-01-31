<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        v-model="filterStore.searchKeyword"
        type="text"
        placeholder="搜索菜谱..."
        @input="onSearch"
      />
      <button
        v-if="filterStore.searchKeyword"
        class="clear-btn"
        @click="clearSearch"
        title="清除搜索"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFilterStore } from '@/stores/filter'

const filterStore = useFilterStore()

function onSearch() {
  // 搜索是响应式的，输入时自动过滤
}

function clearSearch() {
  filterStore.searchKeyword = ''
}
</script>

<style scoped>
.search-bar {
  flex: 1;
  min-width: 0;
  display: flex;
}

.search-input-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-sm);
  height: 40px;
  background: var(--bg-card);
  border: 2px solid var(--cream-dark);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.search-input-wrapper:focus-within {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px rgba(125, 148, 113, 0.15);
}

.search-icon {
  font-size: 14px;
  opacity: 0.6;
  flex-shrink: 0;
}

input {
  flex: 1;
  min-width: 0;
  padding: var(--space-sm) 0;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

input::placeholder {
  color: var(--text-muted);
}

.clear-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream-dark);
  border-radius: 50%;
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--sage);
  color: white;
}
</style>
