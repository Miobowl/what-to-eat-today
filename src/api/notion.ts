import type { RecipeFromNotion } from '@/types'

// 开发环境使用 Vite 代理，生产环境使用 serverless function
const NOTION_API_BASE = import.meta.env.DEV
  ? '/api/notion'
  : '/api/notion'

export async function fetchRecipesFromNotion(): Promise<RecipeFromNotion[]> {
  const apiKey = import.meta.env.VITE_NOTION_API_KEY
  const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    console.error('Missing VITE_NOTION_API_KEY or VITE_NOTION_DATABASE_ID in environment')
    throw new Error('Missing Notion API configuration')
  }

  const recipes: RecipeFromNotion[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_cursor: startCursor,
        page_size: 100
      })
    })

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`)
    }

    const data = await response.json()
    recipes.push(...data.results)
    hasMore = data.has_more
    startCursor = data.next_cursor
  }

  return recipes
}
