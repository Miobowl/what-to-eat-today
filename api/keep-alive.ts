import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 配置了 CRON_SECRET 时只允许 Vercel Cron 调用；未配置时保持开放（只做只读查询，无副作用）
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error('Missing env vars:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!anonKey
    })
    return res.status(500).json({ error: 'Server not configured' })
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/recipes?select=id&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    })

    if (!response.ok) {
      console.error('Supabase keep-alive error:', response.status, await response.text())
      return res.status(502).json({ error: 'Supabase query failed' })
    }

    res.status(200).json({ ok: true, at: new Date().toISOString() })
  } catch (error) {
    console.error('Keep-alive error:', error)
    res.status(500).json({ error: 'Keep-alive failed' })
  }
}
