<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchText"
        type="text"
        placeholder="搜小红书菜谱..."
        @keyup.enter="searchInXiaohongshu"
      />
    </div>
    <button class="search-btn" @click="searchInXiaohongshu" title="在小红书搜索">
      <span class="xhs-text">小红书</span>
    </button>

    <!-- App 唤起失败提示 -->
    <Teleport to="body">
      <div v-if="showFallbackHint" class="fallback-overlay" @click="dismissHint">
        <div class="fallback-dialog" @click.stop>
          <p>未能打开小红书 App</p>
          <div class="fallback-actions">
            <button class="fallback-btn primary" @click="openWebVersion">打开网页版</button>
            <button class="fallback-btn" @click="dismissHint">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchText = ref('')
const showFallbackHint = ref(false)
let pendingWebUrl = ''

// 检测是否在 PWA standalone 模式
function isPWAMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

// 监听页面可见性变化，用于检测用户从 app scheme 失败后返回
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && pendingWebUrl) {
    // 用户返回了，显示提示
    showFallbackHint.value = true
  }
}

function searchInXiaohongshu() {
  if (!searchText.value.trim()) return

  const query = encodeURIComponent(searchText.value.trim())
  const webUrl = `https://www.xiaohongshu.com/search_result?keyword=${query}`
  const appUrl = `xhsdiscover://search?keyword=${query}`

  if (isPWAMode()) {
    // PWA 模式：直接尝试 app scheme
    pendingWebUrl = webUrl
    showFallbackHint.value = false

    // 添加一次性监听器
    document.addEventListener('visibilitychange', handleVisibilityChange, { once: true })

    // 设置超时清理（如果用户没有返回）
    setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      pendingWebUrl = ''
    }, 10000)

    // 直接跳转 app scheme
    window.location.href = appUrl
    return
  }

  // 非 PWA 模式：尝试 App Scheme，同时预先打开网页窗口避免被拦截
  const webWindow = window.open(webUrl, '_blank')
  window.location.href = appUrl

  setTimeout(() => {
    if (document.hidden && webWindow) {
      webWindow.close()
    }
  }, 500)
}

function openWebVersion() {
  if (pendingWebUrl) {
    window.location.href = pendingWebUrl
    pendingWebUrl = ''
    showFallbackHint.value = false
  }
}

function dismissHint() {
  showFallbackHint.value = false
  pendingWebUrl = ''
}
</script>

<style scoped>
.search-bar {
  flex: 1;
  min-width: 0; /* Allow shrinking */
  display: flex;
  gap: var(--space-sm);
}

.search-input-wrapper {
  flex: 1;
  min-width: 0; /* Allow shrinking */
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-sm);
  height: 40px;
  background: var(--bg-card);
  border: 2px solid var(--cream-dark);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  box-sizing: border-box;
}

.search-input-wrapper:focus-within {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px rgba(125, 148, 113, 0.15);
}

.search-icon {
  font-size: 14px;
  opacity: 0.6;
  flex-shrink: 0;
}

input {
  flex: 1;
  min-width: 0; /* Allow shrinking */
  padding: var(--space-sm) 0;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

input::placeholder {
  color: var(--text-muted);
}

.search-btn {
  flex-shrink: 0; /* Never shrink the button */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-sm);
  height: 40px;
  background: linear-gradient(135deg, #FF2442 0%, #D91A36 100%);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm), 0 2px 8px rgba(255, 36, 66, 0.25);
  transition: all 0.2s;
}

.search-btn:active {
  transform: scale(0.95);
  box-shadow: var(--shadow-sm);
}

.xhs-text {
  color: white;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

/* Fallback dialog */
.fallback-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fallback-dialog {
  background: var(--bg-card);
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
  max-width: 280px;
}

.fallback-dialog p {
  margin: 0 0 var(--space-md);
  color: var(--text-primary);
  font-size: 16px;
}

.fallback-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.fallback-btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  background: var(--cream-dark);
  color: var(--text-primary);
}

.fallback-btn.primary {
  background: linear-gradient(135deg, #FF2442 0%, #D91A36 100%);
  color: white;
}
</style>
