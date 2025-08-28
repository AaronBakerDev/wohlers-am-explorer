# MVP Task Breakdown - Wohlers AM Explorer

**Status**: Active  
**Created**: August 12, 2025  
**Timeline**: 3 weeks (end of August)  
**Total Tasks**: 38 main tasks, 140+ subtasks  
**Estimated Hours**: 118-149 total hours  

## 📊 **Executive Summary**

| Epic | Priority | Tasks | Subtasks | Est. Hours | Assigned Agent |
|------|----------|--------|----------|------------|---------------|
| **A - Data Architecture** | P0 | 3 | 15 | 20-26h | Developer |
| **B - Market Insights** | P0 | 4 | 18 | 28-36h | Dev + Designer |
| **C - Quotes Benchmark** | P0 | 2 | 11 | 16-21h | Dev + Designer |
| **D - Prebuilt Tabs** | P0 | 2 | 8 | 8-12h | Developer |
| **E - Export/Sharing** | P0 | 2 | 11 | 14-18h | Developer |
| **F - Investments/Gating** | P1 | 2 | 10 | 14-18h | Developer |
| **G - QA & Polish** | P0 | 2 | 13 | 18-23h | QA + Designer |

## 🎯 **Priority Levels**
- **P0 (Must-Have)**: Core MVP features for vendor selection - 31 tasks
- **P1 (Nice-to-Have)**: Optional features if time permits - 7 tasks

## 📅 **3-Week Timeline**
- **Week 1**: Data Architecture (Epic A) + UI Framework (Epic B1, C1)
- **Week 2**: Market Insights (Epic B) + Quotes Benchmark (Epic C) + Prebuilt Tabs (Epic D)
- **Week 3**: Exports (Epic E) + QA/Polish (Epic G) + Optional P1 features

---

## **EPIC A — DATA ARCHITECTURE & FOUNDATION** (Priority: P0)

### A1. Market Intelligence Data Schema Implementation
**Agent**: Developer | **Priority**: P0 | **Est**: 6-8h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **A1.1** Create `market_totals` table with proper indexing (1-2h)
- [ ] **A1.2** Create `market_by_country_segment` table with relationships (1-2h)  
- [ ] **A1.3** Implement database migration scripts and rollback procedures (2h)
- [ ] **A1.4** Create TypeScript types for market data structures (1-2h)
- [ ] **A1.5** Add data validation and constraints (1h)
- [ ] **A1.6** Set up RLS policies for market data access (1h)

**Dependencies**: None (foundational)  
**Acceptance**: Database schema supports market intelligence features with proper types and validation

### A2. Data Import & Seeding Pipeline
**Agent**: Developer | **Priority**: P0 | **Est**: 8-10h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **A2.1** Extract and normalize market totals data from spreadsheet (2-3h)
- [ ] **A2.2** Extract and normalize country/segment revenue data (2-3h)
- [ ] **A2.3** Import quotes/pricing data with validation (2-3h)
- [ ] **A2.4** Create data verification scripts and test data integrity (2h)

**Dependencies**: A1  
**Acceptance**: All market data imported and validated, ready for API consumption

### A3. API Routes for Market Data
**Agent**: Developer | **Priority**: P0 | **Est**: 6-8h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **A3.1** Create `/api/market/totals` endpoint with filtering (2h)
- [ ] **A3.2** Create `/api/market/country-segment` endpoint (2h)
- [ ] **A3.3** Create `/api/quotes/comparison` endpoint (2-3h)
- [ ] **A3.4** Add proper error handling and response validation (1-2h)

**Dependencies**: A1, A2  
**Acceptance**: All market data accessible via API with proper error handling and performance

---

## **EPIC B — MARKET INSIGHTS TAB IMPLEMENTATION** (Priority: P0)

### B1. Market Insights Page Structure
**Agent**: Designer | **Priority**: P0 | **Est**: 4-6h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **B1.1** Design Market Insights page layout using existing design system (2h)
- [ ] **B1.2** Create responsive navigation for Market Insights tab (1h)
- [ ] **B1.3** Design filter bar component for Market Insights (2h)
- [ ] **B1.4** Create page structure with chart placeholders (1h)

**Dependencies**: None  
**Acceptance**: Market Insights page structure consistent with existing design system

