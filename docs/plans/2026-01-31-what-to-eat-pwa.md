# 「今天吃啥」PWA 实现方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个手机端 PWA，从 Notion 数据库获取菜谱数据，支持多维度筛选，帮助用户快速决定今天吃什么。

**Architecture:**
- 前端：Vue 3 + Vite + TypeScript，使用 vite-plugin-pwa 实现离线支持
- 数据层：通过 Notion API 获取数据，使用 IndexedDB 本地缓存，每日后台同步
- 部署：Vercel 静态部署，无需后端服务器

**Tech Stack:** Vue 3, Vite, TypeScript, Pinia, vite-plugin-pwa, idb (IndexedDB wrapper), Notion API

---

## 数据库属性映射

| 筛选维度 | Notion 属性名 | 类型 |
|---------|--------------|------|
| 菜系 | 菜系 | multi_select |
| 制作方法 | 做法 | select |
| 主材料 | 主要食材 | multi_select |
| 类型 | 类型 | select |
| 拿手菜 | 擅长程度 | select |

**Notion Database ID:** `2aeaf7ade59680ec98d5e8923028a5d2`

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/App.vue`

**Step 1: 创建 Vue 3 + Vite + TypeScript 项目**

```bash
cd "Z:/400 Coding/今天吃啥"
npm create vite@latest . -- --template vue-ts
```

选择覆盖当前目录。

**Step 2: 安装核心依赖**

```bash
npm install
npm install pinia vue-router@4 idb
npm install -D vite-plugin-pwa @vite-pwa/assets-generator
```

**Step 3: 验证项目启动**

```bash
npm run dev
```

Expected: 浏览器打开 http://localhost:5173，显示 Vue 默认页面

**Step 4: Commit**

```bash
git init
git add .
git commit -m "chore: init vue3 + vite + typescript project"
```

---

## Task 2: 配置 PWA

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.json`
- Create: `src/sw.ts` (可选，使用默认 SW)

**Step 1: 配置 vite-plugin-pwa**

修改 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '今天吃啥',
        short_name: '吃啥',
        description: '快速决定今天吃什么',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.notion\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'notion-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ]
})
```

**Step 2: 创建 PWA 图标占位文件**

```bash
# 创建简单的占位图标（后续可替换）
mkdir -p public
```

创建 `public/favicon.ico` 和图标文件（暂用占位）。

**Step 3: 验证 PWA 配置**

```bash
npm run build
npm run preview
```

Expected: 浏览器开发者工具 → Application → Service Workers 显示已注册

**Step 4: Commit**

```bash
git add .
git commit -m "feat: configure PWA with vite-plugin-pwa"
```

---

## Task 3: 创建数据类型定义

**Files:**
- Create: `src/types/recipe.ts`
- Create: `src/types/filter.ts`

**Step 1: 定义菜谱数据类型**

创建 `src/types/recipe.ts`:

```typescript
export interface Recipe {
  id: string
  name: string
  cuisines: string[]      // 菜系 (multi_select)
  cookingMethod: string   // 做法 (select)
  ingredients: string[]   // 主要食材 (multi_select)
  type: string            // 类型 (select)
  proficiency: string     // 擅长程度 (select)
  notionUrl: string       // Notion 页面链接
}

export interface RecipeFromNotion {
  id: string
  properties: {
    Name: { title: Array<{ plain_text: string }> }
    菜系: { multi_select: Array<{ name: string }> }
    做法: { select: { name: string } | null }
    主要食材: { multi_select: Array<{ name: string }> }
    类型: { select: { name: string } | null }
    擅长程度: { select: { name: string } | null }
  }
  url: string
}
```

**Step 2: 定义筛选相关类型**

创建 `src/types/filter.ts`:

```typescript
export type FilterDimension = 'cuisines' | 'cookingMethod' | 'ingredients' | 'type' | 'proficiency'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterState {
  cuisines: string[]        // 多选
  cookingMethod: string[]   // 多选（UI层面支持多选）
  ingredients: string[]     // 多选
  type: string[]            // 多选
  proficiency: string[]     // 多选
}

export interface FilterConfig {
  key: FilterDimension
  label: string
  notionProperty: string
  isMultiSelect: boolean
}

