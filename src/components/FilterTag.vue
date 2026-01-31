<template>
  <button
    class="filter-tag"
    :class="{ active: isActive }"
    @click="$emit('toggle')"
  >
    <span class="tag-text">{{ label }}</span>
    <span v-if="isActive" class="tag-check">✓</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  isActive: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: var(--cream-dark);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  animation: slideInRight 0.3s ease-out both;
}

.filter-tag:active {
  transform: scale(0.95);
}

.filter-tag.active {
  background: var(--sage);
  border-color: var(--sage);
  color: white;
  box-shadow: 0 2px 8px rgba(125, 148, 113, 0.3);
}

.tag-text {
  line-height: 1;
}

.tag-check {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.9;
}
</style>
