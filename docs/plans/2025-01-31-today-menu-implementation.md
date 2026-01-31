# 今日菜单功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现"今日菜单"功能，允许用户选择多道菜并通过邮件发送菜单

**Architecture:** 新增 menu store 管理菜单状态，MenuFloat 悬浮框组件显示已选菜品，CustomDishModal 弹窗添加自选菜品，send-menu API 调用 Resend 发送邮件

**Tech Stack:** Vue 3, Pinia, TypeScript, Resend API, Vercel Serverless Functions

---

## Task 1: 创建 MenuItem 类型定义

**Files:**
- Modify: `src/types/recipe.ts`

**Step 1: 添加 MenuItem 接口**

在 `src/types/recipe.ts` 末尾添加：

```typescript
export interface MenuItem {
  id: string
  name: string
  isCustom: boolean  // true = 自选菜品, false = 数据库菜品
}
```

**Step 2: 验证类型检查通过**

Run: `npm run build`
Expected: 编译成功，无类型错误

**Step 3: Commit**

```bash
git add src/types/recipe.ts
git commit -m "feat: add MenuItem type for today's menu feature"
```

---

## Task 2: 创建 menu store

**Files:**
- Create: `src/stores/menu.ts`

**Step 1: 创建 menu store 文件**

创建 `src/stores/menu.ts`：

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem } from '@/types'

export const useMenuStore = defineStore('menu', () => {
  const items = ref<MenuItem[]>([])

  const isEmpty = computed(() => items.value.length === 0)
  const count = computed(() => items.value.length)

  function addItem(item: MenuItem) {
    // 避免重复添加
    if (items.value.some(i => i.id === item.id)) return
    items.value.push(item)
  }

  function removeItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function hasItem(id: string): boolean {
    return items.value.some(i => i.id === id)
  }

  function clear() {
    items.value = []
  }

  function addCustomDish(name: string) {
    const id = `custom-${Date.now()}`
    items.value.push({ id, name, isCustom: true })
  }

  return {
    items,
    isEmpty,
    count,
    addItem,
    removeItem,
    hasItem,
    clear,
    addCustomDish
  }
})
```

**Step 2: 验证类型检查通过**

Run: `npm run build`
Expected: 编译成功

**Step 3: Commit**

```bash
git add src/stores/menu.ts
git commit -m "feat: add menu store for managing today's menu items"
```

---

## Task 3: 改造 RecipeCard 组件

**Files:**
- Modify: `src/components/RecipeCard.vue`

**Step 1: 更新 template**

将整个 template 替换为：

```vue
<template>
  <div class="recipe-card">
    <div class="card-content" @click="openInNotion">
      <div class="recipe-name">{{ recipe.name }}</div>
      <div class="recipe-meta">
        <span v-for="cuisine in recipe.cuisines" :key="cuisine" class="tag cuisine">
          {{ cuisine }}
        </span>
        <span v-if="recipe.cookingMethod" class="tag method">
          {{ recipe.cookingMethod }}
        </span>
      </div>
    </div>
    <div class="card-actions">
      <button class="action-btn goto-btn" @click="openInNotion" title="查看菜谱">
        <span class="arrow-icon">→</span>
      </button>
      <button
        class="action-btn order-btn"
        :class="{ added: justAdded, disabled: isInMenu }"
        :disabled="isInMenu"
        @click="addToMenu"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
```

**Step 2: 更新 script**

将 script 替换为：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Recipe } from '@/types'
import { useMenuStore } from '@/stores/menu'

const props = defineProps<{
  recipe: Recipe
}>()

const menuStore = useMenuStore()
const justAdded = ref(false)

const isInMenu = computed(() => menuStore.hasItem(props.recipe.id))
const buttonText = computed(() => {
  if (justAdded.value) return '已点'
  if (isInMenu.value) return '已点'
  return '点菜'
})

function openInNotion() {
  window.open(props.recipe.notionUrl, '_blank')
}

function addToMenu() {
  if (isInMenu.value) return

  menuStore.addItem({
    id: props.recipe.id,
    name: props.recipe.name,
    isCustom: false
  })

  justAdded.value = true
  setTimeout(() => {
    justAdded.value = false
  }, 500)
}
</script>
```

