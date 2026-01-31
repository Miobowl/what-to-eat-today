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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchText = ref('')

function searchInXiaohongshu() {
  if (!searchText.value.trim()) return

  const query = encodeURIComponent(searchText.value.trim())

  // 小红书 App URL Scheme
  const appUrl = `xhsdiscover://search?keyword=${query}`
  const webUrl = `https://www.xiaohongshu.com/search_result?keyword=${query}`

  // 尝试打开小红书 App
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = appUrl
  document.body.appendChild(iframe)

  // 设置超时，如果 App 没打开则打开网页
  setTimeout(() => {
    document.body.removeChild(iframe)
    if (!document.hidden) {
      window.open(webUrl, '_blank')
    }
  }, 2000)
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
  background: var(--bg-card);
  border: 2px solid var(--cream-dark);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
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
</style>
