# Supabase 迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将"今天吃啥"后端从 Notion 迁移到 Supabase，新增全功能菜谱详情页，支持 OpenClaw 录入。

**Architecture:** 前端直连 Supabase（anon key 只读），OpenClaw 通过 service_role key 写入。去掉 Vercel Serverless 代理层和 IndexedDB 缓存层，Supabase 自动生成 REST API。新增 vue-router 路由和菜谱详情页。

**Tech Stack:** Vue 3 + Vite + TypeScript + Pinia + @supabase/supabase-js + vue-router + vite-plugin-pwa

---

## Task 1: Supabase 项目初始化和数据库建表

**前置条件：** 用户需要先在 https://supabase.com 创建一个项目，获取 Project URL 和 API Keys。

**Step 1: 用户在 Supabase Dashboard 创建项目**

提示用户：
1. 前往 https://supabase.com → New Project
2. 选择区域（推荐 Northeast Asia / Singapore）
3. 记录以下信息：
   - Project URL: `https://xxx.supabase.co`
   - anon key（公开，前端用）
   - service_role key（私密，OpenClaw 用）

**Step 2: 在 Supabase SQL Editor 执行建表 SQL**

提示用户在 Supabase Dashboard → SQL Editor 中执行以下 SQL：

```sql
-- 菜谱主表
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisines text[] DEFAULT '{}',
  cooking_method text DEFAULT '',
  ingredients text[] DEFAULT '{}',
  type text DEFAULT '',
  proficiency text DEFAULT '',
  cooking_time integer,
  difficulty text DEFAULT '',
  tips text DEFAULT '',
  cover_image text DEFAULT '',
  external_url text DEFAULT '',
  notion_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 食材用量表
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount text DEFAULT '',
  sort_order integer DEFAULT 0
);

-- 烹饪步骤表
CREATE TABLE recipe_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  description text NOT NULL,
  image text DEFAULT ''
);

-- 索引
CREATE INDEX idx_recipes_cuisines ON recipes USING GIN (cuisines);
CREATE INDEX idx_recipes_ingredients ON recipes USING GIN (ingredients);
CREATE INDEX idx_recipes_type ON recipes (type);
CREATE INDEX idx_recipes_proficiency ON recipes (proficiency);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe_id);
CREATE INDEX idx_recipe_steps_recipe ON recipe_steps (recipe_id);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 启用 RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

-- 公开只读策略
CREATE POLICY "公开只读" ON recipes FOR SELECT USING (true);
CREATE POLICY "公开只读" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "公开只读" ON recipe_steps FOR SELECT USING (true);

-- Storage bucket（菜谱图片）
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true);

-- Storage 公开读取策略
CREATE POLICY "公开读取图片" ON storage.objects FOR SELECT USING (bucket_id = 'recipe-images');
```

**Step 3: 配置本地环境变量**

创建/更新 `.env.local`：
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

保留现有 Notion 变量（迁移脚本需要）：
```
VITE_NOTION_API_KEY=xxx
VITE_NOTION_DATABASE_ID=2aeaf7ade59680ec98d5e8923028a5d2
```

**Step 4: Commit**

不需要 commit（无代码变更，只是环境配置）。

---

## Task 2: 安装依赖 + Supabase 客户端初始化

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `package.json`

**Step 1: 安装 @supabase/supabase-js**

Run: `npm install @supabase/supabase-js`

**Step 2: 创建 Supabase 客户端**

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 3: 验证连接**

启动 dev server（`npm run dev`），在浏览器控制台测试：
```javascript
// 应该返回空数组（表存在但没数据）
const { data, error } = await supabase.from('recipes').select('*')
console.log(data, error)
```

**Step 4: Commit**

```bash
git add src/lib/supabase.ts package.json package-lock.json
git commit -m "feat: 添加 Supabase 客户端依赖和初始化"
```

---

## Task 3: 数据迁移脚本

**Files:**
- Create: `scripts/migrate-from-notion.ts`

**Step 1: 创建迁移脚本**

Create `scripts/migrate-from-notion.ts`:

