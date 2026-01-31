# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 交互规范
- 和用户的对话语言使用简体中文，术语使用原始语言
- 如果发现当前方法做不到，可以上网检索包括github在内的资料学习代码，或者自己构建工具操作。不要说你做不到

## 项目概览

**今天吃啥** - Vue 3 PWA 应用，集成 Notion 数据库帮助用户快速决定今天吃什么。支持离线使用、多维度筛选和随机推荐。

**技术栈:** Vue 3 + Vite + TypeScript + Pinia + IndexedDB + vite-plugin-pwa

**部署:** Vercel (静态站点 + Serverless Function)

## 常用命令

```bash
npm run dev      # 启动开发服务器 (Vite + Notion API 代理)
npm run build    # TypeScript 类型检查 + Vite 构建
npm run preview  # 本地预览生产构建
```

## 架构概览

### 数据流

```
Notion API → Vercel Function (生产) / Vite Proxy (开发)
    ↓
fetchRecipesFromNotion() → transformAllRecipes()
    ↓
IndexedDB (recipes + meta stores)
    ↓
useRecipeStore (Pinia) → useFilterStore
    ↓
Vue Components
```

### 核心目录

```
src/
├── views/Home.vue        # 唯一视图，包含完整应用界面
├── components/           # UI 组件 (FilterSection, RecipeCard, RandomResult 等)
├── stores/
│   ├── recipes.ts        # 菜谱数据 + Notion 同步逻辑
│   └── filter.ts         # 筛选状态 + 过滤算法
├── db/                   # IndexedDB 数据层 (24小时同步周期)
├── api/                  # Notion API 交互和数据转换
└── types/                # TypeScript 接口定义

api/notion.ts             # Vercel Serverless Function (生产环境代理 Notion API)
```

### 筛选逻辑

- 各维度内部使用 OR 逻辑 (选中任意一个即匹配)
- 维度之间使用 AND 逻辑 (所有维度条件都需满足)
- 五个筛选维度: 菜系、做法、主要食材、类型、擅长程度

## Notion 数据库

**Database ID:** `2aeaf7ade59680ec98d5e8923028a5d2`

| 应用字段 | Notion 属性 | 类型 |
|---------|------------|------|
| `name` | Name | title |
| `cuisines` | 菜系 | multi_select |
| `cookingMethod` | 做法 | select |
| `ingredients` | 主要食材 | multi_select |
| `type` | 类型 | select |
| `proficiency` | 擅长程度 | select |

## 环境变量

**开发环境** (`.env.local`):
```
VITE_NOTION_API_KEY=<your-api-key>
VITE_NOTION_DATABASE_ID=2aeaf7ade59680ec98d5e8923028a5d2
```

**生产环境** (Vercel Dashboard): 配置相同变量

## 设计系统

全局样式定义在 `src/style.css`，使用 CSS 变量管理:
- 颜色: `--cream`, `--terracotta`, `--sage`, `--mustard` 等暖色系
- 字体: ZCOOL XiaoWei (标题) + Noto Serif SC (正文)
- 间距: `--space-xs/sm/md/lg/xl`
- 动画: fadeInUp, scaleIn, float, shake, roll 等关键帧

## 关键约定

1. **单一视图架构** - 整个应用只有 Home.vue 一个视图，无页面路由
2. **离线优先** - 使用 IndexedDB 缓存，24小时周期自动同步 Notion
3. **API 适配** - 开发环境通过 Vite 代理，生产环境通过 Serverless Function
4. **模态框** - RandomResult 使用 Vue 3 Teleport 挂载到 body
5. **小红书集成** - SearchBar 支持打开小红书 App 或降级到网页搜索
