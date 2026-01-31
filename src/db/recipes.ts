import { getDB } from './index'
import type { Recipe } from '@/types'

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await getDB()
  return db.getAll('recipes')
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('recipes', 'readwrite')
  await tx.store.clear()
  await Promise.all(recipes.map(recipe => tx.store.put(recipe)))
  await tx.done
}

export async function getRecipeById(id: string): Promise<Recipe | undefined> {
  const db = await getDB()
  return db.get('recipes', id)
}
