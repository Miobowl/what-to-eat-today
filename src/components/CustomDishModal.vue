<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="$emit('close')">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <span class="header-text">添加自选菜品</span>
            <button class="close-btn" @click="$emit('close')">✕</button>
          </div>
          <div class="modal-body">
            <input
              ref="inputRef"
              v-model="dishName"
              type="text"
              class="dish-input"
              placeholder="请输入菜名..."
              @keyup.enter="handleAdd"
            />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="$emit('close')">取消</button>
            <button
              class="btn-add"
              :disabled="!dishName.trim()"
              @click="handleAdd"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  add: [name: string]
}>()

const dishName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.visible, (val) => {
  if (val) {
    dishName.value = ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function handleAdd() {
  const name = dishName.value.trim()
  if (!name) return
  emit('add', name)
  emit('close')
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .modal-content {
  animation: modalIn 0.15s ease-in reverse;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(44, 24, 16, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: var(--space-md);
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 300px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid var(--cream-dark);
}

.header-text {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-muted);
  border-radius: var(--radius-full);
}

.close-btn:active {
  background: var(--cream-dark);
}

.modal-body {
  padding: var(--space-md);
}

.dish-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--text-primary);
  background: var(--cream);
  outline: none;
  transition: border-color 0.2s;
}

.dish-input:focus {
  border-color: var(--sage);
}

.dish-input::placeholder {
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  padding-top: 0;
}

.btn-cancel,
.btn-add {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--cream-dark);
  color: var(--text-secondary);
}

.btn-cancel:active {
  background: var(--cream);
}

.btn-add {
  background: var(--sage);
  color: white;
}

.btn-add:active {
  transform: scale(0.98);
}

.btn-add:disabled {
  background: var(--cream-dark);
  color: var(--text-muted);
  cursor: not-allowed;
}
</style>
