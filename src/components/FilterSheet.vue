<script setup lang="ts">
import { computed } from 'vue'
import { useRecipeStore } from '@/stores/recipes'
import { useFilterStore } from '@/stores/filter'
import type { FilterState } from '@/types'
import AppIcon from './AppIcon.vue'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const recipeStore = useRecipeStore()
const filterStore = useFilterStore()

interface SheetSection {
  key: keyof FilterState
  label: string
  options: string[]
}

const sections = computed<SheetSection[]>(() => [
  { key: 'type', label: '类型', options: recipeStore.filterOptions.types },
  { key: 'cuisines', label: '菜系', options: recipeStore.filterOptions.cuisines },
  { key: 'cooking_method', label: '做法', options: recipeStore.filterOptions.cookingMethods },
  { key: 'ingredients', label: '主材料', options: recipeStore.filterOptions.ingredients },
  { key: 'proficiency', label: '擅长程度', options: recipeStore.filterOptions.proficiencies }
])

const matchCount = computed(() => filterStore.filteredRecipes.length)
const hasSelection = computed(() =>
  Object.values(filterStore.filters).some(arr => arr.length > 0)
)
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="sheet-overlay" @click="emit('close')">
        <div class="sheet" role="dialog" aria-label="筛选菜谱" @click.stop>
          <div class="sheet-handle"></div>
          <div class="sheet-head">
            <span class="sheet-title">筛选</span>
            <button class="sheet-close" aria-label="关闭筛选" @click="emit('close')">
              <AppIcon name="x" :size="16" />
            </button>
          </div>
          <div class="sheet-body">
            <section v-for="section in sections" :key="section.key" class="dim">
              <div class="dim-head">
                <span class="dim-label">{{ section.label }}</span>
                <button
                  v-if="filterStore.filters[section.key].length > 0"
                  class="dim-clear"
                  @click="filterStore.clearDimension(section.key)"
                >
                  清除
                </button>
              </div>
              <div class="dim-tags">
                <button
                  v-for="option in section.options"
                  :key="option"
                  class="tag"
                  :class="{ on: filterStore.filters[section.key].includes(option) }"
                  @click="filterStore.toggleFilter(section.key, option)"
                >
                  {{ option }}
                </button>
              </div>
            </section>
          </div>
          <div class="sheet-foot">
            <button class="foot-clear" :disabled="!hasSelection" @click="filterStore.clearAll()">
              清空
            </button>
            <button class="foot-apply" @click="emit('close')">
              看 {{ matchCount }} 道菜
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: oklch(0.25 0.04 45 / 0.45);
  z-index: 1200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  max-width: var(--content-max);
  max-height: 78dvh;
  display: flex;
  flex-direction: column;
  background: var(--paper-raised);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-sheet);
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--paper-dim);
  margin: 10px auto 2px;
  flex-shrink: 0;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  flex-shrink: 0;
}

.sheet-title {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.08em;
  color: var(--ink);
}

.sheet-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--ink-3);
  transition: background-color 0.15s, transform 0.15s;
}

.sheet-close:active {
  background: var(--paper-dim);
  transform: scale(0.92);
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 var(--space-md) var(--space-md);
}

.dim + .dim {
  margin-top: var(--space-md);
  border-top: 1px dashed var(--rule);
  padding-top: var(--space-md);
}

.dim-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.dim-label {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
}

.dim-clear {
  font-size: 12px;
  color: var(--ink-3);
  padding: 2px 6px;
}

.dim-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

/* 服务员圈菜: 选中 = 朱砂描边 */
.tag {
  padding: 7px 14px;
  min-height: 34px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--ink-2);
  background: transparent;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s, transform 0.15s;
  white-space: nowrap;
}

.tag:active {
  transform: scale(0.95);
}

.tag.on {
  border-color: var(--seal);
  box-shadow: inset 0 0 0 0.5px var(--seal);
  color: var(--seal);
  background: var(--seal-wash);
  font-weight: 600;
}

.sheet-foot {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md) var(--space-md);
  border-top: 1px solid var(--rule);
  flex-shrink: 0;
  background: var(--paper-raised);
}

.foot-clear {
  flex-shrink: 0;
  padding: 0 var(--space-lg);
  height: 48px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--ink-2);
  transition: transform 0.15s, background-color 0.15s;
}

.foot-clear:disabled {
  opacity: 0.4;
  cursor: default;
}

.foot-clear:not(:disabled):active {
  transform: scale(0.97);
  background: var(--paper-dim);
}

.foot-apply {
  flex: 1;
  height: 48px;
  background: var(--seal);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
  transition: transform 0.15s, background-color 0.15s;
}

.foot-apply:active {
  transform: scale(0.97);
  background: var(--seal-deep);
}

/* 进出场 */
.sheet-enter-active {
  transition: opacity 0.25s ease-out;
}

.sheet-leave-active {
  transition: opacity 0.18s ease-in;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-active .sheet {
  transition: transform 0.3s var(--ease-out);
}

.sheet-leave-active .sheet {
  transition: transform 0.18s ease-in;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}
</style>
