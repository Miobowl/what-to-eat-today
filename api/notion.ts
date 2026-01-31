import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.VITE_NOTION_API_KEY
  const databaseId = process.env.VITE_NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    return res.status(500).json({
      error: 'Missing environment variables',
      hasApiKey: !!apiKey,
      hasDatabaseId: !!databaseId
    })
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(req.body || {})
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Notion API error:', error)
    res.status(500).json({ error: 'Failed to fetch from Notion API' })
  }
}
