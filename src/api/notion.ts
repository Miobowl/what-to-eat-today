import type { RecipeFromNotion } from '@/types'

const NOTION_API_BASE = '/api/notion'

export async function fetchRecipesFromNotion(): Promise<RecipeFromNotion[]> {
  const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID

  if (!databaseId) {
    console.error('Missing VITE_NOTION_DATABASE_ID in environment')
    throw new Error('Missing Notion database ID')
  }

  const recipes: RecipeFromNotion[] = []
  let hasMore = true
  let startCursor: string | undefined

  // 开发环境需要传 API key，生产环境由 serverless function 处理
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (import.meta.env.DEV) {
    const apiKey = import.meta.env.VITE_NOTION_API_KEY
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }
  }

  while (hasMore) {
    const response = await fetch(`${NOTION_API_BASE}/databases/${databaseId}/query`, {
      method: 'POST',
      headers,
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
