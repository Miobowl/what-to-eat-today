<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: 'dice' | 'filter' | 'search' | 'x' | 'check' | 'plus'
    | 'arrow-left' | 'arrow-up-right' | 'chevron-up' | 'chevron-down'
  size?: number
}>(), { size: 18 })

const paths: Record<string, string> = {
  dice: `<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/>
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/>`,
  filter: `<line x1="4" y1="7" x2="20" y2="7"/><circle cx="9" cy="7" r="2.2" fill="var(--paper-raised)"/>
    <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2.2" fill="var(--paper-raised)"/>
    <line x1="4" y1="17" x2="20" y2="17"/><circle cx="7" cy="17" r="2.2" fill="var(--paper-raised)"/>`,
  search: `<circle cx="11" cy="11" r="6.5"/><line x1="16" y1="16" x2="20.5" y2="20.5"/>`,
  x: `<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`,
  check: `<polyline points="5 12.5 10 17.5 19 7" fill="none"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  'arrow-left': `<line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18" fill="none"/>`,
  'arrow-up-right': `<line x1="6" y1="18" x2="17" y2="7"/><polyline points="9 6.5 17.5 6.5 17.5 15" fill="none"/>`,
  'chevron-up': `<polyline points="6 14.5 12 8.5 18 14.5" fill="none"/>`,
  'chevron-down': `<polyline points="6 9.5 12 15.5 18 9.5" fill="none"/>`
}

const html = computed(() => paths[props.name] ?? '')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="html"
  />
</template>