### B2. Total AM Market Stacked Bar Chart
**Agent**: Developer | **Priority**: P0 | **Est**: 8-10h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **B2.1** Implement stacked bar chart component using Recharts (3-4h)
- [ ] **B2.2** Add year picker functionality (2h)
- [ ] **B2.3** Connect chart to market totals API endpoint (2h)
- [ ] **B2.4** Add chart export to PNG functionality (2-3h)
- [ ] **B2.5** Implement responsive design for mobile devices (1h)

**Dependencies**: A3, B1  
**Acceptance**: Interactive stacked bar chart with export functionality

### B3. Revenue by Country & Segment Visualization
**Agent**: Developer | **Priority**: P0 | **Est**: 10-12h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **B3.1** Create data table component for country/segment revenue (3h)
- [ ] **B3.2** Implement pie chart visualization for country breakdown (3h)
- [ ] **B3.3** Add country and segment filter controls (2h)
- [ ] **B3.4** Connect table and chart to API with filtering (2-3h)
- [ ] **B3.5** Add CSV export for table data (2h)

**Dependencies**: A3, B1  
**Acceptance**: Country/segment data viewable in table and chart formats with filtering

### B4. Country Overview Map (P1)
**Agent**: Developer | **Priority**: P1 | **Est**: 6-8h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **B4.1** Research and implement choropleth mapping solution (4h)
- [ ] **B4.2** Add hover tooltips with country details (2h)
- [ ] **B4.3** Integrate with existing filter system (2h)

**Dependencies**: B3  
**Acceptance**: Interactive country map with revenue data visualization

---

## **EPIC C — QUOTES BENCHMARK TAB IMPLEMENTATION** (Priority: P0)

### C1. Quotes Benchmark Page Structure
**Agent**: Designer | **Priority**: P0 | **Est**: 4-6h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **C1.1** Design Quotes Benchmark page layout (2h)
- [ ] **C1.2** Create filter interface for quotes comparison (2-3h)
- [ ] **C1.3** Design comparison results table layout (1-2h)

**Dependencies**: None  
**Acceptance**: Quotes comparison page design complete with filtering interface

### C2. Quote Comparison Functionality
**Agent**: Developer | **Priority**: P0 | **Est**: 12-15h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **C2.1** Implement quote filtering system (4h)
- [ ] **C2.2** Create comparison results table with sorting (4h)
- [ ] **C2.3** Add statistics summary (min/median/max calculations) (3h)
- [ ] **C2.4** Connect to pricing data API with real-time filtering (3h)
- [ ] **C2.5** Add CSV export functionality (2h)
- [ ] **C2.6** Add quote comparison snapshot export to PNG (P1) (3-4h)

**Dependencies**: A3, C1  
**Acceptance**: Full quote comparison system with filtering and export capabilities

---

## **EPIC D — PREBUILT ENTRY POINTS** (Priority: P0)

### D1. Print Services Tab Implementation
**Agent**: Developer | **Priority**: P0 | **Est**: 4-6h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **D1.1** Create Print Services navigation tab (1h)
- [ ] **D1.2** Implement pre-filtered company directory for print services (2h)
- [ ] **D1.3** Add "Print Services" badge/identifier to filtered companies (1h)
- [ ] **D1.4** Enable additional filtering on pre-filtered view (2h)

**Dependencies**: Existing company directory  
**Acceptance**: Print Services tab with pre-filtered directory view

### D2. AM Systems Manufacturers Tab Implementation
**Agent**: Developer | **Priority**: P0 | **Est**: 4-6h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **D2.1** Create AM Systems Manufacturers navigation tab (1h)
- [ ] **D2.2** Implement pre-filtered directory for AM systems manufacturers (2h)
- [ ] **D2.3** Add "AM Systems" badge/identifier to filtered companies (1h)
- [ ] **D2.4** Enable additional filtering on pre-filtered view (2h)

**Dependencies**: Existing company directory  
**Acceptance**: AM Systems tab with pre-filtered directory view

---

## **EPIC E — EXPORT & SHARING FUNCTIONALITY** (Priority: P0)