```typescript
/**
 * 迁移脚本：从 Notion 导入菜谱到 Supabase
 *
 * 用法：npx tsx scripts/migrate-from-notion.ts
 *
 * 需要环境变量（从 .env.local 读取）：
 * - VITE_NOTION_API_KEY
 * - VITE_NOTION_DATABASE_ID
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (手动设置，不提交到代码)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const NOTION_API_KEY = process.env.VITE_NOTION_API_KEY!
const NOTION_DATABASE_ID = process.env.VITE_NOTION_DATABASE_ID!
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!NOTION_API_KEY || !NOTION_DATABASE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('缺少必要的环境变量，请检查 .env.local 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 使用 service_role key 进行写入
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface NotionRecipe {
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

async function fetchAllFromNotion(): Promise<NotionRecipe[]> {
  const recipes: NotionRecipe[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 }
    if (startCursor) body.start_cursor = startCursor

    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()
    recipes.push(...data.results)
    hasMore = data.has_more
    startCursor = data.next_cursor
  }

  return recipes
}

function transformRecipe(notion: NotionRecipe) {
  return {
    name: notion.properties.Name?.title?.[0]?.plain_text || '未命名菜品',
    cuisines: notion.properties.菜系?.multi_select?.map(item => item.name) || [],
    cooking_method: notion.properties.做法?.select?.name || '',
    ingredients: notion.properties.主要食材?.multi_select?.map(item => item.name) || [],
    type: notion.properties.类型?.select?.name || '',
    proficiency: notion.properties.擅长程度?.select?.name || '',
    notion_url: notion.url,
    // 新字段暂空，后续通过 OpenClaw 补充
    cooking_time: null,
    difficulty: '',
    tips: '',
    cover_image: '',
    external_url: ''
  }
}

async function main() {
  console.log('📥 正在从 Notion 获取菜谱...')
  const notionRecipes = await fetchAllFromNotion()
  console.log(`✅ 获取到 ${notionRecipes.length} 道菜谱`)

  const recipes = notionRecipes.map(transformRecipe)

  console.log('📤 正在写入 Supabase...')
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipes)
    .select('id, name')

  if (error) {
    console.error('❌ 写入失败:', error)
    process.exit(1)
  }

  console.log(`✅ 成功导入 ${data.length} 道菜谱到 Supabase`)
  data.forEach(r => console.log(`  - ${r.name}`))
}

main().catch(console.error)
```

**Step 2: 安装脚本依赖**

Run: `npm install -D tsx dotenv`

**Step 3: 运行迁移**

提示用户先设置 service_role key 环境变量：
```bash
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key
npx tsx scripts/migrate-from-notion.ts
```

预期输出：
```
📥 正在从 Notion 获取菜谱...
✅ 获取到 N 道菜谱
📤 正在写入 Supabase...
✅ 成功导入 N 道菜谱到 Supabase
  - 红烧肉
  - 西红柿炒蛋
  - ...
```

**Step 4: 在 Supabase Dashboard 验证数据**

提示用户前往 Supabase → Table Editor → recipes 表查看数据。

**Step 5: Commit**

```bash
git add scripts/migrate-from-notion.ts package.json package-lock.json
git commit -m "feat: 添加 Notion → Supabase 数据迁移脚本"
```

---

## Task 4: 更新类型定义

**Files:**
- Modify: `src/types/recipe.ts`
- Modify: `src/types/filter.ts`

**Step 1: 更新 Recipe 接口**

修改 `src/types/recipe.ts`，替换为：

```typescript
export interface Recipe {
  id: string
  name: string
  cuisines: string[]
  cooking_method: string
  ingredients: string[]
  type: string
  proficiency: string
  cooking_time: number | null
  difficulty: string
  tips: string
  cover_image: string
  external_url: string
  notion_url: string
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  name: string
  amount: string
  sort_order: number
}

export interface RecipeStep {
  id: string
  recipe_id: string
  step_number: number
  description: string
  image: string
}

export interface RecipeWithDetails extends Recipe {
  recipe_ingredients: RecipeIngredient[]
  recipe_steps: RecipeStep[]
}

export interface MenuItem {
  id: string
  name: string
  isCustom: boolean
}
```

注意：字段名从 camelCase (`cookingMethod`) 改为 snake_case (`cooking_method`)，与 Supabase/PostgreSQL 约定一致。

**Step 2: 更新 FilterConfig**

修改 `src/types/filter.ts`，删除 `notionProperty` 字段（不再需要）：

```typescript
export type FilterDimension = 'cuisines' | 'cooking_method' | 'ingredients' | 'type' | 'proficiency'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterState {
  cuisines: string[]
  cooking_method: string[]
  ingredients: string[]
  type: string[]
  proficiency: string[]
}

export interface FilterConfig {
  key: FilterDimension
  label: string
}

export const FILTER_CONFIGS: FilterConfig[] = [
  { key: 'cuisines', label: '菜系' },
  { key: 'cooking_method', label: '做法' },
  { key: 'ingredients', label: '主材料' },
  { key: 'type', label: '类型' },
  { key: 'proficiency', label: '拿手菜' }
]
```

