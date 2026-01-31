<template>
  <Transition name="slide-down">
    <div v-if="hasActiveFilters" class="filter-summary-bar">
      <div class="summary-content">
        <!-- Selected filters display -->
        <div class="selected-filters">
          <div class="filters-scroll">
            <TransitionGroup name="chip">
              <button
                v-for="filter in allSelectedFilters"
                :key="`${filter.dimension}-${filter.value}`"
                class="filter-chip"
                :class="filter.dimension"
                @click="removeFilter(filter.dimension, filter.value)"
              >
                <span class="chip-icon">{{ dimensionIcons[filter.dimension] }}</span>
                <span class="chip-label">{{ filter.value }}</span>
                <span class="chip-remove">×</span>
              </button>
            </TransitionGroup>
          </div>
          <button v-if="totalCount > 2" class="clear-all-btn" @click="clearAll">
            清空
          </button>
        </div>

        <!-- Action buttons -->
        <div class="summary-actions">
          <div class="match-count">
            <span class="count-number">{{ matchCount }}</span>
            <span class="count-label">道菜</span>
          </div>
          <button class="action-btn random-action" @click="handleRandom">
            <span class="action-icon">🎲</span>
          </button>
          <button class="action-btn scroll-action" @click="scrollToResults">
            <span class="action-icon">↓</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filter'
import type { FilterState } from '@/types'

const filterStore = useFilterStore()

const emit = defineEmits<{
  random: []
  scrollToResults: []
}>()

const dimensionIcons: Record<keyof FilterState, string> = {
  cuisines: '🌍',
  cookingMethod: '🔥',
  ingredients: '🥬',
  type: '🍽️',
  proficiency: '👨‍🍳'
}

const dimensionLabels: Record<keyof FilterState, string> = {
  cuisines: '菜系',
  cookingMethod: '做法',
  ingredients: '主材料',
  type: '类型',
  proficiency: '擅长'
}

interface SelectedFilter {
  dimension: keyof FilterState
  value: string
  label: string
}

const allSelectedFilters = computed<SelectedFilter[]>(() => {
  const result: SelectedFilter[] = []
  const dimensions: (keyof FilterState)[] = ['cuisines', 'cookingMethod', 'ingredients', 'type', 'proficiency']

  for (const dim of dimensions) {
    for (const value of filterStore.filters[dim]) {
      result.push({
        dimension: dim,
        value,
        label: dimensionLabels[dim]
      })
    }
  }
  return result
})

const totalCount = computed(() => allSelectedFilters.value.length)
const hasActiveFilters = computed(() => totalCount.value > 0)
const matchCount = computed(() => filterStore.filteredRecipes.length)

function removeFilter(dimension: keyof FilterState, value: string) {
  filterStore.toggleFilter(dimension, value)
}

function clearAll() {
  filterStore.clearAll()
}

function handleRandom() {
  emit('random')
}

function scrollToResults() {
  emit('scrollToResults')
}
</script>

<style scoped>
.filter-summary-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(
    to bottom,
    rgba(253, 246, 227, 0.98) 0%,
    rgba(253, 246, 227, 0.95) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--cream-dark);
  box-shadow: 0 4px 20px rgba(44, 24, 16, 0.08);
  padding: var(--space-sm) var(--space-md);
  padding-top: calc(var(--space-sm) + env(safe-area-inset-top));
}

.summary-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.selected-filters {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.filters-scroll {
  flex: 1;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px 0;
}

.filters-scroll::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-card);
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all 0.2s ease;
  animation: chipIn 0.25s ease-out;
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.cuisines {
  border-color: rgba(199, 91, 57, 0.3);
  background: rgba(199, 91, 57, 0.08);
}

.filter-chip.cookingMethod {
  border-color: rgba(212, 167, 44, 0.3);
  background: rgba(212, 167, 44, 0.08);
}

.filter-chip.ingredients {
  border-color: rgba(125, 148, 113, 0.3);
  background: rgba(125, 148, 113, 0.08);
}

.filter-chip.type {
  border-color: rgba(139, 115, 85, 0.3);
  background: rgba(139, 115, 85, 0.08);
}

.filter-chip.proficiency {
  border-color: rgba(199, 91, 57, 0.3);
  background: rgba(199, 91, 57, 0.08);
}

.chip-icon {
  font-size: 11px;
}

.chip-label {
  font-weight: 500;
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 2px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  opacity: 0.6;
  transition: opacity 0.2s;
}

.filter-chip:hover .chip-remove {
  opacity: 1;
}

.clear-all-btn {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--terracotta);
  background: rgba(199, 91, 57, 0.1);
  border-radius: var(--radius-full);
  transition: all 0.2s;
}

.clear-all-btn:active {
  transform: scale(0.95);
  background: rgba(199, 91, 57, 0.2);
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

.match-count {
  display: flex;
  align-items: baseline;
  gap: 2px;
  padding: 0 var(--space-sm);
}

.count-number {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--terracotta);
  line-height: 1;
}

.count-label {
  font-size: 11px;
  color: var(--text-muted);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.action-btn:active {
  transform: scale(0.92);
}

.random-action {
  background: linear-gradient(135deg, var(--terracotta) 0%, #A84832 100%);
  box-shadow: 0 2px 8px rgba(199, 91, 57, 0.3);
}

.random-action .action-icon {
  font-size: 18px;
}

.scroll-action {
  background: var(--cream-dark);
  border: 1px solid rgba(44, 24, 16, 0.1);
}

.scroll-action .action-icon {
  font-size: 16px;
  color: var(--text-secondary);
}

/* Animations */
@keyframes chipIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.slide-down-enter-active {
  animation: slideDown 0.3s ease-out;
}

.slide-down-leave-active {
  animation: slideDown 0.2s ease-in reverse;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chip-enter-active {
  animation: chipIn 0.25s ease-out;
}

.chip-leave-active {
  animation: chipIn 0.15s ease-in reverse;
}

.chip-move {
  transition: transform 0.25s ease;
}
</style>
