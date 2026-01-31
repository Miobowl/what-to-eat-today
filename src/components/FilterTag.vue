<template>
  <button
    class="filter-tag"
    :class="{ active: isActive }"
    @click="$emit('toggle')"
  >
    {{ label }}
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
  padding: 6px 12px;
  margin: 4px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: #fff;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tag:active {
  transform: scale(0.95);
}

.filter-tag.active {
  background: #4CAF50;
  border-color: #4CAF50;
  color: #fff;
}
</style>