**Step 3: 检查 types/index.ts 的导出**

确认 `src/types/index.ts` 导出了新增的类型（RecipeIngredient, RecipeStep, RecipeWithDetails）。

**Step 4: 运行类型检查**

Run: `npx vue-tsc --noEmit`

预期：会有很多类型错误（因为 store 和 component 还在用旧字段名），这是正常的。记录错误数量，后续任务会逐一修复。

**Step 5: Commit**

```bash
git add src/types/
git commit -m "feat: 更新类型定义，适配 Supabase 数据模型"
```

---

## Task 5: 重写 Recipe Store（替换 Notion + IndexedDB → Supabase）

**Files:**
- Rewrite: `src/stores/recipes.ts`

**Step 1: 重写 recipes store**

替换 `src/stores/recipes.ts` 的全部内容：

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/types/recipe'

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 从菜谱列表动态生成筛选选项
  const filterOptions = computed(() => {
    const cuisineSet = new Set<string>()
    const methodSet = new Set<string>()
    const ingredientSet = new Set<string>()
    const typeSet = new Set<string>()
    const proficiencySet = new Set<string>()

    for (const recipe of recipes.value) {
      recipe.cuisines.forEach(c => cuisineSet.add(c))
      if (recipe.cooking_method) methodSet.add(recipe.cooking_method)
      recipe.ingredients.forEach(i => ingredientSet.add(i))
      if (recipe.type) typeSet.add(recipe.type)
      if (recipe.proficiency) proficiencySet.add(recipe.proficiency)
    }

    // 主材料优先排序：肉类 + 豆腐优先
    const ingredientPriority = ['牛', '猪', '羊', '鸡', '豆腐']
    const sortedIngredients = [...ingredientSet].sort((a, b) => {
      const aPriority = ingredientPriority.findIndex(p => a.includes(p))
      const bPriority = ingredientPriority.findIndex(p => b.includes(p))
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority
      if (aPriority !== -1) return -1
      if (bPriority !== -1) return 1
      return a.localeCompare(b, 'zh-CN')
    })

    return {
      cuisines: [...cuisineSet].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      cookingMethods: [...methodSet].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      ingredients: sortedIngredients,
      types: [...typeSet].sort((a, b) => a.localeCompare(b, 'zh-CN')),
      proficiencies: [...proficiencySet].sort((a, b) => a.localeCompare(b, 'zh-CN'))
    }
  })

  async function fetchRecipes() {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      recipes.value = data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载菜谱失败'
      console.error('加载菜谱失败:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function initialize() {
    await fetchRecipes()
  }

  return {
    recipes,
    isLoading,
    error,
    filterOptions,
    fetchRecipes,
    initialize
  }
})
```

**Step 2: 运行 dev server 验证数据加载**

Run: `npm run dev`

打开浏览器，确认菜谱列表正常加载（数据来自 Supabase）。

**Step 3: Commit**

```bash
git add src/stores/recipes.ts
git commit -m "feat: 重写 recipe store，从 Supabase 加载数据"
```

---

## Task 6: 更新 Filter Store（适配 snake_case 字段名）

**Files:**
- Modify: `src/stores/filter.ts`

**Step 1: 更新字段名引用**

修改 `src/stores/filter.ts` 中所有对 `cookingMethod` 的引用改为 `cooking_method`。

具体改动点（在 `filteredRecipes` computed 中）：
- `recipe.cookingMethod` → `recipe.cooking_method`
- `filters.value.cookingMethod` → `filters.value.cooking_method`

同时更新 `FilterState` 初始化中的 key：
- `cookingMethod: []` → `cooking_method: []`

**Step 2: 验证筛选功能**

在浏览器中测试各筛选维度是否正常工作。

**Step 3: Commit**

```bash
git add src/stores/filter.ts
git commit -m "fix: 适配 filter store 字段名为 snake_case"
```

---

## Task 7: 更新现有组件（适配新字段名）

**Files:**
- Modify: `src/components/RecipeCard.vue`
- Modify: `src/components/RandomResult.vue`
- Modify: `src/components/FilterSection.vue`
- Modify: `src/components/FilterSummaryBar.vue`
- Modify: `src/views/Home.vue`

**Step 1: 更新 RecipeCard.vue**

- `recipe.cookingMethod` → `recipe.cooking_method`
- 移除 `openInNotion()` 函数和对应的 Notion 跳转按钮
- "→" 按钮改为跳转到应用内详情页（暂用 `console.log` 占位，Task 10 实现路由后替换）

**Step 2: 更新 RandomResult.vue**

- `recipe.cookingMethod` → `recipe.cooking_method`
- "看菜谱" 按钮从跳转 Notion 改为跳转应用内详情页（暂用占位）

**Step 3: 更新 FilterSection.vue 和 FilterSummaryBar.vue**

- 如有引用 `cookingMethod`，统一改为 `cooking_method`

**Step 4: 更新 Home.vue**

- 移除 `isSyncing` 相关的同步状态 UI（不再需要同步指示器）
- 移除对 `lastSyncTime` 的引用
- 确认 `recipeStore.initialize()` 调用仍在 `onMounted` 中

**Step 5: 运行 dev server 全面验证**

Run: `npm run dev`

验证：
- 菜谱列表正常显示
- 筛选功能正常
- 搜索功能正常
- 随机推荐正常
- 点菜功能正常

**Step 6: Commit**

```bash
git add src/components/ src/views/
git commit -m "fix: 更新所有组件适配 Supabase snake_case 字段名"
```

---

## Task 8: 删除 Notion 和 IndexedDB 相关代码

**Files:**
- Delete: `src/api/notion.ts`
- Delete: `src/api/transform.ts`
- Delete: `src/db/index.ts`
- Delete: `src/db/recipes.ts`
- Delete: `src/db/sync.ts`
- Delete: `api/notion.ts` (Vercel Serverless Function)
- Modify: `vite.config.ts` (移除 Notion 代理)

**Step 1: 删除 src/api/ 下的 Notion 文件**

删除 `src/api/notion.ts` 和 `src/api/transform.ts`。

如果 `src/api/` 目录下没有其他文件了，删除整个目录。

**Step 2: 删除 src/db/ 整个目录**

删除 `src/db/index.ts`、`src/db/recipes.ts`、`src/db/sync.ts` 以及 `src/db/` 目录。

**Step 3: 删除 Vercel Notion Function**

删除 `api/notion.ts`。保留 `api/send-menu.ts`（菜单邮件发送功能仍需要）。

**Step 4: 清理 vite.config.ts**

移除 Notion API 代理配置：

```typescript
// 删除这段 proxy 配置：
proxy: {
  '/api/notion': {
    target: 'https://api.notion.com',
    ...
  }
}
```

更新 PWA workbox 配置，移除 Notion API 缓存规则：

```typescript
// 删除这段 runtimeCaching：
{
  urlPattern: /^https:\/\/api\.notion\.com\/.*/i,
  handler: 'NetworkFirst',
  cacheName: 'notion-api-cache'
}
```

可考虑新增 Supabase API 缓存规则（如果需要离线支持）。

**Step 5: 卸载不再需要的依赖**

Run: `npm uninstall idb`

**Step 6: 运行类型检查**

Run: `npx vue-tsc --noEmit`

预期：应该无类型错误（如果有，修复遗漏的引用）。

**Step 7: 运行 dev server 验证应用正常**

Run: `npm run dev`

**Step 8: Commit**

```bash
git add -A
git commit -m "refactor: 移除 Notion API、IndexedDB 层和 Vite 代理配置"
```

---

## Task 9: 添加 Supabase API 层（获取菜谱详情）

**Files:**
- Create: `src/api/recipes.ts`

**Step 1: 创建菜谱 API 模块**

Create `src/api/recipes.ts`:

```typescript
import { supabase } from '@/lib/supabase'
import type { Recipe, RecipeWithDetails } from '@/types/recipe'

