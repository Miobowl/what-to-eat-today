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
