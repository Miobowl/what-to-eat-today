<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchRecipeById } from '@/api/recipes'
import type { RecipeWithDetails } from '@/types/recipe'
import IngredientList from '@/components/IngredientList.vue'
import StepList from '@/components/StepList.vue'

const route = useRoute()
const router = useRouter()

const recipe = ref<RecipeWithDetails | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

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

function openExternalUrl(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="recipe-detail">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="detail-title" v-if="recipe">{{ recipe.name }}</h1>
    </header>

    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <main v-else-if="recipe" class="detail-content">
      <div v-if="recipe.cover_image" class="cover-wrapper">
        <img :src="recipe.cover_image" :alt="recipe.name" class="cover-image" />
      </div>

      <div class="meta-tags">
        <span v-for="cuisine in recipe.cuisines" :key="cuisine" class="tag cuisine-tag">{{ cuisine }}</span>
        <span v-if="recipe.cooking_method" class="tag method-tag">{{ recipe.cooking_method }}</span>
        <span v-if="recipe.difficulty" class="tag difficulty-tag">{{ recipe.difficulty }}</span>
        <span v-if="recipe.cooking_time" class="tag time-tag">⏱ {{ recipe.cooking_time }}min</span>
      </div>

      <div v-if="recipe.external_url" class="external-link" @click="openExternalUrl(recipe.external_url)">
        <span class="link-icon">📎</span>
        <span class="link-text">查看视频菜谱</span>
        <span class="link-arrow">→</span>
      </div>

      <IngredientList :ingredients="recipe.recipe_ingredients || []" />
      <StepList :steps="recipe.recipe_steps || []" />

      <section v-if="recipe.tips" class="tips-section">
        <h3 class="section-title">💡 小贴士</h3>
        <p class="tips-text">{{ recipe.tips }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.recipe-detail {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-md);
  padding-bottom: calc(var(--space-xl) * 2);
  min-height: 100vh;
  background: var(--cream);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.back-btn {
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--terracotta);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  border-radius: 8px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(199, 91, 57, 0.1);
}

.detail-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--ink);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-wrapper {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.cover-image {
  width: 100%;
  display: block;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.cuisine-tag {
  background: rgba(199, 91, 57, 0.12);
  color: var(--terracotta);
}

.method-tag {
  background: rgba(125, 148, 113, 0.15);
  color: var(--sage);
}

.difficulty-tag {
  background: rgba(212, 167, 44, 0.15);
  color: var(--mustard);
}

.time-tag {
  background: var(--cream-dark);
  color: var(--ink-light);
}

.external-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--paper);
  border: 1px solid var(--cream-dark);
  border-radius: 10px;
  margin-bottom: var(--space-md);
  cursor: pointer;
  transition: background 0.2s;
}

.external-link:hover {
  background: var(--cream-dark);
}

.link-text {
  flex: 1;
  font-size: 0.9rem;
  color: var(--terracotta);
}

.link-arrow {
  color: var(--terracotta);
}

.tips-section {
  margin-top: var(--space-md);
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: var(--space-sm);
}

.tips-text {
  font-size: 0.95rem;
  color: var(--ink-light);
  line-height: 1.6;
  background: rgba(212, 167, 44, 0.08);
  padding: var(--space-sm) var(--space-md);
  border-radius: 8px;
  border-left: 3px solid var(--mustard);
}

.loading, .error {
  text-align: center;
  padding: var(--space-xl);
  color: var(--ink-light);
  font-size: 1rem;
}

.error {
  color: var(--terracotta);
}
</style>