export async function fetchAllRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchRecipeById(id: string): Promise<RecipeWithDetails | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (id, name, amount, sort_order),
      recipe_steps (id, step_number, description, image)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }

  // 排序子表数据
  if (data) {
    data.recipe_ingredients?.sort((a: any, b: any) => a.sort_order - b.sort_order)
    data.recipe_steps?.sort((a: any, b: any) => a.step_number - b.step_number)
  }

  return data as RecipeWithDetails
}
```

**Step 2: 更新 recipe store 使用新 API 模块**

修改 `src/stores/recipes.ts` 中的 `fetchRecipes`，改为调用 `fetchAllRecipes()`：

```typescript
import { fetchAllRecipes } from '@/api/recipes'

// 在 fetchRecipes 函数中：
const data = await fetchAllRecipes()
recipes.value = data
```

**Step 3: Commit**

```bash
git add src/api/recipes.ts src/stores/recipes.ts
git commit -m "feat: 添加 Supabase 菜谱 API 层，支持详情查询"
```

---

## Task 10: 设置 Vue Router

**Files:**
- Create: `src/router/index.ts`
- Modify: `src/main.ts`
- Modify: `src/App.vue`

**Step 1: 创建路由配置**

注意：`vue-router` 已在 `package.json` 中（版本 ^4.6.4），无需安装。

Create `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/recipe/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetail.vue')
    }
  ]
})

