<template>
  <div class="search-bar">
    <input
      v-model="searchText"
      type="text"
      placeholder="搜索菜谱（跳转小红书）"
      @keyup.enter="searchInXiaohongshu"
    />
    <button class="search-btn" @click="searchInXiaohongshu">
      搜索
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
  display: flex;
  gap: 8px;
  padding: 12px 0;
}

input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  outline: none;
}

input:focus {
  border-color: #4CAF50;
}

.search-btn {
  padding: 12px 20px;
  background: #FF2442;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}
</style>
