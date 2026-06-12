<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { Recipe } from '@/types'
import { useMenuStore } from '@/stores/menu'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  visible: boolean
  recipe: Recipe | null
  reelNames: string[]
  rollId: number
}>()

const emit = defineEmits<{
  close: []
  again: []
}>()

const router = useRouter()
const menuStore = useMenuStore()

const ROW_H = 56
const phase = ref<'rolling' | 'done'>('rolling')
const stripStyle = ref<Record<string, string>>({})

const isInMenu = computed(() =>
  props.recipe ? menuStore.hasItem(props.recipe.id) : false
)

const metaLine = computed(() => {
  if (!props.recipe) return ''
  const parts = [
    ...props.recipe.cuisines,
    props.recipe.cooking_method,
    props.recipe.type,
    props.recipe.cooking_time ? `${props.recipe.cooking_time} 分钟` : ''
  ].filter(Boolean)
  return parts.join(' · ')
})

function startRoll() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || props.reelNames.length < 2 || !props.recipe) {
    phase.value = 'done'
    return
  }
  phase.value = 'rolling'
  const endY = ROW_H - (props.reelNames.length - 1) * ROW_H
  stripStyle.value = { transform: `translateY(${ROW_H}px)`, transition: 'none' }
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stripStyle.value = {
          transform: `translateY(${endY}px)`,
          transition: 'transform 2.2s var(--ease-out)'
        }
      })
    })
  })
}

function onRollEnd() {
  phase.value = 'done'
}

watch(
  () => [props.visible, props.rollId],
  ([visible]) => {
    if (visible) startRoll()
  }
)

function addToMenu() {
  if (!props.recipe || isInMenu.value) return
  menuStore.addItem({ id: props.recipe.id, name: props.recipe.name, isCustom: false })
}

function openRecipe() {
  if (!props.recipe) return
  router.push({ name: 'recipe-detail', params: { id: props.recipe.id } })
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="draw">
      <div v-if="visible" class="draw" role="dialog" aria-label="抽签结果">
        <button class="draw-close" aria-label="关闭" @click="emit('close')">
          <AppIcon name="x" :size="18" />
        </button>

        <p class="draw-kicker">今天就吃</p>

        <!-- 没抽到: 条件太苛刻 -->
        <div v-if="!recipe" class="draw-empty">
          <p class="empty-title">这组条件下没有菜</p>
          <p class="empty-hint">放宽一两个筛选条件再试试</p>
          <button class="act act-primary" @click="emit('close')">调整筛选</button>
        </div>

        <!-- 滚动中 -->
        <div v-else-if="phase === 'rolling'" class="reel" aria-hidden="true">
          <div class="reel-strip" :style="stripStyle" @transitionend="onRollEnd">
            <div v-for="(name, i) in reelNames" :key="i" class="reel-row">{{ name }}</div>
          </div>
        </div>

        <!-- 揭晓 -->
        <div v-else class="reveal">
          <div class="reveal-name-wrap">
            <h2 class="reveal-name">{{ recipe.name }}</h2>
            <span class="stamp">就它了</span>
          </div>
          <p v-if="metaLine" class="reveal-meta">{{ metaLine }}</p>
          <div class="reveal-actions">
            <button class="act" @click="emit('again')">
              <AppIcon name="dice" :size="16" />
              换一个
            </button>
            <button class="act" :class="{ ordered: isInMenu }" :disabled="isInMenu" @click="addToMenu">
              <AppIcon v-if="isInMenu" name="check" :size="16" />
              {{ isInMenu ? '已点' : '点菜' }}
            </button>
            <button class="act act-primary" @click="openRecipe">看菜谱</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.draw {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: var(--paper);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  padding-top: calc(var(--space-lg) + env(safe-area-inset-top));
  padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom));
}

.draw-close {
  position: absolute;
  top: calc(var(--space-md) + env(safe-area-inset-top));
  right: var(--space-md);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--ink-3);
  transition: background-color 0.15s, transform 0.15s;
}

.draw-close:active {
  background: var(--paper-dim);
  transform: scale(0.92);
}

.draw-kicker {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  color: var(--ink-3);
  margin-bottom: var(--space-lg);
}

/* 老虎机滚轴 */
.reel {
  height: 168px;
  width: 100%;
  max-width: 320px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.reel-strip {
  will-change: transform;
}

.reel-row {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 26px;
  letter-spacing: 0.06em;
  color: var(--ink);
  white-space: nowrap;
}

/* 揭晓 */
.reveal {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.reveal-name-wrap {
  position: relative;
  max-width: 290px;
  margin: 0 auto;
  padding: var(--space-sm) var(--space-md);
}

.reveal-name {
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.25;
  color: var(--ink);
  text-align: center;
  text-wrap: balance;
  animation: fadeInUp 0.4s var(--ease-out) both;
}

/* 朱砂印 */
.stamp {
  position: absolute;
  right: -26px;
  top: -20px;
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.15em;
  text-indent: 0.15em;
  color: var(--seal);
  border: 2px solid var(--seal);
  border-radius: var(--radius-xs);
  padding: 5px 8px;
  box-shadow: inset 0 0 0 2px var(--paper), inset 0 0 0 3px var(--seal);
  background: var(--paper);
  animation: stampDown 0.35s var(--ease-out) 0.45s both;
  pointer-events: none;
}

.reveal-meta {
  margin-top: var(--space-md);
  font-size: 14px;
  color: var(--ink-2);
  text-align: center;
  animation: fadeInUp 0.4s var(--ease-out) 0.25s both;
}

.reveal-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  animation: fadeInUp 0.4s var(--ease-out) 0.55s both;
}

.act {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  padding: 0 var(--space-md);
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--paper-raised);
  transition: transform 0.15s, background-color 0.15s;
}

.act:active {
  transform: scale(0.96);
  background: var(--paper-dim);
}

.act.ordered {
  border-color: var(--sage);
  color: var(--sage);
  background: var(--sage-wash);
  cursor: default;
}

.act.ordered:active {
  transform: none;
}

.act-primary {
  background: var(--seal);
  border-color: var(--seal);
  color: white;
}

.act-primary:active {
  background: var(--seal-deep);
}

/* 空结果 */
.draw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.empty-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--ink);
}

.empty-hint {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: var(--space-md);
}

/* 整层进出场 */
.draw-enter-active {
  transition: opacity 0.25s ease-out;
}

.draw-leave-active {
  transition: opacity 0.2s ease-in;
}

.draw-enter-from,
.draw-leave-to {
  opacity: 0;
}
</style>