export default router
```

**Step 2: 在 main.ts 中注册路由**

修改 `src/main.ts`，添加 router：

```typescript
import router from './router'

app.use(router)
```

确保 `app.use(router)` 在 `app.use(createPinia())` 之后。

**Step 3: 更新 App.vue**

修改 `src/App.vue`，将直接渲染 Home.vue 替换为 `<router-view />`：

```vue
<template>
  <router-view />
</template>
```

**Step 4: 验证现有页面仍正常**

Run: `npm run dev`

访问 `/`，确认 Home.vue 正常渲染。

**Step 5: Commit**

```bash
git add src/router/ src/main.ts src/App.vue
git commit -m "feat: 添加 vue-router，配置首页和菜谱详情路由"
```

---

## Task 11: 创建菜谱详情页

**Files:**
- Create: `src/views/RecipeDetail.vue`
- Create: `src/components/IngredientList.vue`
- Create: `src/components/StepList.vue`

**Step 1: 创建 IngredientList 组件**

Create `src/components/IngredientList.vue`:

```vue
<script setup lang="ts">
import type { RecipeIngredient } from '@/types/recipe'

defineProps<{
  ingredients: RecipeIngredient[]
}>()
</script>

<template>
  <section class="ingredient-list" v-if="ingredients.length > 0">
    <h3 class="section-title">食材清单</h3>
    <ul class="ingredients">
      <li v-for="item in ingredients" :key="item.id" class="ingredient-item">
        <span class="ingredient-name">{{ item.name }}</span>
        <span class="ingredient-dots"></span>
        <span class="ingredient-amount">{{ item.amount }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.section-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: var(--space-sm);
}

.ingredients {
  list-style: none;
  padding: 0;
}

.ingredient-item {
  display: flex;
  align-items: baseline;
  padding: var(--space-xs) 0;
  font-size: 0.95rem;
  color: var(--ink-light);
}

.ingredient-name {
  flex-shrink: 0;
}

.ingredient-dots {
  flex: 1;
  border-bottom: 1px dotted var(--cream-dark);
  margin: 0 var(--space-sm);
  min-width: 20px;
}

.ingredient-amount {
  flex-shrink: 0;
  color: var(--terracotta);
}
</style>
```

**Step 2: 创建 StepList 组件**

Create `src/components/StepList.vue`:

```vue
<script setup lang="ts">
import type { RecipeStep } from '@/types/recipe'

defineProps<{
  steps: RecipeStep[]
}>()
</script>

<template>
  <section class="step-list" v-if="steps.length > 0">
    <h3 class="section-title">烹饪步骤</h3>
    <ol class="steps">
      <li v-for="step in steps" :key="step.id" class="step-item">
        <div class="step-number">{{ step.step_number }}</div>
        <div class="step-content">
          <p class="step-desc">{{ step.description }}</p>
          <img
            v-if="step.image"
            :src="step.image"
            :alt="`步骤 ${step.step_number}`"
            class="step-image"
            loading="lazy"
          />
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.section-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: var(--space-sm);
}

.steps {
  list-style: none;
  padding: 0;
}

.step-item {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--cream-dark);
}

.step-item:last-child {
  border-bottom: none;
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: var(--terracotta);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-desc {
  font-size: 0.95rem;
  color: var(--ink-light);
  line-height: 1.6;
  margin: 0;
}

.step-image {
  width: 100%;
  border-radius: 8px;
  margin-top: var(--space-sm);
}
</style>
```

**Step 3: 创建 RecipeDetail 视图**

Create `src/views/RecipeDetail.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchRecipeById } from '@/api/recipes'
import type { RecipeWithDetails } from '@/types/recipe'
import IngredientList from '@/components/IngredientList.vue'
import StepList from '@/components/StepList.vue'

