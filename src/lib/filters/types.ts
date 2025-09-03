export type FilterState = {
  technologyIds: string[]
  materialIds: string[]
  processCategories: string[]
  sizeRanges: string[]
  countries: string[]
  states: string[]
  // Vendor dataset specific filters
  vendorMaterialTypes?: string[]
  vendorMaterialFormats?: string[]
  vendorPrinterManufacturers?: string[]
  vendorPrinterModels?: string[]
}

export const emptyFilters: FilterState = {
  technologyIds: [],
  materialIds: [],
  processCategories: [],
  sizeRanges: [],
  countries: [],
  states: [],
  vendorMaterialTypes: [],
  vendorMaterialFormats: [],
  vendorPrinterManufacturers: [],
  vendorPrinterModels: [],
}
