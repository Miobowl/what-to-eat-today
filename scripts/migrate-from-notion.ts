/**
 * 迁移脚本：从 Notion 导入菜谱到 Supabase
 *
 * 用法：SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/migrate-from-notion.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const NOTION_API_KEY = process.env.VITE_NOTION_API_KEY!
const NOTION_DATABASE_ID = process.env.VITE_NOTION_DATABASE_ID!
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!NOTION_API_KEY || !NOTION_DATABASE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('缺少必要的环境变量')
  console.error('需要: VITE_NOTION_API_KEY, VITE_NOTION_DATABASE_ID, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface NotionRecipe {
  id: string
  properties: {
    Name: { title: Array<{ plain_text: string }> }
    菜系: { multi_select: Array<{ name: string }> }
    做法: { select: { name: string } | null }
    主要食材: { multi_select: Array<{ name: string }> }
    类型: { select: { name: string } | null }
    擅长程度: { select: { name: string } | null }
  }
  url: string
}

async function fetchAllFromNotion(): Promise<NotionRecipe[]> {
  const recipes: NotionRecipe[] = []
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

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${await response.text()}`)
    }

    const data = await response.json()
    recipes.push(...data.results)
    hasMore = data.has_more
    startCursor = data.next_cursor
  }

  return recipes
}

function transformRecipe(notion: NotionRecipe) {
  return {
    name: notion.properties.Name?.title?.[0]?.plain_text || '未命名菜品',
    cuisines: notion.properties.菜系?.multi_select?.map((item: any) => item.name) || [],
    cooking_method: notion.properties.做法?.select?.name || '',
    ingredients: notion.properties.主要食材?.multi_select?.map((item: any) => item.name) || [],
    type: notion.properties.类型?.select?.name || '',
    proficiency: notion.properties.擅长程度?.select?.name || '',
    notion_url: notion.url,
    cooking_time: null,
    difficulty: '',
    tips: '',
    cover_image: '',
    external_url: ''
  }
}

async function main() {
  console.log('📥 正在从 Notion 获取菜谱...')
  const notionRecipes = await fetchAllFromNotion()
  console.log(`✅ 获取到 ${notionRecipes.length} 道菜谱`)

  const recipes = notionRecipes.map(transformRecipe)

  console.log('📤 正在写入 Supabase...')
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipes)
    .select('id, name')

  if (error) {
    console.error('❌ 写入失败:', error)
    process.exit(1)
  }

  console.log(`✅ 成功导入 ${data.length} 道菜谱到 Supabase`)
  data.forEach((r: any) => console.log(`  - ${r.name}`))
}

main().catch(console.error)