const route = useRoute()
const router = useRouter()

const recipe = ref<RecipeWithDetails | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const id = route.params.id as string
    recipe.value = await fetchRecipeById(id)
    if (!recipe.value) {
      error.value = '菜谱不存在'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    isLoading.value = false
  }
})

function goBack() {
  router.back()
}

function openExternalUrl(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="recipe-detail">
    <!-- 顶部导航 -->
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="detail-title" v-if="recipe">{{ recipe.name }}</h1>
    </header>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">加载中...</div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- 菜谱内容 -->
    <main v-else-if="recipe" class="detail-content">
      <!-- 封面图 -->
      <div v-if="recipe.cover_image" class="cover-wrapper">
        <img :src="recipe.cover_image" :alt="recipe.name" class="cover-image" />
      </div>

      <!-- 基础信息标签 -->
      <div class="meta-tags">
        <span v-for="cuisine in recipe.cuisines" :key="cuisine" class="tag cuisine-tag">{{ cuisine }}</span>
        <span v-if="recipe.cooking_method" class="tag method-tag">{{ recipe.cooking_method }}</span>
        <span v-if="recipe.difficulty" class="tag difficulty-tag">{{ recipe.difficulty }}</span>
        <span v-if="recipe.cooking_time" class="tag time-tag">⏱ {{ recipe.cooking_time }}min</span>
      </div>

      <!-- 外部链接 -->
      <div v-if="recipe.external_url" class="external-link" @click="openExternalUrl(recipe.external_url)">
        <span class="link-icon">📎</span>
        <span class="link-text">查看视频菜谱</span>
        <span class="link-arrow">→</span>
      </div>

      <!-- 食材清单 -->
      <IngredientList :ingredients="recipe.recipe_ingredients || []" />

      <!-- 烹饪步骤 -->
      <StepList :steps="recipe.recipe_steps || []" />

      <!-- 小贴士 -->
      <section v-if="recipe.tips" class="tips-section">
        <h3 class="section-title">💡 小贴士</h3>
        <p class="tips-text">{{ recipe.tips }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.recipe-detail {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-md);
  padding-bottom: calc(var(--space-xl) * 2);
  min-height: 100vh;
  background: var(--cream);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.back-btn {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--terracotta);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  border-radius: 8px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(199, 91, 57, 0.1);
}

.detail-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--ink);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-wrapper {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.cover-image {
  width: 100%;
  display: block;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.cuisine-tag {
  background: rgba(199, 91, 57, 0.12);
  color: var(--terracotta);
}

.method-tag {
  background: rgba(125, 148, 113, 0.15);
  color: var(--sage);
}

.difficulty-tag {
  background: rgba(212, 167, 44, 0.15);
  color: var(--mustard);
}

.time-tag {
  background: var(--cream-dark);
  color: var(--ink-light);
}

.external-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--paper);
  border: 1px solid var(--cream-dark);
  border-radius: 10px;
  margin-bottom: var(--space-md);
  cursor: pointer;
  transition: background 0.2s;
}

.external-link:hover {
  background: var(--cream-dark);
}

.link-text {
  flex: 1;
  font-size: 0.9rem;
  color: var(--terracotta);
}

.link-arrow {
  color: var(--terracotta);
}

.tips-section {
  margin-top: var(--space-md);
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: var(--space-sm);
}

.tips-text {
  font-size: 0.95rem;
  color: var(--ink-light);
  line-height: 1.6;
  background: rgba(212, 167, 44, 0.08);
  padding: var(--space-sm) var(--space-md);
  border-radius: 8px;
  border-left: 3px solid var(--mustard);
}

.loading, .error {
  text-align: center;
  padding: var(--space-xl);
  color: var(--ink-light);
  font-size: 1rem;
}

.error {
  color: var(--terracotta);
}
</style>
```

**Step 4: 验证详情页**

Run: `npm run dev`

在 Supabase 中找一个菜谱的 id，直接访问 `/recipe/<id>`，确认页面正常渲染（目前只有基础信息，没有食材和步骤——因为迁移只导入了基础数据）。

**Step 5: Commit**

```bash
git add src/views/RecipeDetail.vue src/components/IngredientList.vue src/components/StepList.vue
git commit -m "feat: 添加菜谱详情页，支持食材清单和步骤展示"
```

---

## Task 12: 更新组件跳转（Notion → 应用内路由）

**Files:**
- Modify: `src/components/RecipeCard.vue`
- Modify: `src/components/RandomResult.vue`

**Step 1: 更新 RecipeCard.vue**

添加 `useRouter`，将 Notion 跳转改为路由跳转：

```typescript
import { useRouter } from 'vue-router'
const router = useRouter()

