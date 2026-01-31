import type { VercelRequest, VercelResponse } from '@vercel/node'

interface DishItem {
  name: string
  isCustom: boolean
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const recipientEmail = process.env.RECIPIENT_EMAIL

  if (!resendApiKey || !recipientEmail) {
    return res.status(500).json({
      error: 'Missing environment variables',
      hasResendKey: !!resendApiKey,
      hasRecipient: !!recipientEmail
    })
  }

  const { dishes } = req.body as { dishes: DishItem[] }

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return res.status(400).json({ error: 'No dishes provided' })
  }

  // 格式化日期
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 构建邮件内容
  const dishList = dishes
    .map(d => `- ${d.name}${d.isCustom ? ' (自选)' : ''}`)
    .join('\n')

  const emailContent = dishList

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

    const data = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', data)
      return res.status(response.status).json({ error: 'Failed to send email', details: data })
    }

    res.status(200).json({ success: true, id: data.id })
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
}