export const FILTER_CONFIGS: FilterConfig[] = [
  { key: 'cuisines', label: '菜系', notionProperty: '菜系', isMultiSelect: true },
  { key: 'cookingMethod', label: '做法', notionProperty: '做法', isMultiSelect: false },
  { key: 'ingredients', label: '主材料', notionProperty: '主要食材', isMultiSelect: true },
  { key: 'type', label: '类型', notionProperty: '类型', isMultiSelect: false },
  { key: 'proficiency', label: '拿手菜', notionProperty: '擅长程度', isMultiSelect: false }
]
```

**Step 3: 创建类型索引文件**

创建 `src/types/index.ts`:

```typescript
export * from './recipe'
export * from './filter'
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add TypeScript type definitions for recipe and filter"
```

---

## Task 4: 实现 IndexedDB 数据存储

**Files:**
- Create: `src/db/index.ts`
- Create: `src/db/recipes.ts`
- Create: `src/db/sync.ts`

**Step 1: 创建 IndexedDB 数据库配置**

创建 `src/db/index.ts`:

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Recipe } from '@/types'

interface RecipeDB extends DBSchema {
  recipes: {
    key: string
    value: Recipe
    indexes: {
      'by-cuisine': string
      'by-type': string
      'by-proficiency': string
    }
  }
  meta: {
    key: string
    value: {
      key: string
      value: string | number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<RecipeDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RecipeDB>('what-to-eat-db', 1, {
      upgrade(db) {
        // 菜谱表
        const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' })
        recipeStore.createIndex('by-cuisine', 'cuisines', { multiEntry: true })
        recipeStore.createIndex('by-type', 'type')
        recipeStore.createIndex('by-proficiency', 'proficiency')

        // 元数据表（存储同步时间等）
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    })
  }
  return dbPromise
}
```

**Step 2: 创建菜谱数据操作函数**

创建 `src/db/recipes.ts`:

```typescript
import { getDB } from './index'
import type { Recipe } from '@/types'

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDB()
  return db.getAll('recipes')
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('recipes', 'readwrite')

  // 清空旧数据
  await tx.store.clear()

  // 批量写入新数据
  await Promise.all(recipes.map(recipe => tx.store.put(recipe)))
  await tx.done
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const db = await getDB()
  return db.get('recipes', id)
}
```

**Step 3: 创建同步状态管理**

创建 `src/db/sync.ts`:

```typescript
import { getDB } from './index'

const LAST_SYNC_KEY = 'lastSyncTime'
const SYNC_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

export async function getLastSyncTime(): Promise<number | null> {
  const db = await getDB()
  const meta = await db.get('meta', LAST_SYNC_KEY)
  return meta ? (meta.value as number) : null
}

export async function setLastSyncTime(time: number): Promise<void> {
  const db = await getDB()
  await db.put('meta', { key: LAST_SYNC_KEY, value: time })
}

export async function shouldSync(): Promise<boolean> {
  const lastSync = await getLastSyncTime()
  if (!lastSync) return true
  return Date.now() - lastSync > SYNC_INTERVAL
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement IndexedDB storage for recipes"
```

---

## Task 5: 实现 Notion API 数据获取

**Files:**
- Create: `src/api/notion.ts`
- Create: `src/api/transform.ts`
- Create: `.env.example`
- Create: `.env.local` (用户需手动配置)

**Step 1: 创建环境变量示例**

创建 `.env.example`:

```
VITE_NOTION_API_KEY=your_notion_integration_token
VITE_NOTION_DATABASE_ID=2aeaf7ade59680ec98d5e8923028a5d2
```

**Step 2: 创建 Notion API 调用函数**

创建 `src/api/notion.ts`:

```typescript
import type { RecipeFromNotion } from '@/types'

const NOTION_API_BASE = 'https://api.notion.com/v1'

export async function fetchRecipesFromNotion(): Promise<RecipeFromNotion[]> {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY
  const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    throw new Error('Missing Notion API configuration')
  }

  const recipes: RecipeFromNotion[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        start_cursor: startCursor,
        page_size: 100
      })
    })

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`)
    }

    const data = await response.json()
    recipes.push(...data.results)
    hasMore = data.has_more
    startCursor = data.next_cursor
  }

  return recipes
}
```

**Step 3: 创建数据转换函数**

创建 `src/api/transform.ts`:

```typescript
import type { Recipe, RecipeFromNotion } from '@/types'

