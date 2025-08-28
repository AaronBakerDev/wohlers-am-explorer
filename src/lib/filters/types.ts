export type FilterState = {
  technologyIds: string[]
  materialIds: string[]
  processCategories: string[]
  sizeRanges: string[]
  countries: string[]
  states: string[]
}

export const emptyFilters: FilterState = {
  technologyIds: [],
  materialIds: [],
  processCategories: [],
  sizeRanges: [],
  countries: [],
  states: [],
}

