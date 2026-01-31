import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.VITE_NOTION_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Notion API key in environment' })
  }

  // 获取路径参数
  const { path } = req.query
  const notionPath = Array.isArray(path) ? path.join('/') : path

  const notionUrl = `https://api.notion.com/v1/${notionPath}`

  try {
    const response = await fetch(notionUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    })

    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Notion API error:', error)
    res.status(500).json({ error: 'Failed to fetch from Notion API' })
  }
}