**Step 3: 更新 style**

将 style 替换为：

```vue
<style scoped>
.recipe-card {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--cream-dark);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.recipe-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--sage);
  opacity: 0;
  transition: opacity 0.2s;
}

.recipe-card:active::before {
  opacity: 1;
}

.card-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.card-content:active {
  opacity: 0.7;
}

.recipe-name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  letter-spacing: 0.02em;
}

.recipe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.tag.cuisine {
  background: var(--sage-light);
  color: var(--sage);
}

.tag.method {
  background: var(--terracotta-light);
  color: var(--terracotta);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-left: var(--space-sm);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  transition: all 0.2s;
}

.goto-btn {
  width: 28px;
  height: 28px;
  background: var(--cream-dark);
}

.goto-btn:active {
  background: var(--sage);
}

.goto-btn:active .arrow-icon {
  color: white;
  transform: translateX(2px);
}

.arrow-icon {
  font-size: 14px;
  color: var(--text-muted);
  transition: all 0.2s;
}

.order-btn {
  padding: 6px 12px;
  background: var(--mustard);
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.order-btn:active {
  transform: scale(0.95);
  background: var(--mustard-light);
  color: var(--ink);
}

.order-btn.added {
  background: var(--sage);
}

.order-btn.disabled {
  background: var(--cream-dark);
  color: var(--text-muted);
  cursor: default;
}

.order-btn.disabled:active {
  transform: none;
}
</style>
```

**Step 4: 验证构建通过**

Run: `npm run build`
Expected: 编译成功

**Step 5: Commit**

```bash
git add src/components/RecipeCard.vue
git commit -m "feat: add dual buttons to RecipeCard (goto + order)"
```

---

## Task 4: 创建 CustomDishModal 组件

**Files:**
- Create: `src/components/CustomDishModal.vue`

**Step 1: 创建弹窗组件**

创建 `src/components/CustomDishModal.vue`：

```vue
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
```

**Step 2: 验证构建通过**

Run: `npm run build`
Expected: 编译成功

**Step 3: Commit**

```bash
git add src/components/CustomDishModal.vue
git commit -m "feat: add CustomDishModal for custom dish input"
```

---

## Task 5: 创建 MenuFloat 悬浮框组件

**Files:**
- Create: `src/components/MenuFloat.vue`

**Step 1: 创建悬浮框组件**

创建 `src/components/MenuFloat.vue`：

```vue
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
```

**Step 2: 验证构建通过**

Run: `npm run build`
Expected: 编译成功

**Step 3: Commit**

```bash
git add src/components/MenuFloat.vue
git commit -m "feat: add MenuFloat component with dish tags and submit button"
```

---

## Task 6: 在 Home.vue 中引入 MenuFloat

**Files:**
- Modify: `src/views/Home.vue`

**Step 1: 添加 import**

在 script setup 的 import 部分添加：

```typescript
import MenuFloat from '@/components/MenuFloat.vue'
```

**Step 2: 在 template 末尾添加 MenuFloat**

在 `</div>` (最外层 .home div) 之前，`RandomResult` 之后添加：

```vue
    <!-- Menu Float -->
    <MenuFloat />
```

**Step 3: 调整 padding-bottom**

在 style scoped 的 `.home` 规则中，修改 `padding-bottom`：

```css
padding-bottom: calc(180px + env(safe-area-inset-bottom));
```

这样为悬浮框留出足够空间。

**Step 4: 验证构建通过**

Run: `npm run build`
Expected: 编译成功

**Step 5: Commit**

```bash
git add src/views/Home.vue
git commit -m "feat: integrate MenuFloat into Home view"
```

---

## Task 7: 创建邮件发送 API

**Files:**
- Create: `api/send-menu.ts`

**Step 1: 创建 Serverless Function**

