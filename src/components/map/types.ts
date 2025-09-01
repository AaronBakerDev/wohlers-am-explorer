/**
 * Marker shape used by the map and detail views.
 * Represents a single company location and optional nested cluster listings.
 */
export interface CompanyMarker {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  country?: string | null;
  lat: number | null;
  lng: number | null;
  technologies: string[];
  materials: string[];
  website: string | null;
  type: string | null;
  totalMachines: number;
  uniqueProcesses: number;
  uniqueMaterials: number;
  uniqueManufacturers: number;
  companies?: Array<{
    id: string;
    name: string;
    segment: string;
    process: string;
    material_format: string;
    material_type: string;
    country: string;
  }>;
  companyData?: {
    id: string;
    company_name: string;
    segment: string;
    printer_manufacturer: string;
    printer_model: string;
    number_of_printers: number;
    count_type: string;
    process: string;
    material_type: string;
    material_format: string;
    country: string;
    update_year: number;
    additional_info: string;
  };
}

/**
 * Aggregated counts used to render the heatmap choropleth per state/country.
 */
export interface StateHeatmapData {
  state: string;
  country: string;
  company_count: number;
  total_machines: number;
}

/**
 * Computed legend bucket definition describing color and value range labels.
 */
export type LegendBucket = {
  color: string;
  min: number;
  max: number | null;
  label: string;
};
