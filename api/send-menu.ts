import type { VercelRequest, VercelResponse } from '@vercel/node'

interface DishItem {
  name: string
  isCustom: boolean
}

const MAX_DISHES = 20
const MAX_NAME_LENGTH = 50

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 配置了 MENU_TOKEN 时强制校验；未配置时保持开放，避免环境变量缺失导致功能直接挂掉
  const menuToken = process.env.MENU_TOKEN
  if (menuToken && req.headers['x-menu-token'] !== menuToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const recipientEmail = process.env.RECIPIENT_EMAIL

  if (!resendApiKey || !recipientEmail) {
    console.error('Missing env vars:', {
      hasResendKey: !!resendApiKey,
      hasRecipient: !!recipientEmail
    })
    return res.status(500).json({ error: 'Server not configured' })
  }

  const rawDishes = (req.body as { dishes?: unknown } | undefined)?.dishes

  if (!Array.isArray(rawDishes) || rawDishes.length === 0) {
    return res.status(400).json({ error: 'No dishes provided' })
  }
  if (rawDishes.length > MAX_DISHES) {
    return res.status(400).json({ error: `Too many dishes (max ${MAX_DISHES})` })
  }

  const dishes: DishItem[] = []
  for (const item of rawDishes as Partial<DishItem>[]) {
    const name = typeof item?.name === 'string' ? item.name.trim() : ''
    if (!name) {
      return res.status(400).json({ error: 'Invalid dish name' })
    }
    dishes.push({ name: name.slice(0, MAX_NAME_LENGTH), isCustom: !!item.isCustom })
  }

  // 格式化日期
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 构建邮件内容
  const emailContent = dishes
    .map(d => `- ${d.name}${d.isCustom ? ' (自选)' : ''}`)
    .join('\n')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: '今天吃啥 <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `点菜啦（${dateStr}）`,
        text: emailContent
      })
    })

    if (!response.ok) {
      console.error('Resend API error:', response.status, await response.text())
      return res.status(502).json({ error: 'Failed to send email' })
    }

    const data = await response.json()
    res.status(200).json({ success: true, id: data.id })
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}
