# Market Intelligence Database Schema - MVP Requirements

## Overview

Based on the [GAP-ANALYSIS.md](mdc:project-documents/01-planning/GAP-ANALYSIS.md) and [kickoff_transcript.md](mdc:project-documents/01-planning/kickoff_transcript.md), this document outlines the **missing database schema** required for the Market Intelligence features that stakeholders explicitly requested.

## 🚨 **Critical Missing Tables**

### **1. Market Totals Table**
**Purpose**: Store total AM market size by segment and year  
**Priority**: P0-Critical  
**Stakeholder Requirement**: "Total AM Market Size: stacked bars with company segment filter"

```sql
CREATE TABLE market_totals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    segment TEXT NOT NULL CHECK (segment IN (
        'print_services',
        'printer_sales', 
        'materials',
        'software',
        'health'
    )),
    value DECIMAL(15,2) NOT NULL, -- Market value in millions USD
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_market_totals_year ON market_totals(year);
CREATE INDEX idx_market_totals_segment ON market_totals(segment);
CREATE INDEX idx_market_totals_year_segment ON market_totals(year, segment);

-- Sample data structure
-- 2023, print_services, 8500.00
-- 2023, printer_sales, 12000.00
-- 2023, materials, 3500.00
-- 2024, print_services, 9200.00
-- 2024, printer_sales, 13500.00
```

### **2. Market by Country & Segment Table**
**Purpose**: Store market revenue breakdown by country and segment  
**Priority**: P0-Critical  
**Stakeholder Requirement**: "2024 Revenue by Country and Segment: pie chart with filters"

```sql
CREATE TABLE market_by_country_segment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    country TEXT NOT NULL,
    segment TEXT NOT NULL CHECK (segment IN (
        'print_services',
        'printer_sales',
        'materials', 
        'software',
        'health'
    )),
    value DECIMAL(15,2) NOT NULL, -- Revenue in millions USD
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_market_country_year ON market_by_country_segment(year);
CREATE INDEX idx_market_country_segment ON market_by_country_segment(country, segment);
CREATE INDEX idx_market_country_year_segment ON market_by_country_segment(year, country, segment);

-- Sample data structure
-- 2024, United States, print_services, 4500.00
-- 2024, United States, printer_sales, 6800.00
-- 2024, Germany, print_services, 1200.00
-- 2024, China, materials, 800.00
```

## 🔄 **Data Integration Requirements**

### **Data Source**
- **Source**: WA Digital Platform - Vendors Data (MVP) Excel file
- **Tabs**: Market totals, Revenue by country/segment, Industry breakdowns
- **Format**: Excel with multiple sheets for different market views
- **Update Frequency**: Quarterly (for MVP, use 2023-2024 data)

### **ETL Process Requirements**
```typescript
// Market data import interface
interface MarketDataImport {
  // Market totals import
  importMarketTotals: (data: MarketTotalRow[]) => Promise<void>;
  
  // Country/segment import  
  importMarketByCountrySegment: (data: MarketCountrySegmentRow[]) => Promise<void>;
  
  // Data validation
  validateMarketData: (data: any[]) => ValidationResult;
  
  // Data transformation
  transformMarketData: (rawData: any[]) => MarketDataFormatted[];
}

// Data validation rules
interface MarketDataValidation {
  year: { min: 2020, max: 2025, required: true };
  segment: { allowed: string[], required: true };
  value: { min: 0, max: 100000, required: true };
  country: { required: true, normalize: boolean };
}
```

## 📊 **UI Implementation Requirements**

### **1. Total AM Market Chart (Stacked Bar)**
**Component**: `MarketTotalsChart`  
**Data Source**: `market_totals` table  
**Features**:
- Stacked bar chart showing market size by segment
- Year picker (2023-2024)
- Segment filter (show/hide segments)
- Export to PNG functionality

```typescript
interface MarketTotalsChartProps {
  data: MarketTotal[];
  selectedYear?: number;
  selectedSegments: string[];
  onSegmentToggle: (segment: string) => void;
  onYearChange: (year: number) => void;
}
```

### **2. Revenue by Country & Segment (Pie/Map)**
**Component**: `MarketCountrySegmentChart`  
**Data Source**: `market_by_country_segment` table  
**Features**:
- Pie chart for segment breakdown
- World map with country-based revenue
- Filters for year and segment
- Table view with export

