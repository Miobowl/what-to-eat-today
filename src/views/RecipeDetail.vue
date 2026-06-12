<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchRecipeById } from '@/api/recipes'
import type { RecipeWithDetails } from '@/types/recipe'
import AppIcon from '@/components/AppIcon.vue'
import IngredientList from '@/components/IngredientList.vue'
import StepList from '@/components/StepList.vue'

const route = useRoute()
const router = useRouter()

const recipe = ref<RecipeWithDetails | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const metaLine = computed(() => {
  if (!recipe.value) return ''
  const parts = [
    ...recipe.value.cuisines,
    recipe.value.cooking_method,
    recipe.value.difficulty,
    recipe.value.cooking_time ? `${recipe.value.cooking_time} 分钟` : ''
  ].filter(Boolean)
  return parts.join(' · ')
})

const hasContent = computed(() =>
  (recipe.value?.recipe_ingredients?.length ?? 0) > 0 ||
  (recipe.value?.recipe_steps?.length ?? 0) > 0
)

const externalUrl = computed(() =>
  recipe.value?.external_url || recipe.value?.notion_url || ''
)

onMounted(async () => {
  try {
    const id = route.params.id as string
    recipe.value = await fetchRecipeById(id)
    if (!recipe.value) {
      error.value = '菜谱不存在'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    isLoading.value = false
  }
})

function goBack() {
  router.back()
}

function openExternalUrl() {
  if (externalUrl.value) {
    window.open(externalUrl.value, '_blank')
  }
}
</script>

<template>
  <div class="recipe-detail">
    <header class="topbar">
      <button class="back-btn" aria-label="返回" @click="goBack">
        <AppIcon name="arrow-left" :size="18" />
        返回
      </button>
    </header>

    <div v-if="isLoading" class="status">加载中…</div>
    <div v-else-if="error" class="status error">{{ error }}</div>

    <main v-else-if="recipe" class="detail-content">
      <!-- 菜名牌头 -->
      <div class="dish-head">
        <h1 class="dish-name">{{ recipe.name }}</h1>
        <p v-if="metaLine" class="dish-meta">{{ metaLine }}</p>
        <div class="dish-rule" aria-hidden="true"></div>
      </div>

      <figure v-if="recipe.cover_image" class="cover-wrapper">
        <img :src="recipe.cover_image" :alt="recipe.name" class="cover-image" loading="lazy" />
      </figure>

      <button v-if="externalUrl && hasContent" class="external-link" @click="openExternalUrl">
        <span class="link-text">查看原菜谱（视频）</span>
        <AppIcon name="arrow-up-right" :size="15" />
      </button>

      <template v-if="hasContent">
        <IngredientList :ingredients="recipe.recipe_ingredients || []" />
        <StepList :steps="recipe.recipe_steps || []" />
      </template>

      <!-- 没记录做法时不留空页 -->
      <div v-else class="no-content">
        <p class="no-content-title">这道菜还没记笔记</p>
        <p class="no-content-hint">
          {{ externalUrl ? '做法在原链接里' : '下次做的时候记一下食材和步骤' }}
        </p>
        <button v-if="externalUrl" class="no-content-btn" @click="openExternalUrl">
          去看原菜谱
          <AppIcon name="arrow-up-right" :size="14" />
        </button>
      </div>

      <section v-if="recipe.tips" class="tips-section">
        <h3 class="tips-title">备注</h3>
        <p class="tips-text">{{ recipe.tips }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.recipe-detail {
  max-width: var(--content-max);
  margin: 0 auto;
  min-height: 100vh;
  padding: var(--space-md);
  padding-top: calc(var(--space-sm) + env(safe-area-inset-top));
  padding-bottom: calc(var(--space-xl) * 2 + env(safe-area-inset-bottom));
}

.topbar {
  margin-bottom: var(--space-sm);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 var(--space-sm) 0 0;
  font-size: 15px;
  color: var(--ink-2);
  transition: color 0.15s;
}

.back-btn:active {
  color: var(--seal);
}

/* 菜名牌头 */
.dish-head {
  text-align: center;
  margin-bottom: var(--space-md);
}

.dish-name {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-indent: 0.1em;
  line-height: 1.3;
  color: var(--ink);
  text-wrap: balance;
}

.dish-meta {
  margin-top: var(--space-xs);
  font-size: 13px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.dish-rule {
  margin-top: var(--space-md);
  height: 4px;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}

.cover-wrapper {
  margin-bottom: var(--space-md);
}

.cover-image {
  width: 100%;
  display: block;
  border-radius: var(--radius-sm);
  outline: 1px solid oklch(0.25 0.04 45 / 0.1);
  outline-offset: -1px;
}

.external-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: 44px;
  padding: var(--space-sm) var(--space-md);
  border: 1px dashed var(--ink-3);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-lg);
  color: var(--seal);
  transition: background-color 0.15s, transform 0.15s;
}

.external-link:active {
  background: var(--seal-wash);
  transform: scale(0.99);
}

.link-text {
  font-size: 14px;
  font-weight: 600;
}

/* 空内容 */
.no-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xl) var(--space-md);
  text-align: center;
}

.no-content-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--ink-2);
}

.no-content-hint {
  font-size: 13px;
  color: var(--ink-3);
  margin-bottom: var(--space-md);
}

.no-content-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 var(--space-lg);
  background: var(--seal);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.15s, background-color 0.15s;
}

.no-content-btn:active {
  transform: scale(0.97);
  background: var(--seal-deep);
}

/* 备注 */
.tips-section {
  margin-top: var(--space-lg);
}

.tips-title {
  font-family: var(--font-display);
  font-size: 16px;
  letter-spacing: 0.15em;
  color: var(--ink-2);
  margin-bottom: var(--space-sm);
}

.tips-text {
  font-size: 14px;
  color: var(--ink-2);
  line-height: 1.7;
  padding: var(--space-sm) var(--space-md);
  border: 1px dashed var(--mustard);
  border-radius: var(--radius-sm);
  background: var(--mustard-wash);
}

.status {
  text-align: center;
  padding: var(--space-xl);
  color: var(--ink-2);
  font-size: 15px;
}

.status.error {
  color: var(--seal);
}
</style>
