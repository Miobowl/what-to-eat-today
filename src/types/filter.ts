export type FilterDimension = 'cuisines' | 'cookingMethod' | 'ingredients' | 'type' | 'proficiency'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterState {
  cuisines: string[]
  cookingMethod: string[]
  ingredients: string[]
  type: string[]
  proficiency: string[]
}

export interface FilterConfig {
  key: FilterDimension
  label: string
  notionProperty: string
  isMultiSelect: boolean
}

export const FILTER_CONFIGS: FilterConfig[] = [
  { key: 'cuisines', label: '菜系', notionProperty: '菜系', isMultiSelect: true },
  { key: 'cookingMethod', label: '做法', notionProperty: '做法', isMultiSelect: false },
  { key: 'ingredients', label: '主材料', notionProperty: '主要食材', isMultiSelect: true },
  { key: 'type', label: '类型', notionProperty: '类型', isMultiSelect: false },
  { key: 'proficiency', label: '拿手菜', notionProperty: '擅长程度', isMultiSelect: false }
]