export function transformNotionToRecipe(notionRecipe: RecipeFromNotion): Recipe {
  const props = notionRecipe.properties

  return {
    id: notionRecipe.id,
    name: props.Name?.title?.[0]?.plain_text || '未命名菜品',
    cuisines: props.菜系?.multi_select?.map(item => item.name) || [],
    cookingMethod: props.做法?.select?.name || '',
    ingredients: props.主要食材?.multi_select?.map(item => item.name) || [],
    type: props.类型?.select?.name || '',
    proficiency: props.擅长程度?.select?.name || '',
    notionUrl: notionRecipe.url
  }
}

export function transformAllRecipes(notionRecipes: RecipeFromNotion[]): Recipe[] {
  return notionRecipes.map(transformNotionToRecipe)
}
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement Notion API integration"
```

---

## Task 6: 实现 Pinia 状态管理

**Files:**
- Create: `src/stores/index.ts`
- Create: `src/stores/recipes.ts`
- Create: `src/stores/filter.ts`

**Step 1: 配置 Pinia**

创建 `src/stores/index.ts`:

```typescript
import { createPinia } from 'pinia'

export const pinia = createPinia()
```

**Step 2: 创建菜谱 Store**

创建 `src/stores/recipes.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Recipe } from '@/types'
import { getAllRecipes, saveRecipes } from '@/db/recipes'
import { getLastSyncTime, setLastSyncTime, shouldSync } from '@/db/sync'
import { fetchRecipesFromNotion } from '@/api/notion'
import { transformAllRecipes } from '@/api/transform'

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number | null>(null)
  const error = ref<string | null>(null)

  // 从 IndexedDB 加载数据
  async function loadFromDB() {
    isLoading.value = true
    try {
      recipes.value = await getAllRecipes()
      lastSyncTime.value = await getLastSyncTime()
    } catch (e) {
      error.value = '加载本地数据失败'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  // 从 Notion 同步数据（后台执行）
  async function syncFromNotion() {
    if (isSyncing.value) return

    isSyncing.value = true
    error.value = null

    try {
      const notionRecipes = await fetchRecipesFromNotion()
      const transformed = transformAllRecipes(notionRecipes)
      await saveRecipes(transformed)
      await setLastSyncTime(Date.now())

      // 不立即更新 UI，下次打开时生效
      console.log(`同步完成，共 ${transformed.length} 条菜谱`)
    } catch (e) {
      error.value = '同步失败，将使用本地缓存'
      console.error(e)
    } finally {
      isSyncing.value = false
    }
  }

  // 初始化：加载本地数据，检查是否需要后台同步
  async function initialize() {
    await loadFromDB()

    // 检查是否需要同步
    if (await shouldSync()) {
      // 后台同步，不阻塞 UI
      syncFromNotion()
    }
  }

  // 提取所有筛选选项
  const filterOptions = computed(() => {
    const cuisines = new Set<string>()
    const cookingMethods = new Set<string>()
    const ingredients = new Set<string>()
    const types = new Set<string>()
    const proficiencies = new Set<string>()

    recipes.value.forEach(recipe => {
      recipe.cuisines.forEach(c => cuisines.add(c))
      if (recipe.cookingMethod) cookingMethods.add(recipe.cookingMethod)
      recipe.ingredients.forEach(i => ingredients.add(i))
      if (recipe.type) types.add(recipe.type)
      if (recipe.proficiency) proficiencies.add(recipe.proficiency)
    })

    return {
      cuisines: Array.from(cuisines).sort(),
      cookingMethods: Array.from(cookingMethods).sort(),
      ingredients: Array.from(ingredients).sort(),
      types: Array.from(types).sort(),
      proficiencies: Array.from(proficiencies).sort()
    }
  })

  return {
    recipes,
    isLoading,
    isSyncing,
    lastSyncTime,
    error,
    filterOptions,
    loadFromDB,
    syncFromNotion,
    initialize
  }
})
```

**Step 3: 创建筛选 Store**

创建 `src/stores/filter.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterState, Recipe } from '@/types'
import { useRecipeStore } from './recipes'

