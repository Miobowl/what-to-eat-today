import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Recipe } from '@/types'

interface RecipeDB extends DBSchema {
  recipes: {
    key: string
    value: Recipe
    indexes: {
      'by-cuisine': string
      'by-type': string
      'by-proficiency': string
    }
  }
  meta: {
    key: string
    value: {
      key: string
      value: string | number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<RecipeDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<RecipeDB>('what-to-eat-db', 1, {
      upgrade(db) {
        const recipeStore = db.createObjectStore('recipes', { keyPath: 'id' })
        recipeStore.createIndex('by-cuisine', 'cuisines', { multiEntry: true })
        recipeStore.createIndex('by-type', 'type')
        recipeStore.createIndex('by-proficiency', 'proficiency')
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    })
  }
  return dbPromise
}
