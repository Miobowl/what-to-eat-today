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
    if (error.code === 'PGRST116') return null
    throw error
  }

  if (data) {
    data.recipe_ingredients?.sort((a: any, b: any) => a.sort_order - b.sort_order)
    data.recipe_steps?.sort((a: any, b: any) => a.step_number - b.step_number)
  }

  return data as RecipeWithDetails
}