export const useFilterStore = defineStore('filter', () => {
  const filters = ref<FilterState>({
    cuisines: [],
    cookingMethod: [],
    ingredients: [],
    type: [],
    proficiency: []
  })

  const recipeStore = useRecipeStore()

  // 筛选后的菜谱
  const filteredRecipes = computed(() => {
    return recipeStore.recipes.filter(recipe => {
      // 菜系：OR 逻辑（选中任一即可）
      if (filters.value.cuisines.length > 0) {
        if (!filters.value.cuisines.some(c => recipe.cuisines.includes(c))) {
          return false
        }
      }

      // 做法：OR 逻辑
      if (filters.value.cookingMethod.length > 0) {
        if (!filters.value.cookingMethod.includes(recipe.cookingMethod)) {
          return false
        }
      }

      // 主材料：OR 逻辑
      if (filters.value.ingredients.length > 0) {
        if (!filters.value.ingredients.some(i => recipe.ingredients.includes(i))) {
          return false
        }
      }

      // 类型：OR 逻辑
      if (filters.value.type.length > 0) {
        if (!filters.value.type.includes(recipe.type)) {
          return false
        }
      }

      // 擅长程度：OR 逻辑
      if (filters.value.proficiency.length > 0) {
        if (!filters.value.proficiency.includes(recipe.proficiency)) {
          return false
        }
      }

      return true
    })
  })

  // 切换筛选项
  function toggleFilter(dimension: keyof FilterState, value: string) {
    const arr = filters.value[dimension]
    const index = arr.indexOf(value)
    if (index === -1) {
      arr.push(value)
    } else {
      arr.splice(index, 1)
    }
  }

  // 清除某个维度的筛选
  function clearDimension(dimension: keyof FilterState) {
    filters.value[dimension] = []
  }

  // 清除所有筛选
  function clearAll() {
    filters.value = {
      cuisines: [],
      cookingMethod: [],
      ingredients: [],
      type: [],
      proficiency: []
    }
  }

  // 随机选一个菜
  function getRandomRecipe(): Recipe | null {
    const recipes = filteredRecipes.value
    if (recipes.length === 0) return null
    const index = Math.floor(Math.random() * recipes.length)
    return recipes[index]
  }

  return {
    filters,
    filteredRecipes,
    toggleFilter,
    clearDimension,
    clearAll,
    getRandomRecipe
  }
})
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: implement Pinia stores for recipes and filters"
```

---

## Task 7: 创建 UI 组件 - 筛选标签

**Files:**
- Create: `src/components/FilterSection.vue`
- Create: `src/components/FilterTag.vue`
- Create: `src/components/RandomButton.vue`

**Step 1: 创建筛选标签组件**

创建 `src/components/FilterTag.vue`:

```vue
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
```

**Step 2: 创建筛选区域组件**

创建 `src/components/FilterSection.vue`:

```vue
<template>
  <div class="filter-section">
    <div class="filter-header">
      <span class="filter-title">{{ title }}</span>
      <button
        v-if="selectedCount > 0"
        class="clear-btn"
        @click="$emit('clear')"
      >
        清除
      </button>
      <button class="random-btn" @click="$emit('random')">
        🎲
      </button>
    </div>
    <div class="filter-tags">
      <FilterTag
        v-for="option in options"
        :key="option"
        :label="option"
        :is-active="selected.includes(option)"
        @toggle="$emit('toggle', option)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FilterTag from './FilterTag.vue'

const props = defineProps<{
  title: string
  options: string[]
  selected: string[]
}>()

defineEmits<{
  toggle: [value: string]
  clear: []
  random: []
}>()

const selectedCount = computed(() => props.selected.length)
</script>