创建 `api/send-menu.ts`：

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface DishItem {
  name: string
  isCustom: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const recipientEmail = process.env.RECIPIENT_EMAIL

  if (!resendApiKey || !recipientEmail) {
    return res.status(500).json({
      error: 'Missing environment variables',
      hasResendKey: !!resendApiKey,
      hasRecipient: !!recipientEmail
    })
  }

  const { dishes } = req.body as { dishes: DishItem[] }

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return res.status(400).json({ error: 'No dishes provided' })
  }

  // 格式化日期
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 构建邮件内容
  const dishList = dishes
    .map(d => `- ${d.name}${d.isCustom ? ' (自选)' : ''}`)
    .join('\n')

  const emailContent = dishList

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '今天吃啥 <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `点菜啦（${dateStr}）`,
        text: emailContent
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', data)
      return res.status(response.status).json({ error: 'Failed to send email', details: data })
    }

    res.status(200).json({ success: true, id: data.id })
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}
```

**Step 2: 验证构建通过**

Run: `npm run build`
Expected: 编译成功

**Step 3: Commit**

```bash
git add api/send-menu.ts
git commit -m "feat: add send-menu API using Resend"
```

---

## Task 8: 更新 Vite 开发代理

**Files:**
- Modify: `vite.config.ts`

**Step 1: 查看当前 vite.config.ts**

先读取文件查看当前配置。

**Step 2: 添加 /api/send-menu 代理**

如果已有 proxy 配置，添加新路由。如果没有，需要创建。开发环境中需要模拟邮件发送（或者直接返回成功，因为 Resend 需要真实 API key）。

由于开发环境没有 Vercel Function，可以选择：
- A) 开发时直接调用 Resend（需要 .env.local 配置 RESEND_API_KEY）
- B) Mock 返回成功

推荐方案 A，这样可以完整测试。需要在 vite.config.ts 中配置让开发服务器能处理 POST 请求。

**实际上**，对于 Vercel 项目，可以使用 `vercel dev` 命令在本地运行 serverless functions。这是最简单的方式。

但如果要用 `npm run dev`（Vite），需要一个 Vite 插件来处理 API 路由。

**简化方案：** 建议用户在开发时使用 `vercel dev`，或者我们可以添加一个简单的 mock。

在 vite.config.ts 中添加一个插件来 mock API（仅开发环境）：

```typescript
// 在 plugins 数组中添加
{
  name: 'mock-send-menu',
  configureServer(server) {
    server.middlewares.use('/api/send-menu', (req, res) => {
      if (req.method === 'POST') {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          console.log('[Mock] Send menu:', body)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, id: 'mock-' + Date.now() }))
        })
      } else {
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
      }
    })
  }
}
```

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add mock API for send-menu in dev mode"
```

---

## Task 9: 端到端测试

**Step 1: 启动开发服务器**

Run: `npm run dev`

**Step 2: 手动测试**

1. 打开浏览器访问应用
2. 确认底部悬浮框显示"今日菜单"和"还没点菜哦"
3. 点击任意菜品的"点菜"按钮
4. 确认菜品标签出现在悬浮框
5. 点击"自选"按钮，输入自定义菜名，确认添加成功（显示虚线边框）
6. 点击标签上的 × 删除菜品
7. 添加几道菜后点击"一键下单"
8. 确认按钮显示 loading 状态，然后变成"下单成功!"
9. 确认菜单清空

**Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete today's menu feature with email sending"
```

---

## 环境变量配置清单

### 开发环境 (.env.local)
```
VITE_NOTION_API_KEY=<your-notion-api-key>
VITE_NOTION_DATABASE_ID=2aeaf7ade59680ec98d5e8923028a5d2
```

### 生产环境 (Vercel Dashboard)
```
VITE_NOTION_API_KEY=<your-notion-api-key>
VITE_NOTION_DATABASE_ID=2aeaf7ade59680ec98d5e8923028a5d2
RESEND_API_KEY=<your-resend-api-key>
RECIPIENT_EMAIL=<your-email@example.com>
```

### Resend 配置步骤
1. 访问 https://resend.com 注册账号
2. 创建 API Key
3. 在 Vercel Dashboard 中添加环境变量
4. （可选）验证自定义域名以使用自定义发件地址
