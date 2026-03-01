# 菜谱管理 Skill

## 连接信息

- Supabase URL: (环境变量 SUPABASE_URL)
- API Key: (环境变量 SUPABASE_SERVICE_ROLE_KEY)
- Storage Bucket: recipe-images

## 录入菜谱（手动描述）

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
    "cuisines": ["菜系"],
    "cooking_method": "做法",
    "ingredients": ["食材标签"],
    "type": "主菜|素菜|汤|小食|主食",
    "proficiency": "拿手菜|还行|学习中",
    "cooking_time": 30,
    "difficulty": "简单|中等|复杂",
    "tips": "小贴士",
    "external_url": "外部链接（可选）"
  }
```

2. 追问食材用量后批量插入：
```
POST {SUPABASE_URL}/rest/v1/recipe_ingredients
Body: [
  { "recipe_id": "上一步返回的id", "name": "五花肉", "amount": "500g", "sort_order": 1 },
  { "recipe_id": "...", "name": "冰糖", "amount": "30g", "sort_order": 2 }
]
```

3. 追问烹饪步骤后批量插入：
```
POST {SUPABASE_URL}/rest/v1/recipe_steps
Body: [
  { "recipe_id": "...", "step_number": 1, "description": "五花肉切块焯水" },
  { "recipe_id": "...", "step_number": 2, "description": "锅中放油炒冰糖至枣红色" }
]
```

## 从链接提取菜谱

当用户给出菜谱链接时：

1. 浏览器打开链接，提取内容
2. AI 解析出菜名、食材用量、步骤、图片
3. 如有图片，上传到 Storage：
```
POST {SUPABASE_URL}/storage/v1/object/recipe-images/{filename}
Headers:
  apikey: {SUPABASE_SERVICE_ROLE_KEY}
  Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
  Content-Type: image/jpeg
Body: (binary)
```
4. 图片公开 URL: `{SUPABASE_URL}/storage/v1/object/public/recipe-images/{filename}`
5. 按上述流程创建菜谱 + 食材 + 步骤

## 查询菜谱

```
GET {SUPABASE_URL}/rest/v1/recipes?select=id,name,cuisines,type&order=created_at.desc
```

## 更新菜谱

```
PATCH {SUPABASE_URL}/rest/v1/recipes?id=eq.{recipe_id}
Body: { "tips": "更新内容" }
```

## 删除菜谱

```
DELETE {SUPABASE_URL}/rest/v1/recipes?id=eq.{recipe_id}
```
级联删除会自动清理 recipe_ingredients 和 recipe_steps。

## 筛选维度参考值

- **菜系**: 中餐、川菜、粤菜、日料、西餐、韩餐、东南亚
- **做法**: 炒、炖、蒸、煮、烤、煎、拌、卤
- **类型**: 主菜、素菜、汤、小食、主食
- **擅长程度**: 拿手菜、还行、学习中
- **难度**: 简单、中等、复杂
