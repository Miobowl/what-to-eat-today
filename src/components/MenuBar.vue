<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMenuStore } from '@/stores/menu'
import CustomDishModal from './CustomDishModal.vue'
import AppIcon from './AppIcon.vue'

const menuStore = useMenuStore()
const expanded = ref(false)
const showCustomModal = ref(false)
const isSending = ref(false)
const sendStatus = ref<'idle' | 'success' | 'error'>('idle')

const submitText = computed(() => {
  if (sendStatus.value === 'success') return '下单成功'
  if (sendStatus.value === 'error') return '发送失败'
  return '一键下单'
})

function handleAddCustom(name: string) {
  menuStore.addCustomDish(name)
}

async function handleSubmit() {
  if (menuStore.isEmpty || isSending.value) return

  isSending.value = true
  sendStatus.value = 'idle'

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const menuToken = import.meta.env.VITE_MENU_TOKEN
    if (menuToken) headers['X-Menu-Token'] = menuToken

    const response = await fetch('/api/send-menu', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dishes: menuStore.items.map(item => ({
          name: item.name,
          isCustom: item.isCustom
        }))
      })
    })

    if (!response.ok) throw new Error('Failed to send')

    sendStatus.value = 'success'
    setTimeout(() => {
      menuStore.clear()
      sendStatus.value = 'idle'
      expanded.value = false
    }, 1500)
  } catch (e) {
    console.error('Send menu error:', e)
    sendStatus.value = 'error'
    setTimeout(() => {
      sendStatus.value = 'idle'
    }, 2000)
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="menubar">
      <!-- 展开的小票 -->
      <div class="receipt" :class="{ open: expanded }">
        <div class="receipt-inner">
          <div class="receipt-content">
            <p v-if="menuStore.isEmpty" class="receipt-empty">还没点菜</p>
            <ul v-else class="receipt-list">
              <li v-for="(item, i) in menuStore.items" :key="item.id" class="receipt-item">
                <span class="item-no">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="item-name" :class="{ custom: item.isCustom }">{{ item.name }}</span>
                <span class="item-dots"></span>
                <button class="item-remove" :aria-label="`移除${item.name}`" @click="menuStore.removeItem(item.id)">
                  <AppIcon name="x" :size="13" />
                </button>
              </li>
            </ul>
            <button class="receipt-add" @click="showCustomModal = true">
              <AppIcon name="plus" :size="14" />
              添加自选菜
            </button>
          </div>
        </div>
      </div>

      <!-- 常驻单行 -->
      <div class="bar">
        <button class="bar-summary" :aria-expanded="expanded" @click="expanded = !expanded">
          <span class="bar-label">今日菜单</span>
          <span class="bar-count" :class="{ zero: menuStore.isEmpty }">{{ menuStore.count }} 道</span>
          <AppIcon :name="expanded ? 'chevron-down' : 'chevron-up'" :size="15" class="bar-chevron" />
        </button>
        <button
          class="bar-submit"
          :class="{ disabled: menuStore.isEmpty || isSending, success: sendStatus === 'success' }"
          :disabled="menuStore.isEmpty || isSending"
          @click="handleSubmit"
        >
          <span v-if="isSending" class="loading-dot"></span>
          <span v-else>{{ submitText }}</span>
        </button>
      </div>
    </div>

    <CustomDishModal
      :visible="showCustomModal"
      @close="showCustomModal = false"
      @add="handleAddCustom"
    />
  </Teleport>
</template>

<style scoped>
.menubar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar,
.receipt {
  width: 100%;
  max-width: var(--content-max);
}

/* 小票展开区: grid-rows 高度过渡 */
.receipt {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s var(--ease-out);
  background: var(--paper-raised);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-sheet);
}

.receipt.open {
  grid-template-rows: 1fr;
}

.receipt-inner {
  overflow: hidden;
  min-height: 0;
}

.receipt-content {
  padding: var(--space-md) var(--space-md) var(--space-sm);
  max-height: 40dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.receipt-add {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 38px;
  margin-top: var(--space-sm);
  border: 1px dashed var(--ink-3);
  border-radius: var(--radius-xs);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  transition: transform 0.15s, background-color 0.15s;
}

.receipt-add:active {
  transform: scale(0.98);
  background: var(--paper-dim);
}

.receipt-empty {
  font-size: 13px;
  color: var(--ink-3);
  text-align: center;
  padding: var(--space-xs) 0;
}

.receipt-list {
  list-style: none;
}

.receipt-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 6px 0;
}

.item-no {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--seal);
}

.item-name {
  font-size: 14px;
  color: var(--ink);
}

.item-name.custom::after {
  content: '自选';
  margin-left: 6px;
  font-size: 10px;
  color: var(--mustard);
  border: 1px solid var(--mustard);
  border-radius: var(--radius-xs);
  padding: 0 4px;
}

.item-dots {
  flex: 1;
  border-bottom: 1px dotted var(--rule);
  transform: translateY(-3px);
}

.item-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  color: var(--ink-3);
  transition: background-color 0.15s;
}

.item-remove:active {
  background: var(--paper-dim);
}

/* 常驻单行 */
.bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: var(--paper-raised);
  border-top: 1px solid var(--rule);
  padding: var(--space-sm) var(--space-md);
  padding-bottom: calc(var(--space-sm) + env(safe-area-inset-bottom));
}

.menubar:not(:has(.receipt.open)) .receipt {
  box-shadow: none;
}

.bar-summary {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 44px;
  text-align: left;
}

.bar-label {
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.08em;
  color: var(--ink);
}

.bar-count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--seal);
  font-weight: 600;
}

.bar-count.zero {
  color: var(--ink-3);
  font-weight: 400;
}

.bar-chevron {
  color: var(--ink-3);
}

.bar-submit {
  flex-shrink: 0;
  min-width: 112px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--seal);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: transform 0.15s, background-color 0.15s;
}

.bar-submit:active {
  transform: scale(0.97);
  background: var(--seal-deep);
}

.bar-submit.disabled {
  background: var(--paper-dim);
  color: var(--ink-3);
  cursor: not-allowed;
}

.bar-submit.disabled:active {
  transform: none;
}

.bar-submit.success {
  background: var(--sage);
}

.loading-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: dotPulse 0.8s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
