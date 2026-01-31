<template>
  <Teleport to="body">
    <div class="menu-float">
      <div class="float-header">
        <span class="float-title">今日菜单</span>
        <button class="custom-btn" @click="showCustomModal = true">
          自选
        </button>
      </div>
      <div class="float-body">
        <div v-if="menuStore.isEmpty" class="empty-hint">
          还没点菜哦
        </div>
        <div v-else class="dish-tags">
          <span
            v-for="item in menuStore.items"
            :key="item.id"
            class="dish-tag"
            :class="{ custom: item.isCustom }"
          >
            {{ item.name }}
            <button class="remove-btn" @click="menuStore.removeItem(item.id)">×</button>
          </span>
        </div>
      </div>
      <button
        class="submit-btn"
        :class="{ disabled: menuStore.isEmpty || isSending }"
        :disabled="menuStore.isEmpty || isSending"
        @click="handleSubmit"
      >
        <span v-if="isSending" class="loading-dot"></span>
        <span v-else>{{ submitText }}</span>
      </button>
    </div>

    <CustomDishModal
      :visible="showCustomModal"
      @close="showCustomModal = false"
      @add="handleAddCustom"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMenuStore } from '@/stores/menu'
import CustomDishModal from './CustomDishModal.vue'

const menuStore = useMenuStore()
const showCustomModal = ref(false)
const isSending = ref(false)
const sendStatus = ref<'idle' | 'success' | 'error'>('idle')

const submitText = computed(() => {
  if (sendStatus.value === 'success') return '下单成功!'
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
    const response = await fetch('/api/send-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

<style scoped>
.menu-float {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-top: 1px solid var(--cream-dark);
  box-shadow: 0 -4px 20px rgba(44, 24, 16, 0.1);
  padding: var(--space-md);
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
  z-index: 1000;
}

.float-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.float-title {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.custom-btn {
  padding: 4px 12px;
  background: var(--cream-dark);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.custom-btn:active {
  background: var(--sage-light);
  color: var(--sage);
}

.float-body {
  min-height: 32px;
  margin-bottom: var(--space-sm);
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: var(--space-xs) 0;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.dish-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--sage-light);
  color: var(--sage);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.dish-tag.custom {
  background: var(--mustard-light);
  color: var(--ink-light);
  border: 1px dashed var(--mustard);
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 12px;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-btn:active {
  opacity: 1;
}

.submit-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(135deg, var(--terracotta) 0%, #A84832 100%);
  color: white;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(199, 91, 57, 0.3);
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn.disabled {
  background: var(--cream-dark);
  color: var(--text-muted);
  box-shadow: none;
  cursor: not-allowed;
}

.submit-btn.disabled:active {
  transform: none;
}

.loading-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: pulse 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
