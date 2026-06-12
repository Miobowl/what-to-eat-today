# DESIGN.md — 今天吃啥 · 家常小馆点菜单

## 1. 视觉主题与气质

一张家庭小馆的点菜纸。温暖的米纸底色、墨棕色衬线字、朱砂红只在「盖章」时刻出现（编号、点菜、抽签揭晓）。
界面是无卡片的（cardless）：菜单列表靠编号、虚线引导符和发丝线分隔，不靠白盒子阴影。
密度适中，单手手机操作优先。

## 2. 色彩与角色

| Token | 值 | 角色 |
|---|---|---|
| `--paper` | `oklch(0.972 0.022 92)` (#FDF6E3) | 页面底，菜单纸 |
| `--paper-raised` | `oklch(0.985 0.014 95)` (#FFFBF0) | 抽屉/弹层/小票表面 |
| `--paper-dim` | `oklch(0.938 0.026 90)` (#F3EAD3) | 按下态、压暗表面 |
| `--ink` | `oklch(0.25 0.04 45)` (#2C1810) | 主文字 |
| `--ink-2` | `oklch(0.42 0.045 50)` (#5C4033) | 次文字 |
| `--ink-3` | `oklch(0.58 0.04 65)` (#8B7355) | 弱文字、引导符 |
| `--seal` | `oklch(0.55 0.13 35)` (#C75B39) | 朱砂印：编号、主按钮、选中态 |
| `--seal-deep` | `oklch(0.47 0.12 33)` (#A84832) | 主按钮按下 |
| `--sage` | `oklch(0.62 0.06 140)` (#7D9471) | 已点/成功 |
| `--mustard` | `oklch(0.74 0.12 85)` (#D4A72C) | 自选菜、备注 |
| `--rule` | `oklch(0.88 0.025 88)` | 发丝线、虚线 |

60-30-10：纸面占 60，墨字与线占 30，朱砂红严格控制在 10 以内——红色出现即意味着「动作」。
彩色底上不用灰字（按钮副文字用同色系降明度）。

## 3. 字体规则

| 层级 | 字体 | 字号/行高 | 备注 |
|---|---|---|---|
| 餐牌大字（品牌、抽签揭晓） | ZCOOL XiaoWei | 28–40px / 1.2 | letter-spacing 0.08em，魏碑感 = 小馆招牌 |
| 菜名、节标题 | ZCOOL XiaoWei | 17–20px / 1.3 | letter-spacing 0.02em |
| 正文 | Noto Serif SC 400/600 | 14–15px / 1.6 | |
| 弱说明 | Noto Serif SC 400 | 12–13px / 1.5 | 颜色 `--ink-3` |
| 编号/数量/时间 | Noto Serif SC 600 | — | `font-variant-numeric: tabular-nums` |

不引入新字体；ZCOOL XiaoWei 的碑刻感正是菜单纸方向本身，换掉反而丢人格。

## 4. 组件样式

- **主按钮（随便吃点/一键下单/看 N 道菜）**：`--seal` 实底、白字、radius 6px；按下 `scale(0.97)` + `--seal-deep`。
- **点菜按钮**：印章式——1.5px `--seal` 描边、`--seal` 字、透明底、radius 4px；已点 = `--sage` 描边+字+对勾，禁用不再响应。
- **筛选标签（抽屉内）**：默认 1px `--rule` 描边墨字；选中 = 1.5px `--seal` 描边 + `--seal` 字 + 浅朱砂底（像服务员圈菜）。
- **chips（已选条件）**：pill、浅朱砂底、`--seal` 字、尾部 ×。
- **菜单行**：编号（`--seal`、display 字体）+ 菜名 + 虚线引导符 + 点菜按钮；第二行弱文字 `菜系 · 做法`；行间 1px `--rule` 分隔，无卡片。
- **图标**：统一细线 SVG（stroke 1.5、currentColor）：骰子、筛选、搜索、×、↗、✓、+。禁止 emoji 作图标。

## 5. 布局原则

- 间距阶梯沿用 4/8/16/24/32。
- 单列布局，内容最大宽 600px 居中。
- 首页顺序：餐牌头 → 随便吃点 → 工具行（搜索+拿手菜+筛选）→ 已选 chips → 分节菜单列表 → 固定底部今日菜单条。
- 菜单列表按「类型」分节（主菜/素菜/汤/主食…），节标题居中带横线，像真菜单的栏目。

## 6. 深度与层级

纸上没有悬浮物。层级靠：背景明度阶（paper → paper-raised）、发丝线、以及弹层唯一允许的阴影
`0 -8px 32px rgba(44,24,16,0.14)`（抽屉/小票）。列表、节、按钮一律无阴影。

## 7. Do / Don't

- DO：红色只给动作和编号；DO：虚线引导符贯穿（菜名↔按钮、食材↔用量）。
- DO：`prefers-reduced-motion` 时抽签直接出结果。
- DON'T：emoji 图标；DON'T：白卡片+阴影网格；DON'T：bounce/elastic 缓动（印章落下除外，用 ease-out-quint 模拟）。
- DON'T：`transition: all`；只动 transform/opacity。
- DON'T：渐变按钮（现存的 135deg 渐变全部改实底）。

## 8. 响应式

- 设计基准 375px，最大内容宽 600px（桌面居中，纸面外侧露底色）。
- 触控目标 ≥ 40×40px；底部条和抽屉处理 `env(safe-area-inset-bottom)`；抽屉 `overscroll-behavior: contain`。
- hover 效果包在 `@media (hover: hover)` 内。

## 9. Agent Prompt 速查

色值：paper #FDF6E3 / raised #FFFBF0 / ink #2C1810 / ink-2 #5C4033 / ink-3 #8B7355 / seal #C75B39 / sage #7D9471 / mustard #D4A72C。

示例 prompt：
- 「在 --paper 上做一个菜单行：左侧 01 编号用 ZCOOL XiaoWei 15px #C75B39，菜名 17px #2C1810，中间 1px dotted #8B7355 引导线对齐 baseline，右侧描边按钮 1.5px #C75B39 radius 4px 文字 13px」
- 「底部抽屉：#FFFBF0 底、顶部 radius 14px、阴影 0 -8px 32px rgba(44,24,16,0.14)、顶部 36×4px 把手 #F3EAD3、内容 padding 16px、底部主按钮 #C75B39 白字 radius 6px 高 48px」
- 「全屏抽签：#FDF6E3 覆盖层，菜名列表 64px 行高 translateY 滚动 2.2s cubic-bezier(0.16,1,0.3,1) 减速，揭晓菜名 36px ZCOOL XiaoWei，印章 1.5px double #C75B39 描边 rotate(-6deg) scale 1.5→1 落下」
