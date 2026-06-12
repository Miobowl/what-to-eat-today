<template>
  <div class="menu-row">
    <button class="row-main" @click="openRecipe">
      <span class="row-no">{{ String(number).padStart(2, '0') }}</span>
      <span class="row-text">
        <span class="row-name">{{ recipe.name }}</span>
        <span v-if="metaLine" class="row-meta">{{ metaLine }}</span>
      </span>
    </button>
    <span class="row-dots" aria-hidden="true"></span>
    <button
      v-if="externalUrl"
      class="row-link"
      aria-label="打开原菜谱链接"
      @click="openExternalLink"
    >
      <AppIcon name="arrow-up-right" :size="14" />
    </button>
    <button
      class="row-order"
      :class="{ ordered: isInMenu }"
      :disabled="isInMenu"
      @click="addToMenu"
    >
      <AppIcon v-if="isInMenu" name="check" :size="13" />
      {{ isInMenu ? '已点' : '点菜' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Recipe } from '@/types'
import { useMenuStore } from '@/stores/menu'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  recipe: Recipe
  number: number
}>()

const router = useRouter()
const menuStore = useMenuStore()

const isInMenu = computed(() => menuStore.hasItem(props.recipe.id))
const externalUrl = computed(() => props.recipe.external_url || props.recipe.notion_url)

const metaLine = computed(() => {
  const parts = [...props.recipe.cuisines, props.recipe.cooking_method].filter(Boolean)
  return parts.join(' · ')
})

function openRecipe() {
  router.push({ name: 'recipe-detail', params: { id: props.recipe.id } })
}

function openExternalLink() {
  if (externalUrl.value) {
    window.open(externalUrl.value, '_blank')
  }
}

function addToMenu() {
  if (isInMenu.value) return
  menuStore.addItem({
    id: props.recipe.id,
    name: props.recipe.name,
    isCustom: false
  })
}
</script>

<style scoped>
.menu-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 0;
}

.menu-row + .menu-row {
  border-top: 1px solid var(--rule);
}

.row-main {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  min-width: 0;
  text-align: left;
  padding: 2px 0;
}

.row-main:active .row-name {
  color: var(--seal);
}

.row-no {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--seal);
  flex-shrink: 0;
}

.row-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-name {
  font-family: var(--font-display);
  font-size: 17px;
  line-height: 1.35;
  color: var(--ink);
  letter-spacing: 0.02em;
  transition: color 0.15s;
}

.row-meta {
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 1px;
}

.row-dots {
  flex: 1;
  min-width: 12px;
  border-bottom: 1px dotted var(--rule);
  transform: translateY(-2px);
}

.row-link {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  color: var(--ink-3);
  transition: background-color 0.15s, color 0.15s;
  position: relative;
}

/* 扩大触控热区 */
.row-link::after {
  content: '';
  position: absolute;
  inset: -6px;
}

.row-link:active {
  background: var(--paper-dim);
  color: var(--ink-2);
}

/* 印章式点菜按钮 */
.row-order {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 56px;
  height: 32px;
  border: 1.5px solid var(--seal);
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 600;
  color: var(--seal);
  background: transparent;
  transition: transform 0.15s, background-color 0.15s;
  position: relative;
}

.row-order::after {
  content: '';
  position: absolute;
  inset: -5px;
}

.row-order:not(:disabled):active {
  transform: scale(0.94);
  background: var(--seal-wash);
}

.row-order.ordered {
  border-color: var(--sage);
  color: var(--sage);
  background: var(--sage-wash);
  cursor: default;
}
</style>