### E1. CSV Export Enhancement
**Agent**: Developer | **Priority**: P0 | **Est**: 6-8h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **E1.1** Standardize CSV export format across all components (2h)
- [ ] **E1.2** Add export metadata (timestamp, filters applied) (2h)
- [ ] **E1.3** Implement bulk export functionality (3h)
- [ ] **E1.4** Add progress indicators for large exports (1-2h)

**Dependencies**: B2, B3, C2  
**Acceptance**: Consistent CSV exports across all data views

### E2. Chart Export to PNG
**Agent**: Developer | **Priority**: P0 | **Est**: 8-10h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **E2.1** Implement chart-to-image conversion for stacked bar chart (4h)
- [ ] **E2.2** Add chart export for pie charts (3h)
- [ ] **E2.3** Add export metadata overlay (chart title, date, filters) (3h)
- [ ] **E2.4** Optimize image quality for presentation use (1h)

**Dependencies**: B2, B3  
**Acceptance**: High-quality PNG exports suitable for PowerPoint presentations

---

## **EPIC F — INVESTMENTS/M&A TAB (OPTIONAL)** (Priority: P1)

### F1. Investments Tab Implementation (P1)
**Agent**: Developer | **Priority**: P1 | **Est**: 8-10h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **F1.1** Create investments data API endpoint (3h)
- [ ] **F1.2** Design and implement investments table view (3h)
- [ ] **F1.3** Add investment filtering (year, round, country) (2h)
- [ ] **F1.4** Add investment summary statistics (count, total amount) (2h)

**Dependencies**: A3 (extended)  
**Acceptance**: Investment data viewable with filtering and summary statistics

### F2. Lightweight Gating Implementation (P1)
**Agent**: Developer | **Priority**: P1 | **Est**: 6-8h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **F2.1** Add premium badges to Market Insights and Quotes tabs (2h)
- [ ] **F2.2** Create "Request Access" CTA modal (2h)
- [ ] **F2.3** Implement route-level access checking (2h)
- [ ] **F2.4** Add email notification for access requests (2h)

**Dependencies**: None  
**Acceptance**: Lightweight gating system for premium content

---

## **EPIC G — QUALITY ASSURANCE & POLISH** (Priority: P0)

### G1. Comprehensive Testing
**Agent**: QA | **Priority**: P0 | **Est**: 12-15h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **G1.1** Test all Market Insights functionality end-to-end (3h)
- [ ] **G1.2** Test Quotes Benchmark functionality completely (3h)
- [ ] **G1.3** Test prebuilt tab filtering and navigation (2h)
- [ ] **G1.4** Test export functionality across all components (3h)
- [ ] **G1.5** Mobile responsiveness testing (2h)
- [ ] **G1.6** Cross-browser testing (IE11, Safari, Firefox, Chrome) (2-3h)
- [ ] **G1.7** Performance testing with full dataset (2h)

**Dependencies**: All P0 tasks  
**Acceptance**: All MVP functionality tested and verified across browsers and devices

### G2. Demo Preparation
**Agent**: QA + Designer | **Priority**: P0 | **Est**: 6-8h | **Status**: ❌ Not Started

**Subtasks**:
- [ ] **G2.1** Create demo script for stakeholder presentation (2h)
- [ ] **G2.2** Prepare demo data and scenarios (2h)
- [ ] **G2.3** Create demo environment with production-like data (2h)
- [ ] **G2.4** Practice demo run with stakeholder feedback (2h)

**Dependencies**: All P0 tasks  
**Acceptance**: Demo ready for stakeholder presentation with scripted scenarios

---

## 📋 **Task Status Legend**
- ❌ **Not Started**: Task not yet begun
- 🔄 **In Progress**: Currently being worked on
- ⏸️ **Blocked**: Waiting for dependencies or decisions
- ✅ **Complete**: Task finished and verified
- 🔁 **Review**: Ready for review/testing
- ⚠️ **Issue**: Problem found, needs attention

## 📊 **Progress Tracking**
- **Total Tasks**: 0/38 complete (0%)
- **P0 Tasks**: 0/31 complete (0%)  
- **P1 Tasks**: 0/7 complete (0%)
- **Subtasks**: 0/140+ complete (0%)

---

**Next Steps**: Begin with Epic A (Data Architecture) as foundation for all other features.