function openRecipe() {
  router.push({ name: 'recipe-detail', params: { id: props.recipe.id } })
}
```

将模板中原来打开 Notion 的按钮/点击事件改为调用 `openRecipe()`。

**Step 2: 更新 RandomResult.vue**

同样添加路由跳转：

```typescript
import { useRouter } from 'vue-router'
const router = useRouter()

function viewRecipe() {
  router.push({ name: 'recipe-detail', params: { id: props.recipe.id } })
  emit('close')
}
```

将 "看菜谱" 按钮的事件从跳转 Notion 改为 `viewRecipe()`。

**Step 3: 验证跳转**

在浏览器中：
1. 点击菜谱卡片上的按钮 → 应跳转到详情页
2. 随机推荐弹窗中点击 "看菜谱" → 应跳转到详情页
3. 详情页点击 "← 返回" → 应返回首页

**Step 4: Commit**

```bash
git add src/components/RecipeCard.vue src/components/RandomResult.vue
git commit -m "feat: 更新菜谱跳转为应用内路由导航"
```

---

## Task 13: 更新 PWA 配置

**Files:**
- Modify: `vite.config.ts`

**Step 1: 更新 PWA workbox 配置**

在 `vite.config.ts` 中更新 PWA 的 runtimeCaching（已在 Task 8 移除 Notion 缓存规则），添加 Supabase API 缓存：

```typescript
runtimeCaching: [
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'supabase-api-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 // 24小时
      }
    }
  },
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'supabase-images-cache',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
      }
    }
  }
]
```

同时确认 `navigateFallback` 设置为 `index.html`（SPA 路由 fallback，使 `/recipe/:id` 路径在 PWA 中正常工作）。

**Step 2: 更新 Vercel rewrites**

创建或更新 `vercel.json`，确保 SPA 路由在 Vercel 上正常工作：

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

**Step 3: Commit**

```bash
git add vite.config.ts vercel.json
git commit -m "feat: 更新 PWA 缓存策略和 Vercel SPA 路由"
```

---

## Task 14: 构建验证 + 环境变量更新

**Step 1: 运行类型检查**

Run: `npx vue-tsc --noEmit`

预期：无错误。如有错误，逐一修复。

**Step 2: 运行生产构建**

Run: `npm run build`

预期：构建成功，无错误。

**Step 3: 本地预览生产构建**

Run: `npm run preview`

验证：
- 首页菜谱列表正常
- 筛选、搜索、随机推荐正常
- 菜谱详情页正常
- 点菜功能正常

**Step 4: 更新 Vercel 环境变量**

提示用户在 Vercel Dashboard 中：
1. 添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
2. 可以移除 `VITE_NOTION_API_KEY` 和 `VITE_NOTION_DATABASE_ID`（确认迁移完成后）

**Step 5: Commit（如有修复）**

```bash
git add -A
git commit -m "fix: 修复构建错误和类型问题"
```

---

## Task 15: 创建 OpenClaw Skill 配置

**Files:**
- Create: `openclaw/recipe-manager.md` (或 OpenClaw 要求的配置格式)

**Step 1: 创建 OpenClaw Skill 文档**

Create `openclaw/recipe-manager.md`:

```markdown
# 菜谱管理 Skill

## 连接信息

- Supabase URL: (从环境变量读取 SUPABASE_URL)
- API Key: (从环境变量读取 SUPABASE_SERVICE_ROLE_KEY)
- Storage Bucket: recipe-images

## 功能

### 1. 录入菜谱（手动描述）

当用户说"录入一道xxx"或"添加菜谱"时：

1. 创建菜谱基础记录：
   ```
   POST {SUPABASE_URL}/rest/v1/recipes
   Headers:
     apikey: {SUPABASE_SERVICE_ROLE_KEY}
     Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
     Content-Type: application/json
     Prefer: return=representation
   Body:
     {
       "name": "菜名",
       "cuisines": ["菜系1", "菜系2"],
       "cooking_method": "做法",
       "ingredients": ["食材标签1", "食材标签2"],
       "type": "主菜|素菜|汤",
       "proficiency": "拿手菜|还行|学习中",
       "cooking_time": 30,
       "difficulty": "简单|中等|复杂",
       "tips": "小贴士",
       "external_url": "外部链接（可选）"
     }
   ```

