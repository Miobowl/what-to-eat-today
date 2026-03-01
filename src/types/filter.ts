export type FilterDimension = 'cuisines' | 'cooking_method' | 'ingredients' | 'type' | 'proficiency'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterState {
  cuisines: string[]
  cooking_method: string[]
  ingredients: string[]
  type: string[]
  proficiency: string[]
}

export interface FilterConfig {
  key: FilterDimension
  label: string
}

export const FILTER_CONFIGS: FilterConfig[] = [
  { key: 'cuisines', label: '菜系' },
  { key: 'cooking_method', label: '做法' },
  { key: 'ingredients', label: '主材料' },
  { key: 'type', label: '类型' },
  { key: 'proficiency', label: '拿手菜' }
]
