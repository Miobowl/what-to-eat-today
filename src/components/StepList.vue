<script setup lang="ts">
import type { RecipeStep } from '@/types/recipe'

defineProps<{
  steps: RecipeStep[]
}>()
</script>

<template>
  <section class="step-list" v-if="steps.length > 0">
    <div class="section-head">
      <span class="head-line"></span>
      <h3 class="head-text">做法</h3>
      <span class="head-line"></span>
    </div>
    <ol class="steps">
      <li v-for="step in steps" :key="step.id" class="step-item">
        <span class="step-number">{{ String(step.step_number).padStart(2, '0') }}</span>
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
.step-list {
  margin-bottom: var(--space-lg);
}

.section-head {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.head-line {
  flex: 1;
  height: 1px;
  background: var(--rule);
}

.head-text {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: var(--ink-2);
}

.steps {
  list-style: none;
}

.step-item {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
}

.step-item + .step-item {
  border-top: 1px solid var(--rule);
}

.step-number {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--seal);
  line-height: 1.7;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-desc {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.7;
}

.step-image {
  width: 100%;
  border-radius: var(--radius-sm);
  margin-top: var(--space-sm);
  outline: 1px solid oklch(0.25 0.04 45 / 0.1);
  outline-offset: -1px;
}
</style>
