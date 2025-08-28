export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          city: string | null;
          company_type: string | null;
          country: string | null;
          created_at: string | null;
          description: string | null;
          employee_count_range: string | null;
          founded_year: number | null;
          id: string;
          is_public_company: boolean | null;
          last_funding_date: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          parent_company: string | null;
          public_stock_ticker: string | null;
          revenue_range: string | null;
          state: string | null;
          stock_ticker: string | null;
          subsidiary_info: string | null;
          total_funding_usd: number | null;
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          city?: string | null;
          company_type?: string | null;
          country?: string | null;
          created_at?: string | null;
          description?: string | null;
          employee_count_range?: string | null;
          founded_year?: number | null;
          id?: string;
          is_public_company?: boolean | null;
          last_funding_date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          parent_company?: string | null;
          public_stock_ticker?: string | null;
          revenue_range?: string | null;
          state?: string | null;
          stock_ticker?: string | null;
          subsidiary_info?: string | null;
          total_funding_usd?: number | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          city?: string | null;
          company_type?: string | null;
          country?: string | null;
          created_at?: string | null;
          description?: string | null;
          employee_count_range?: string | null;
          founded_year?: number | null;
          id?: string;
          is_public_company?: boolean | null;
          last_funding_date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          parent_company?: string | null;
          public_stock_ticker?: string | null;
          revenue_range?: string | null;
          state?: string | null;
          stock_ticker?: string | null;
          subsidiary_info?: string | null;
          total_funding_usd?: number | null;
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          company_id: string | null;
          count: number | null;
          count_type: string | null;
          created_at: string | null;
          id: string;
          manufacturer: string | null;
          material_id: string | null;
          model: string | null;
          technology_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          count?: number | null;
          count_type?: string | null;
          created_at?: string | null;
          id?: string;
          manufacturer?: string | null;
          material_id?: string | null;
          model?: string | null;
          technology_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          count?: number | null;
          count_type?: string | null;
          created_at?: string | null;
          id?: string;
          manufacturer?: string | null;
          material_id?: string | null;
          model?: string | null;
          technology_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company_summaries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_technology_id_fkey";
            columns: ["technology_id"];
            isOneToOne: false;
            referencedRelation: "technologies";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      technologies: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          company_id: string | null;
          investment_year: number | null;
          investment_month: string | null;
          amount_millions: number | null;
          funding_round: string | null;
          lead_investor: string | null;
          country: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          investment_year?: number | null;
          investment_month?: string | null;
          amount_millions?: number | null;
          funding_round?: string | null;
          lead_investor?: string | null;
          country?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          investment_year?: number | null;
          investment_month?: string | null;
          amount_millions?: number | null;
          funding_round?: string | null;
          lead_investor?: string | null;
          country?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "investments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      mergers_acquisitions: {
        Row: {
          id: string;
          acquired_company_name: string;
          acquiring_company_name: string;
          acquired_company_id: string | null;
          acquiring_company_id: string | null;
          announcement_date: string | null;
          deal_size_millions: number | null;
          deal_status: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          acquired_company_name: string;
          acquiring_company_name: string;
          acquired_company_id?: string | null;
          acquiring_company_id?: string | null;
          announcement_date?: string | null;
          deal_size_millions?: number | null;
          deal_status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          acquired_company_name?: string;
          acquiring_company_name?: string;
          acquired_company_id?: string | null;
          acquiring_company_id?: string | null;
          announcement_date?: string | null;
          deal_size_millions?: number | null;
          deal_status?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mergers_acquisitions_acquired_company_id_fkey";
            columns: ["acquired_company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mergers_acquisitions_acquiring_company_id_fkey";
            columns: ["acquiring_company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      service_pricing: {
        Row: {
          id: string;
          company_id: string | null;
          material_category: string | null;
          specific_material: string | null;
          process: string | null;
          quantity: number | null;
          price_usd: number | null;
          lead_time_days: number | null;
          notes: string | null;
          data_source: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          material_category?: string | null;
          specific_material?: string | null;
          process?: string | null;
          quantity?: number | null;
          price_usd?: number | null;
          lead_time_days?: number | null;
          notes?: string | null;
          data_source?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          material_category?: string | null;
          specific_material?: string | null;
          process?: string | null;
          quantity?: number | null;
          price_usd?: number | null;
          lead_time_days?: number | null;
          notes?: string | null;
          data_source?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "service_pricing_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      company_categories: {
        Row: {
          id: string;
          company_id: string | null;
          category: string;
          is_primary: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          category: string;
          is_primary?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          category?: string;
          is_primary?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_categories_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          user_id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: string | null;
          default_filters: Json | null;
          export_preferences: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          theme?: string | null;
          default_filters?: Json | null;
          export_preferences?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          theme?: string | null;
          default_filters?: Json | null;
          export_preferences?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          query: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          query: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          query?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      market_data: {
        Row: {
          id: string;
          data_type: string;
          year: number;
          segment: string | null;
          region: string | null;
          country: string | null;
          industry: string | null;
          value_usd: number | null;
          percentage: number | null;
          unit: string | null;
          data_source: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          data_type: string;
          year: number;
          segment?: string | null;
          region?: string | null;
          country?: string | null;
          industry?: string | null;
          value_usd?: number | null;
          percentage?: number | null;
          unit?: string | null;
          data_source?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          data_type?: string;
          year?: number;
          segment?: string | null;
          region?: string | null;
          country?: string | null;
          industry?: string | null;
          value_usd?: number | null;
          percentage?: number | null;
          unit?: string | null;
          data_source?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      company_summaries: {
        Row: {
          city: string | null;
          company_type: string | null;
          country: string | null;
          created_at: string | null;
          description: string | null;
          employee_count_range: string | null;
          founded_year: number | null;
          id: string | null;
          is_public_company: boolean | null;
          last_funding_date: string | null;
          latitude: number | null;
          longitude: number | null;
          materials: string[] | null;
          name: string | null;
          parent_company: string | null;
          processes: string[] | null;
          public_stock_ticker: string | null;
          revenue_range: string | null;
          state: string | null;
          stock_ticker: string | null;
          subsidiary_info: string | null;
          total_funding_usd: number | null;
          total_machines: number | null;
          unique_manufacturers: number | null;
          unique_materials: number | null;
          unique_processes: number | null;
          updated_at: string | null;
          website: string | null;
        };
        Relationships: [];
      };
      market_by_country_segment: {
        Row: {
          year: number;
          country: string;
          segment: string;
          value: number;
        };
        Relationships: [];
      };
      market_totals: {
        Row: {
          year: number;
          segment: string;
          total_value: number;
        };
        Relationships: [];
      };
      pricing_benchmarks: {
        Row: {
          process: string;
          material_category: string;
          quantity: string;
          country: string;
          sample_count: number;
          min_price: number;
          q1_price: number;
          median_price: number;
          q3_price: number;
          max_price: number;
          avg_price: number;
          min_lead_time: number | null;
          avg_lead_time: number | null;
          max_lead_time: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

// Convenient type aliases for AM Companies with normalized Equipment structure
export type Company = Tables<"companies">;
export type Equipment = Tables<"equipment">;
export type Technology = Tables<"technologies">;
export type Material = Tables<"materials">;
export type CompanySummary = Tables<"company_summaries">;
export type Investment = Tables<"investments">;
export type MergerAcquisition = Tables<"mergers_acquisitions">;
export type ServicePricing = Tables<"service_pricing">;
export type CompanyCategory = Tables<"company_categories">;
export type MarketData = Tables<"market_data">;
export type Profile = Tables<"profiles">;
export type UserPreferences = Tables<"user_preferences">;
export type SavedSearch = Tables<"saved_searches">;

// View type aliases
export type MarketTotals = Tables<"market_totals">;
export type MarketByCountrySegment = Tables<"market_by_country_segment">;
export type PricingBenchmarks = Tables<"pricing_benchmarks">;

export type CompanyInsert = TablesInsert<"companies">;
export type EquipmentInsert = TablesInsert<"equipment">;
export type TechnologyInsert = TablesInsert<"technologies">;
export type MaterialInsert = TablesInsert<"materials">;

export type CompanyUpdate = TablesUpdate<"companies">;
export type EquipmentUpdate = TablesUpdate<"equipment">;
export type TechnologyUpdate = TablesUpdate<"technologies">;
export type MaterialUpdate = TablesUpdate<"materials">;

// Extended types with relationships for AM Companies (normalized structure)
export type CompanyWithEquipment = Company & {
  equipment: (Equipment & {
    technologies?: Technology;
    materials?: Material;
  })[];
};

export type EquipmentWithDetails = Equipment & {
  companies?: Company;
  technologies?: Technology;
  materials?: Material;
};

export type CompanyWithDetails = Company & {
  equipment: EquipmentWithDetails[];
  total_machines?: number;
  unique_processes?: number;
  unique_materials?: number;
  unique_manufacturers?: number;
  processes?: string[];
  materials?: string[];
};

// Analytics types for dashboard
export type DashboardAnalytics = {
  summary: {
    totalCompanies: number;
    totalStates: number;
    totalTechnologies: number;
    totalMachines: number;
  };
  companyTypes: Array<{
    type: string;
    companies: number;
    percentage: number;
  }>;
  stateDistribution: Array<{
    state: string;
    companies: number;
    percentage: number;
  }>;
  technologyDistribution: Array<{
    tech: string;
    companies: number;
    percentage: number;
  }>;
  materialDistribution: Array<{
    material: string;
    companies: number;
    percentage: number;
  }>;
  topCities: Array<{
    city: string;
    companies: number;
    totalMachines: number;
  }>;
  machineDistribution: Array<{
    state: string;
    totalMachines: number;
    companies: number;
    avgMachinesPerCompany: number;
  }>;
  sizeDistribution: Array<{
    range: string;
    companies: number;
    percentage: number;
  }>;
  timeSeries: Array<{
    month: string;
    newCompanies: number;
    newMachines: number;
  }>;
  competitiveSegments: Array<{
    technology: string;
    [materialCategory: string]: any;
  }>;
  marketConcentration: {
    technologyHHI: number;
    materialHHI: number;
    topTechShare: number;
    topMaterialShare: number;
  };
};
