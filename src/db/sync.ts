import { getDB } from './index'

const LAST_SYNC_KEY = 'lastSyncTime'
const SYNC_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

export async function getLastSyncTime(): Promise<number | null> {
  const db = await getDB()
  const meta = await db.get('meta', LAST_SYNC_KEY)
  return meta ? (meta.value as number) : null
}

export async function setLastSyncTime(time: number): Promise<void> {
  const db = await getDB()
  await db.put('meta', { key: LAST_SYNC_KEY, value: time })
}

export async function shouldSync(): Promise<boolean> {
  const lastSync = await getLastSyncTime()
  if (!lastSync) return true
  return Date.now() - lastSync > SYNC_INTERVAL
}
