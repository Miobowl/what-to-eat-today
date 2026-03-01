# 后端迁移设计：Notion → Supabase + 全功能菜谱

**日期:** 2026-03-01
**状态:** 已确认

## 背景

当前"今天吃啥"应用使用 Notion 作为后端数据库，存在以下局限：
- 菜谱只有 5 个筛选维度，无详情（步骤、食材用量）
- 无法方便地通过 OpenClaw 录入菜谱
- 查看菜谱详情需要跳转到 Notion 页面

## 目标

1. 迁移后端到 Supabase（PostgreSQL + Storage）
2. 支持通过 OpenClaw REST API 录入菜谱（手动描述 + 链接提取）
3. 全功能菜谱：食材用量、步骤、图片、烹饪时间、难度、小贴士
4. 应用内展示菜谱详情，支持外部链接跳转（小红书视频等）

## 架构

**方案 A：前端直连 Supabase**

```
用户 App ←→ supabase-js (anon key, 只读) ←→ Supabase (PostgreSQL + Storage)
                                                      ↑
OpenClaw ←→ Supabase REST API (service_role key) ─────┘
```

- 去掉 Vercel Serverless 中间层
- Supabase RLS 保证安全（App 只读，OpenClaw 可写）
- 实时数据，不需要 24h 同步周期
- 部署继续使用 Vercel（纯静态站点）

## 数据模型

### `recipes` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid, PK | 主键 |
| `name` | text, NOT NULL | 菜名 |
| `cuisines` | text[] | 菜系数组 |
| `cooking_method` | text | 做法 |
| `ingredients` | text[] | 主要食材标签（筛选用） |
| `type` | text | 类型：主菜/素菜/汤等 |
| `proficiency` | text | 擅长程度 |
| `cooking_time` | integer | 烹饪时间（分钟） |
| `difficulty` | text | 难度：简单/中等/复杂 |
| `tips` | text | 小贴士/备注 |
| `cover_image` | text | 成品图 URL（Storage） |
| `external_url` | text | 外部链接（小红书等） |
| `notion_url` | text | 原 Notion 链接（迁移保留） |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 更新时间 |

### `recipe_ingredients` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid, PK | 主键 |
| `recipe_id` | uuid, FK → recipes | 关联菜谱 |
| `name` | text | 食材名 |
| `amount` | text | 用量（如"500g"、"适量"） |
| `sort_order` | integer | 排序 |

### `recipe_steps` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid, PK | 主键 |
| `recipe_id` | uuid, FK → recipes | 关联菜谱 |
| `step_number` | integer | 步骤序号 |
| `description` | text | 步骤描述 |
| `image` | text | 步骤图 URL（可选） |

## 安全模型 (RLS)

```sql
-- recipes 表
CREATE POLICY "公开只读" ON recipes FOR SELECT USING (true);
CREATE POLICY "service_role 可写" ON recipes FOR ALL USING (auth.role() = 'service_role');

-- recipe_ingredients 表
CREATE POLICY "公开只读" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "service_role 可写" ON recipe_ingredients FOR ALL USING (auth.role() = 'service_role');

-- recipe_steps 表
CREATE POLICY "公开只读" ON recipe_steps FOR SELECT USING (true);
CREATE POLICY "service_role 可写" ON recipe_steps FOR ALL USING (auth.role() = 'service_role');
```

## 前端改动

### 新增路由

引入 `vue-router`：

```
/ → Home.vue（筛选 + 列表页，保持不变）
/recipe/:id → RecipeDetail.vue（菜谱详情页）
```

### RecipeDetail.vue 布局

```
┌─────────────────────────────┐
│  ← 返回          菜名标题    │
├─────────────────────────────┤
│    [成品图 / 封面图]         │
├─────────────────────────────┤
│ 菜系 · 做法 · 难度 · ⏱30min │
├─────────────────────────────┤
│ 📎 小红书视频 →  (外部链接)   │
├─────────────────────────────┤
│ 食材清单                     │
│  五花肉 .............. 500g  │
│  冰糖 ................ 30g   │
├─────────────────────────────┤
│ 烹饪步骤                     │
│ 1. 五花肉切块焯水...         │
│    [步骤图]                  │
│ 2. 锅中放油炒冰糖...         │
├─────────────────────────────┤
│ 💡 小贴士                    │
│ 冰糖炒到枣红色时下肉...      │
└─────────────────────────────┘
```

### 数据层改动

- **去掉** IndexedDB 缓存层和 24h 同步机制
- **去掉** Vercel Serverless Function (api/notion.ts)
- **新增** Supabase 客户端初始化 (`src/lib/supabase.ts`)
- **简化** Pinia store — 直接调 supabase 查询，不再需要 sync 逻辑
- **保留** PWA Service Worker 缓存（NetworkFirst 策略）

### 组件改动清单

| 组件 | 改动 |
|------|------|
| RecipeCard | 点击跳转 `/recipe/:id` 而非 Notion |
| RandomResult | "看菜谱" 跳转应用内详情页 |
| SearchBar | 保持不变（本地搜索） |
| **新增** RecipeDetail.vue | 菜谱详情页 |
| **新增** IngredientList.vue | 食材用量展示 |
| **新增** StepList.vue | 步骤展示 |
| **删除** src/api/notion.ts | 不再需要 Notion API |
| **删除** src/db/ | 不再需要 IndexedDB 层 |
| **删除** api/notion.ts | 不再需要 Serverless Function |

## 数据迁移

迁移脚本 (`scripts/migrate-from-notion.ts`)：

1. 从 Notion API 拉取全部菜谱
2. 转换为 Supabase recipes 表格式
3. 保留 `notion_url`（原 Notion 页面链接）
4. 保留小红书链接存入 `external_url`
5. 批量插入 Supabase
6. 食材用量和步骤字段暂空，后续通过 OpenClaw 逐步补充

## OpenClaw 集成

### 录入方式 1：手动描述

```
用户: 录入一道红烧肉
OpenClaw:
  → POST /rest/v1/recipes 创建菜谱
  → 追问食材用量和步骤
  → POST /rest/v1/recipe_ingredients 批量插入食材
  → POST /rest/v1/recipe_steps 批量插入步骤
  → 如有图片，上传到 Storage 并更新 URL
```

### 录入方式 2：链接提取

```
用户: 把这个链接的菜谱存下来 https://www.xiaohongshu.com/...
OpenClaw:
  → 浏览器抓取网页内容
  → AI 提取菜名、食材、步骤、图片
  → 调用 Supabase API 创建完整菜谱
  → 保存 external_url = 原始链接
```

### OpenClaw Skill 配置

```yaml
name: recipe-manager
description: 管理"今天吃啥"菜谱数据库
tools:
  - supabase_rest_api
  - browser
env:
  SUPABASE_URL: <project-url>
  SUPABASE_SERVICE_KEY: <service-role-key>
```

## 环境变量变更

**开发环境** (`.env.local`)：
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Vercel 生产环境**：配置相同变量（去掉原有 Notion 相关变量）