2. 追问用户食材用量，然后批量插入：
   ```
   POST {SUPABASE_URL}/rest/v1/recipe_ingredients
   Body: [
     { "recipe_id": "上一步返回的id", "name": "五花肉", "amount": "500g", "sort_order": 1 },
     { "recipe_id": "...", "name": "冰糖", "amount": "30g", "sort_order": 2 }
   ]
   ```

3. 追问用户烹饪步骤，然后批量插入：
   ```
   POST {SUPABASE_URL}/rest/v1/recipe_steps
   Body: [
     { "recipe_id": "...", "step_number": 1, "description": "五花肉切块焯水" },
     { "recipe_id": "...", "step_number": 2, "description": "锅中放油炒冰糖至枣红色" }
   ]
   ```

### 2. 从链接提取菜谱

当用户给出菜谱链接时：

1. 用浏览器打开链接，提取内容
2. 用 AI 解析出：菜名、食材用量、步骤、图片
3. 如有图片，上传到 Storage：
   ```
   POST {SUPABASE_URL}/storage/v1/object/recipe-images/{filename}
   Headers:
     apikey: {SUPABASE_SERVICE_ROLE_KEY}
     Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
     Content-Type: image/jpeg
   Body: (binary image data)
   ```
4. 获取图片公开 URL：
   `{SUPABASE_URL}/storage/v1/object/public/recipe-images/{filename}`
5. 按上述流程创建菜谱 + 食材 + 步骤

### 3. 查询菜谱

```
GET {SUPABASE_URL}/rest/v1/recipes?select=id,name,cuisines,type
Headers:
  apikey: {SUPABASE_SERVICE_ROLE_KEY}
```

### 4. 更新菜谱

```
PATCH {SUPABASE_URL}/rest/v1/recipes?id=eq.{recipe_id}
Headers:
  apikey: {SUPABASE_SERVICE_ROLE_KEY}
  Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
  Content-Type: application/json
Body: { "tips": "更新的小贴士" }
```

## 筛选维度参考值

- **菜系**: 中餐、川菜、粤菜、日料、西餐、韩餐、东南亚 等
- **做法**: 炒、炖、蒸、煮、烤、煎、拌、卤 等
- **类型**: 主菜、素菜、汤、小食、主食
- **擅长程度**: 拿手菜、还行、学习中
- **难度**: 简单、中等、复杂
```

**Step 2: Commit**

```bash
git add openclaw/
git commit -m "docs: 添加 OpenClaw 菜谱管理 Skill 配置文档"
```

---

## Task 16: 更新 CLAUDE.md 和项目文档

**Files:**
- Modify: `CLAUDE.md`

**Step 1: 更新 CLAUDE.md**

更新项目概览、架构图、数据库信息、环境变量等章节，反映从 Notion 到 Supabase 的变更。

关键更新点：
- 技术栈：`IndexedDB` → `@supabase/supabase-js`
- 数据流图：去掉 Notion API / Vite Proxy / IndexedDB，替换为 Supabase
- 数据库部分：替换为 Supabase 三表结构
- 环境变量：`VITE_NOTION_*` → `VITE_SUPABASE_*`
- 核心目录：更新文件路径描述
- 新增路由说明

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 反映 Supabase 迁移"
```

---

## 实施顺序总结

| Task | 内容 | 依赖 |
|------|------|------|
| 1 | Supabase 建表 + 环境配置 | 无 |
| 2 | 安装 supabase-js + 客户端初始化 | Task 1 |
| 3 | 数据迁移脚本 | Task 1, 2 |
| 4 | 更新类型定义 | 无 |
| 5 | 重写 Recipe Store | Task 2, 4 |
| 6 | 更新 Filter Store | Task 4 |
| 7 | 更新现有组件 | Task 5, 6 |
| 8 | 删除 Notion/IndexedDB 代码 | Task 7 |
| 9 | Supabase API 层 | Task 2, 4 |
| 10 | 设置 Vue Router | 无 |
| 11 | 菜谱详情页 | Task 9, 10 |
| 12 | 更新组件跳转 | Task 10, 11 |
| 13 | PWA 配置更新 | Task 8, 10 |
| 14 | 构建验证 | Task 1-13 |
| 15 | OpenClaw Skill 配置 | Task 1 |
| 16 | 更新文档 | Task 1-14 |
