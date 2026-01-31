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

export interface MenuItem {
  id: string
  name: string
  isCustom: boolean  // true = 自选菜品, false = 数据库菜品
}
