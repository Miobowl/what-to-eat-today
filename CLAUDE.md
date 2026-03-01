# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 交互规范
- 和用户的对话语言使用简体中文，术语使用原始语言
- 如果发现当前方法做不到，可以上网检索包括github在内的资料学习代码，或者自己构建工具操作。不要说你做不到

## 项目概览

**今天吃啥** - Vue 3 PWA 应用，集成 Supabase 数据库帮助用户快速决定今天吃什么。支持离线使用、多维度筛选、随机推荐和全功能菜谱详情。

**技术栈:** Vue 3 + Vite + TypeScript + Pinia + @supabase/supabase-js + vue-router + vite-plugin-pwa

**部署:** Vercel (静态站点 + Serverless Function for send-menu)

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # TypeScript 类型检查 + Vite 构建
npm run preview  # 本地预览生产构建
```

## 架构概览

### 数据流

```
Supabase (PostgreSQL + Storage)
    ↑ (anon key, 只读)
supabase-js client
    ↓
fetchAllRecipes() / fetchRecipeById()
    ↓
useRecipeStore (Pinia) → useFilterStore
    ↓
Vue Components (via vue-router)
```

OpenClaw 通过 Supabase REST API (service_role key) 直接写入数据。

### 核心目录

```
src/
├── views/
│   ├── Home.vue              # 首页：筛选 + 列表
│   └── RecipeDetail.vue      # 菜谱详情页
├── components/               # UI 组件 (FilterSection, RecipeCard, RandomResult 等)
│   ├── IngredientList.vue    # 食材清单组件
│   └── StepList.vue          # 烹饪步骤组件
├── stores/
│   ├── recipes.ts            # 菜谱数据（Supabase 查询）
│   ├── filter.ts             # 筛选状态 + 过滤算法
│   └── menu.ts               # 今日菜单管理
├── api/
│   └── recipes.ts            # Supabase API 封装
├── lib/
│   └── supabase.ts           # Supabase 客户端初始化
├── router/
│   └── index.ts              # Vue Router 配置
└── types/                    # TypeScript 接口定义

api/send-menu.ts              # Vercel Serverless Function（邮件发送菜单）
openclaw/recipe-manager.md    # OpenClaw 菜谱录入 Skill 配置
```

### 路由

```
/ → Home.vue（筛选 + 列表页）
/recipe/:id → RecipeDetail.vue（菜谱详情页）
```

### 筛选逻辑

- 各维度内部使用 OR 逻辑 (选中任意一个即匹配)
- 维度之间使用 AND 逻辑 (所有维度条件都需满足)
- 五个筛选维度: 菜系、做法、主要食材、类型、擅长程度

## Supabase 数据库

### recipes 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | uuid, PK | 主键 |
| `name` | text | 菜名 |
| `cuisines` | text[] | 菜系数组 |
| `cooking_method` | text | 做法 |
| `ingredients` | text[] | 主要食材标签 |
| `type` | text | 类型 |
| `proficiency` | text | 擅长程度 |
| `cooking_time` | integer | 烹饪时间(分钟) |
| `difficulty` | text | 难度 |
| `tips` | text | 小贴士 |
| `cover_image` | text | 成品图 URL |
| `external_url` | text | 外部链接(小红书等) |
| `notion_url` | text | 原 Notion 链接 |

### recipe_ingredients 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `recipe_id` | uuid, FK | 关联菜谱 |
| `name` | text | 食材名 |
| `amount` | text | 用量 |
| `sort_order` | integer | 排序 |

### recipe_steps 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `recipe_id` | uuid, FK | 关联菜谱 |
| `step_number` | integer | 步骤序号 |
| `description` | text | 步骤描述 |
| `image` | text | 步骤图 URL |

### 安全模型

- RLS 启用：所有表公开只读 (SELECT)
- 写入通过 service_role key（OpenClaw 使用）

## 环境变量

**开发环境** (`.env.local`):
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**生产环境** (Vercel Dashboard): 配置相同的 Supabase 变量 + RESEND_API_KEY + RECIPIENT_EMAIL

## 设计系统

全局样式定义在 `src/style.css`，使用 CSS 变量管理:
- 颜色: `--cream`, `--terracotta`, `--sage`, `--mustard` 等暖色系
- 字体: ZCOOL XiaoWei (标题) + Noto Serif SC (正文)
- 间距: `--space-xs/sm/md/lg/xl`
- 动画: fadeInUp, scaleIn, float, shake, roll 等关键帧

## 关键约定

1. **双视图架构** - Home.vue (首页) + RecipeDetail.vue (详情页)，通过 vue-router 导航
2. **前端直连 Supabase** - 使用 anon key 只读查询，无中间代理层
3. **PWA 离线缓存** - Service Worker 缓存 Supabase API (NetworkFirst) 和图片 (CacheFirst)
4. **模态框** - RandomResult 使用 Vue 3 Teleport 挂载到 body
5. **小红书集成** - SearchBar 支持打开小红书 App 或降级到网页搜索
6. **OpenClaw 录入** - 通过 Supabase REST API + service_role key 录入菜谱
