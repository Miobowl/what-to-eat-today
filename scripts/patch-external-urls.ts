/**
 * 补丁脚本：从 Notion 补充 external_url（文章链接）到 Supabase
 *
 * 用法：SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/patch-external-urls.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const NOTION_API_KEY = process.env.VITE_NOTION_API_KEY!
const NOTION_DATABASE_ID = process.env.VITE_NOTION_DATABASE_ID!
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchAllFromNotion() {
  const recipes: any[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 }
    if (startCursor) body.start_cursor = startCursor

    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()
    recipes.push(...data.results)
    hasMore = data.has_more
    startCursor = data.next_cursor
  }

  return recipes
}

async function main() {
  console.log('📥 从 Notion 获取菜谱...')
  const notionRecipes = await fetchAllFromNotion()
  console.log(`✅ 获取到 ${notionRecipes.length} 道菜谱`)

  // 先看一下「文章链接」属性的结构
  const sample = notionRecipes.find((r: any) => r.properties['文章链接'])
  if (sample) {
    console.log('\n📋 「文章链接」属性结构:', JSON.stringify(sample.properties['文章链接'], null, 2))
  } else {
    console.log('⚠️ 没有找到「文章链接」属性，列出所有属性名:')
    const props = Object.keys(notionRecipes[0]?.properties || {})
    console.log(props.join(', '))
    return
  }

  let updated = 0
  for (const notion of notionRecipes) {
    const prop = notion.properties['文章链接']
    let externalUrl = ''

    // 尝试不同的 Notion 属性类型
    if (prop?.url) {
      externalUrl = prop.url
    } else if (prop?.rich_text?.[0]?.plain_text) {
      externalUrl = prop.rich_text[0].plain_text
    } else if (prop?.rich_text?.[0]?.href) {
      externalUrl = prop.rich_text[0].href
    }

    if (!externalUrl) continue

    const name = notion.properties.Name?.title?.[0]?.plain_text || '未命名'
    const notionUrl = notion.url

    // 通过 notion_url 匹配 Supabase 中的记录
    const { error } = await supabase
      .from('recipes')
      .update({ external_url: externalUrl })
      .eq('notion_url', notionUrl)

    if (error) {
      console.error(`❌ 更新失败 [${name}]:`, error.message)
    } else {
      console.log(`✅ ${name} → ${externalUrl}`)
      updated++
    }
  }

  console.log(`\n🎉 完成！更新了 ${updated} 道菜谱的外部链接`)
}

main().catch(console.error)