<style scoped>
.filter-section {
  margin-bottom: 16px;
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.filter-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.clear-btn {
  font-size: 12px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
}

.random-btn {
  margin-left: auto;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
}

.random-btn:active {
  background: #f5f5f5;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  margin: -4px;
}
</style>
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add filter UI components"
```

---

## Task 8: 创建 UI 组件 - 菜谱列表与结果展示

**Files:**
- Create: `src/components/RecipeList.vue`
- Create: `src/components/RecipeCard.vue`
- Create: `src/components/RandomResult.vue`

**Step 1: 创建菜谱卡片组件**

创建 `src/components/RecipeCard.vue`:

```vue
<template>
  <div class="recipe-card" @click="openInNotion">
    <div class="recipe-name">{{ recipe.name }}</div>
    <div class="recipe-tags">
      <span v-if="recipe.type" class="tag type">{{ recipe.type }}</span>
      <span v-if="recipe.cookingMethod" class="tag method">{{ recipe.cookingMethod }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'

const props = defineProps<{
  recipe: Recipe
}>()

function openInNotion() {
  window.open(props.recipe.notionUrl, '_blank')
}
</script>

<style scoped>
.recipe-card {
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recipe-card:active {
  transform: scale(0.98);
}

.recipe-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.recipe-tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag.type {
  background: #E3F2FD;
  color: #1976D2;
}

.tag.method {
  background: #FFF3E0;
  color: #F57C00;
}
</style>
```

**Step 2: 创建菜谱列表组件**

创建 `src/components/RecipeList.vue`:

```vue
<template>
  <div class="recipe-list">
    <div class="list-header">
      <span>共 {{ recipes.length }} 道菜</span>
    </div>
    <div class="list-content">
      <RecipeCard
        v-for="recipe in recipes"
        :key="recipe.id"
        :recipe="recipe"
      />
      <div v-if="recipes.length === 0" class="empty">
        没有找到符合条件的菜品
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'
import RecipeCard from './RecipeCard.vue'

defineProps<{
  recipes: Recipe[]
}>()
</script>

<style scoped>
.recipe-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.list-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-bottom: 80px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>
```

**Step 3: 创建随机结果弹窗组件**

创建 `src/components/RandomResult.vue`:

```vue
<template>
  <Teleport to="body">
    <div v-if="visible" class="random-overlay" @click="$emit('close')">
      <div class="random-modal" @click.stop>
        <div class="random-title">今天吃</div>
        <div class="random-name">{{ recipe?.name }}</div>
        <div class="random-tags">
          <span v-if="recipe?.type" class="tag">{{ recipe.type }}</span>
          <span v-if="recipe?.cookingMethod" class="tag">{{ recipe.cookingMethod }}</span>
        </div>
        <div class="random-actions">
          <button class="btn-again" @click="$emit('again')">再来一个</button>
          <button class="btn-go" @click="openNotion">查看菜谱</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Recipe } from '@/types'

const props = defineProps<{
  visible: boolean
  recipe: Recipe | null
}>()

defineEmits<{
  close: []
  again: []
}>()

function openNotion() {
  if (props.recipe) {
    window.open(props.recipe.notionUrl, '_blank')
  }
}
</script>

<style scoped>
.random-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.random-modal {
  background: #fff;
  border-radius: 20px;
  padding: 32px 24px;
  width: 80%;
  max-width: 320px;
  text-align: center;
}

.random-title {
  font-size: 18px;
  color: #666;
  margin-bottom: 16px;
}

.random-name {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}

.random-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.tag {
  font-size: 14px;
  padding: 4px 12px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #666;
}

.random-actions {
  display: flex;
  gap: 12px;
}

.btn-again, .btn-go {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}

.btn-again {
  background: #f5f5f5;
  color: #333;
}

.btn-go {
  background: #4CAF50;
  color: #fff;
}
</style>
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add recipe list and random result components"
```

---

## Task 9: 创建搜索组件（小红书跳转）

**Files:**
- Create: `src/components/SearchBar.vue`

**Step 1: 创建搜索栏组件**

创建 `src/components/SearchBar.vue`:

```vue
<template>
  <div class="search-bar">
    <input
      v-model="searchText"
      type="text"
      placeholder="搜索菜谱（跳转小红书）"
      @keyup.enter="searchInXiaohongshu"
    />
    <button class="search-btn" @click="searchInXiaohongshu">
      搜索
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchText = ref('')

function searchInXiaohongshu() {
  if (!searchText.value.trim()) return

  // 小红书 App URL Scheme
  // 优先尝试打开 App，失败则打开网页版
  const query = encodeURIComponent(searchText.value.trim())

  // 尝试打开小红书 App
  const appUrl = `xhsdiscover://search?keyword=${query}`
  const webUrl = `https://www.xiaohongshu.com/search_result?keyword=${query}`

  // 创建隐藏 iframe 尝试打开 App
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = appUrl
  document.body.appendChild(iframe)

  // 设置超时，如果 App 没打开则打开网页
  setTimeout(() => {
    document.body.removeChild(iframe)
    // 如果页面还在前台，说明 App 没打开，打开网页版
    if (!document.hidden) {
      window.open(webUrl, '_blank')
    }
  }, 2000)
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  padding: 12px 0;
}

input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
}

input:focus {
  border-color: #4CAF50;
}

.search-btn {
  padding: 12px 20px;
  background: #FF2442;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}
</style>
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add search bar with Xiaohongshu redirect"
```

---

## Task 10: 组装主页面

**Files:**
- Modify: `src/App.vue`
- Modify: `src/main.ts`
- Create: `src/views/Home.vue`

**Step 1: 配置 main.ts**

修改 `src/main.ts`:

```typescript
import { createApp } from 'vue'
import { pinia } from './stores'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(pinia)
app.mount('#app')
```

**Step 2: 创建主页面**

创建 `src/views/Home.vue`:

```vue
<template>
  <div class="home">
    <!-- 顶部标题 -->
    <header class="header">
      <h1>今天吃啥</h1>
      <span v-if="recipeStore.isSyncing" class="sync-status">同步中...</span>
    </header>

    <!-- 搜索栏 -->
    <SearchBar />

    <!-- 快捷入口 -->
    <div class="quick-actions">
      <button class="action-btn primary" @click="randomFromAll">
        🎲 随便吃点
      </button>
      <button
        class="action-btn"
        :class="{ active: showFavorites }"
        @click="toggleFavorites"
      >
        ⭐ 拿手菜
      </button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-area">
      <FilterSection
        title="菜系"
        :options="recipeStore.filterOptions.cuisines"
        :selected="filterStore.filters.cuisines"
        @toggle="(v) => filterStore.toggleFilter('cuisines', v)"
        @clear="filterStore.clearDimension('cuisines')"
        @random="randomFromDimension('cuisines')"
      />
      <FilterSection
        title="做法"
        :options="recipeStore.filterOptions.cookingMethods"
        :selected="filterStore.filters.cookingMethod"
        @toggle="(v) => filterStore.toggleFilter('cookingMethod', v)"
        @clear="filterStore.clearDimension('cookingMethod')"
        @random="randomFromDimension('cookingMethod')"
      />
      <FilterSection
        title="主材料"
        :options="recipeStore.filterOptions.ingredients"
        :selected="filterStore.filters.ingredients"
        @toggle="(v) => filterStore.toggleFilter('ingredients', v)"
        @clear="filterStore.clearDimension('ingredients')"
        @random="randomFromDimension('ingredients')"
      />
      <FilterSection
        title="类型"
        :options="recipeStore.filterOptions.types"
        :selected="filterStore.filters.type"
        @toggle="(v) => filterStore.toggleFilter('type', v)"
        @clear="filterStore.clearDimension('type')"
        @random="randomFromDimension('type')"
      />
    </div>

    <!-- 菜谱列表 -->
    <RecipeList :recipes="filterStore.filteredRecipes" />

    <!-- 随机结果弹窗 -->
    <RandomResult
      :visible="showRandomResult"
      :recipe="randomRecipe"
      @close="showRandomResult = false"
      @again="doRandom"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecipeStore } from '@/stores/recipes'
import { useFilterStore } from '@/stores/filter'
import type { Recipe, FilterState } from '@/types'
import SearchBar from '@/components/SearchBar.vue'
import FilterSection from '@/components/FilterSection.vue'
import RecipeList from '@/components/RecipeList.vue'
import RandomResult from '@/components/RandomResult.vue'

const recipeStore = useRecipeStore()
const filterStore = useFilterStore()

const showRandomResult = ref(false)
const randomRecipe = ref<Recipe | null>(null)
const showFavorites = ref(false)

onMounted(async () => {
  await recipeStore.initialize()
})

function doRandom() {
  randomRecipe.value = filterStore.getRandomRecipe()
  showRandomResult.value = true
}

function randomFromAll() {
  filterStore.clearAll()
  doRandom()
}

function randomFromDimension(dimension: keyof FilterState) {
  doRandom()
}

function toggleFavorites() {
  showFavorites.value = !showFavorites.value
  if (showFavorites.value) {
    // 筛选拿手菜（假设"擅长"表示拿手菜）
    filterStore.clearAll()
    filterStore.toggleFilter('proficiency', '擅长')
  } else {
    filterStore.clearDimension('proficiency')
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding: 16px;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.sync-status {
  font-size: 12px;
  color: #999;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #4CAF50;
  border-color: #4CAF50;
  color: #fff;
}

.action-btn.active {
  background: #FFF3E0;
  border-color: #FF9800;
  color: #FF9800;
}

.filter-area {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}
</style>
```

**Step 3: 修改 App.vue**

修改 `src/App.vue`:

```vue
<template>
  <Home />
</template>

<script setup lang="ts">
import Home from '@/views/Home.vue'
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
```

**Step 4: 配置路径别名**

修改 `vite.config.ts` 添加路径别名:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      // ... 之前的 PWA 配置
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

修改 `tsconfig.json` 添加路径映射:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: assemble home page with all components"
```

---

## Task 11: 添加全局样式和移动端优化

**Files:**
- Modify: `src/style.css`
- Modify: `index.html`

**Step 1: 添加全局样式**

修改 `src/style.css`:

```css
:root {
  --primary-color: #4CAF50;
  --text-primary: #333;
  --text-secondary: #666;
  --text-tertiary: #999;
  --border-color: #e0e0e0;
  --bg-primary: #fff;
  --bg-secondary: #f5f5f5;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html {
  font-size: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.5;
}

/* 安全区域适配 */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 禁止页面缩放 */
html {
  touch-action: manipulation;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 按钮通用样式 */
button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  outline: none;
  -webkit-appearance: none;
}

/* 输入框通用样式 */
input {
  font-family: inherit;
  -webkit-appearance: none;
}
```

**Step 2: 优化 HTML meta 标签**

修改 `index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#4CAF50" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="今天吃啥" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <title>今天吃啥</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add global styles and mobile optimization"
```

---

## Task 12: 测试与部署

**Files:**
- Create: `vercel.json`
- Update: `.gitignore`

**Step 1: 创建 Vercel 配置**

创建 `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Step 2: 更新 .gitignore**

确保 `.gitignore` 包含:

```
node_modules
dist
.env.local
.env.*.local
*.log
```

**Step 3: 本地测试**

```bash
# 创建 .env.local 并填入 Notion API Key
cp .env.example .env.local
# 编辑 .env.local 填入真实的 API Key

# 构建并预览
npm run build
npm run preview
```

Expected: 在手机上访问预览地址，能够：
1. 看到筛选标签
2. 点击筛选后看到结果
3. 点击随机按钮弹出结果

**Step 4: 部署到 Vercel**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录并部署
vercel login
vercel

# 设置环境变量（在 Vercel 控制台）
# VITE_NOTION_API_KEY=xxx
# VITE_NOTION_DATABASE_ID=xxx
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: add Vercel deployment config"
```

---

## 验收清单

- [ ] PWA 可安装到手机主屏幕
- [ ] 首次打开能从 Notion 同步数据
- [ ] 离线状态下能正常使用
- [ ] 五个筛选维度都能正常工作
- [ ] 同维度多选是 OR 逻辑
- [ ] 跨维度筛选是 AND 逻辑
- [ ] 随机按钮能在当前筛选结果中随机
- [ ] 小红书搜索能正常跳转
- [ ] 点击菜品能跳转 Notion 详情页
- [ ] 每日后台同步正常工作

---

## 后续可扩展

1. **显示完整菜谱**：在 App 内展示菜谱内容，而非跳转 Notion
2. **收藏功能**：本地收藏常做的菜
3. **历史记录**：记录最近做过的菜，避免重复
4. **食材库存**：结合冰箱里的食材推荐菜品
