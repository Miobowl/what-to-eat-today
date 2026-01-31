import type { RecipeFromNotion } from '@/types'

export async function fetchRecipesFromNotion(): Promise<RecipeFromNotion[]> {
  const recipes: RecipeFromNotion[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    let response: Response

    if (import.meta.env.DEV) {
      // 开发环境：使用 Vite 代理
      const apiKey = import.meta.env.VITE_NOTION_API_KEY
      const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID
      response = await fetch(`/api/notion/databases/${databaseId}/query`, {
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
    } else {
      // 生产环境：使用 serverless function
      response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          start_cursor: startCursor,
          page_size: 100
        })
      })
    }

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
