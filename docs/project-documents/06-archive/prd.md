# Product Requirements Document - Wohlers AM Market Explorer Prototype

## Project Overview
Interactive data visualization platform showcasing North American additive manufacturing companies with modern UI and powerful filtering capabilities. The data we'll use is in project-documents/AM companies in NA - Copy.xlsx.

## Screen Inventory & Requirements

### 1. Authentication Screen

#### Data Display
- Application logo/branding
- Login form fields (email, password)
- Sign up option
- "Remember me" checkbox
- Error messages for failed authentication

#### Functionality
- User login with email/password
- User registration
- Password validation
- Redirect to dashboard after successful login
- Remember user session
- Show loading state during authentication

---

### 2. Main Dashboard Screen

#### Data Display
- Total company count (with animation)
- Interactive map of North America showing company locations
- Key metrics cards:
  - Total companies
  - Number of states represented
  - Most common technology
  - Most common material
- Distribution charts:
  - Pie chart: Companies by technology type
  - Bar chart: Companies by material type
  - Bar chart: Companies by state (top 10)
- Recent activity or highlights section

#### Functionality
- All metrics update based on active filters
- Charts are clickable to apply filters
- Smooth animations when data updates
- Responsive grid layout
- Dark/light mode toggle
- Export current view data

---

### 3. Map Explorer Screen

#### Data Display
- Full-screen interactive map focused on North America
- Company markers clustered by location
- Marker styling indicates technology type
- Active filter summary bar
- Company count indicator
- Map legend for marker types

#### Functionality
- Pan and zoom map
- Click clusters to zoom and expand
- Hover markers to see company preview
- Click marker for detailed company information
- Apply filters updates markers in real-time
- Search by company name or location
- Toggle between different base map styles

---

### 4. Company Detail Modal/Panel

#### Data Display
- Company name and logo (if available)
- Full address with map preview
- Website link
- Technologies used (with badges/tags)
- Materials processed (with badges/tags)
- Related companies (same city/technology)

#### Functionality
- Open from map marker click or table row click
- Copy address to clipboard
- Open website in new tab
- Click technology/material tags to filter by that criteria
- Navigate to next/previous company
- Close and return to previous view

---

### 5. Data Table Screen

#### Data Display
- Sortable columns:
  - Company name
  - City
  - State
  - Technologies (as tags)
  - Materials (as tags)
  - Website
- Row count and pagination info
- Active filters indicator
- Selected rows count

#### Functionality
- Sort by any column
- Multi-column sorting
- Global search across all fields
- Select individual or all rows
- Pagination with customizable page size
- Column visibility toggle
- Export selected or filtered data
- Click row to view company details
- Responsive horizontal scroll on mobile

---

### 6. Filter Panel (Overlay/Sidebar)

#### Data Display
- Filter sections:
  - States (checkbox list with counts)
  - Technologies (grouped checkboxes with counts)
  - Materials (grouped checkboxes with counts)
- Active filter summary
- Result count preview
- Clear all filters option

#### Functionality
- Multi-select within each category
- Select/deselect all within category
- Search within filter options
- See live preview of result count
- Apply filters updates all screens
- Persist filter state during session
- Smooth open/close animation
- Mobile-friendly full-screen mode

---

### 7. Analytics/Insights Screen

#### Data Display
- Geographic distribution heat map
- Technology adoption trends
- Material type distribution
- State-by-state comparison charts
- Top cities by company concentration
- Technology-material correlation matrix

#### Functionality
- Interactive charts with drill-down capability
- Hover for detailed tooltips
- Click to filter other visualizations
- Toggle between different chart types
- Export charts as images
- Fullscreen view for detailed analysis

---

### 8. Export Preview Screen

#### Data Display
- Preview of data to be exported
- Export format options (CSV, Excel)
- Column selection checkboxes
- Row count to be exported
- File size estimate

#### Functionality
- Select/deselect columns for export
- Choose between filtered or all data
- Preview first 10 rows
- Download file
- Email export option (future enhancement)
- Cancel and return to previous screen

---

### 9. User Profile/Settings Screen

#### Data Display
- User email and account info
- Theme preference setting
- Default view preferences
- Export history
- Session information

#### Functionality
- Toggle dark/light mode
- Change password
- Set default landing screen
- Clear saved filters
- Download export history
- Logout

---

## Global UI Elements

### Persistent Navigation
- Navigate between main screens (Dashboard, Map, Table, Analytics)
- Quick access to filters
- User menu
- Search bar

### Data States
- Loading states with skeletons
- Empty states with helpful messages
- Error states with retry options
- Success notifications for actions

### Responsive Behavior
- **Mobile**: Stack visualizations vertically, full-screen modals
- **Tablet**: Adjust grid layouts, maintain side panels
- **Desktop**: Full multi-column layouts, side-by-side comparisons

---

## Data Integration Requirements

### Real-time Updates
- Filters apply across all screens instantly
- Chart animations on data changes
- Map markers update smoothly
- Table refreshes without losing scroll position

### Performance Targets
- Initial load under 3 seconds
- Filter application under 500ms
- Smooth 60fps animations
- Export generation under 5 seconds for full dataset