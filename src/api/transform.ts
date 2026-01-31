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