```typescript
interface MarketCountrySegmentProps {
  data: MarketCountrySegment[];
  selectedYear: number;
  selectedSegment?: string;
  viewMode: 'pie' | 'map' | 'table';
  onFilterChange: (filters: MarketFilters) => void;
}
```

## 🗄️ **Database Migration Script**

### **Migration 005: Add Market Intelligence Tables**
```sql
-- Migration: 005_add_market_intelligence_tables.sql

-- Create market_totals table
CREATE TABLE IF NOT EXISTS market_totals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    segment TEXT NOT NULL CHECK (segment IN (
        'print_services',
        'printer_sales',
        'materials',
        'software', 
        'health'
    )),
    value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market_by_country_segment table
CREATE TABLE IF NOT EXISTS market_by_country_segment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    country TEXT NOT NULL,
    segment TEXT NOT NULL CHECK (segment IN (
        'print_services',
        'printer_sales',
        'materials',
        'software',
        'health'
    )),
    value DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_totals_year ON market_totals(year);
CREATE INDEX IF NOT EXISTS idx_market_totals_segment ON market_totals(segment);
CREATE INDEX IF NOT EXISTS idx_market_totals_year_segment ON market_totals(year, segment);

CREATE INDEX IF NOT EXISTS idx_market_country_year ON market_by_country_segment(year);
CREATE INDEX IF NOT EXISTS idx_market_country_segment ON market_by_country_segment(country, segment);
CREATE INDEX IF NOT EXISTS idx_market_country_year_segment ON market_by_country_segment(year, country, segment);

-- Add RLS policies for premium access
ALTER TABLE market_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_by_country_segment ENABLE ROW LEVEL SECURITY;

-- Premium users can access market data
CREATE POLICY "Premium users can access market totals" ON market_totals
    FOR SELECT USING (auth.role() = 'premium' OR auth.role() = 'admin');

CREATE POLICY "Premium users can access market by country" ON market_by_country_segment
    FOR SELECT USING (auth.role() = 'premium' OR auth.role() = 'admin');
```

## 📋 **Implementation Timeline**

### **Week 1 (Aug 10-16)**
- [ ] Create database migration script
- [ ] Execute migration on development database
- [ ] Create data import scripts
- [ ] Import sample data for testing

### **Week 2 (Aug 17-23)**
- [ ] Implement Market Intelligence tab
- [ ] Create chart components (Recharts)
- [ ] Integrate with FilterBar component
- [ ] Test with real data

### **Week 3 (Aug 24-30)**
- [ ] Final testing and optimization
- [ ] Performance validation
- [ ] Client demo preparation

## ✅ **Success Criteria**

### **Database Requirements**
- [ ] `market_totals` table created with proper constraints
- [ ] `market_by_country_segment` table created with proper constraints
- [ ] Indexes created for optimal performance
- [ ] RLS policies implemented for premium access
- [ ] Sample data imported and validated

### **UI Requirements**
- [ ] Total AM Market chart displays correctly
- [ ] Revenue by Country & Segment chart functional
- [ ] Filters work properly (year, segment)
- [ ] Export functionality operational
- [ ] Mobile responsive design

### **Performance Requirements**
- [ ] Chart rendering <2 seconds
- [ ] Data queries <100ms
- [ ] Export generation <5 seconds
- [ ] Mobile performance acceptable

## 🔗 **Related Documents**

- [GAP-ANALYSIS.md](mdc:project-documents/01-planning/GAP-ANALYSIS.md) - Identified missing features
- [kickoff_transcript.md](mdc:project-documents/01-planning/kickoff_transcript.md) - Stakeholder requirements
- [SPRINT-BACKLOG.md](mdc:project-documents/01-planning/SPRINT-BACKLOG.md) - Updated sprint plan
- [TECHNICAL-SPECIFICATION.md](mdc:project-documents/03-technical/TECHNICAL-SPECIFICATION.md) - Technical implementation

---

**Document Version**: 1.0  
**Created**: August 12, 2025  
**Purpose**: Define database schema for missing Market Intelligence features  
**Status**: Ready for implementation
