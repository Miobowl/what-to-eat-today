<script setup lang="ts">
import type { RecipeStep } from '@/types/recipe'

defineProps<{
  steps: RecipeStep[]
}>()
</script>

<template>
  <section class="step-list" v-if="steps.length > 0">
    <h3 class="section-title">烹饪步骤</h3>
    <ol class="steps">
      <li v-for="step in steps" :key="step.id" class="step-item">
        <div class="step-number">{{ step.step_number }}</div>
        <div class="step-content">
          <p class="step-desc">{{ step.description }}</p>
          <img
            v-if="step.image"
            :src="step.image"
            :alt="`步骤 ${step.step_number}`"
            class="step-image"
            loading="lazy"
          />
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.section-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: var(--space-sm);
}

.steps {
  list-style: none;
  padding: 0;
  margin: 0;
}

.step-item {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--cream-dark);
}

.step-item:last-child {
  border-bottom: none;
}

.step-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: var(--terracotta);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-desc {
  font-size: 0.95rem;
  color: var(--ink-light);
  line-height: 1.6;
  margin: 0;
}

.step-image {
  width: 100%;
  border-radius: 8px;
  margin-top: var(--space-sm);
}
</style>
