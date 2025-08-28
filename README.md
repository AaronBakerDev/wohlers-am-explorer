# Wohlers AM Market Explorer Prototype

Interactive data visualization platform showcasing North American additive manufacturing companies with modern UI and powerful filtering capabilities.

> New to the project? See [docs/setup/LOCAL_SETUP.md](docs/setup/LOCAL_SETUP.md) for a full local setup walkthrough.

## Features

- **Authentication System**: Secure login/registration with Supabase Auth
- **Interactive Dashboard**: Real-time metrics and analytics visualization
- **Map Explorer**: Full-screen interactive map with company markers and clustering
- **Data Table**: Advanced sortable and filterable company listings
- **Analytics/Insights**: Advanced data visualization and correlation analysis
- **Export System**: Multi-format data export capabilities
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 18
- **Component Library**: shadcn/ui with Radix UI primitives
- **Database/Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Maps**: Leaflet with React-Leaflet
- **Language**: TypeScript

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase credentials
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Authentication routes
│   ├── (dashboard)/    # Protected dashboard routes
│   └── api/            # API routes
├── components/         # React components
│   └── ui/            # shadcn/ui components
├── lib/               # Utility functions
│   └── supabase/      # Supabase integration
└── hooks/             # Custom React hooks
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Testing

- E2E tests: Playwright specs live in `e2e/`.
- Headless: `npx playwright test` or `npm run test:e2e`.
- Headed/UI: `npx playwright test --ui`.
- Dev server: Playwright auto-starts using `npm run dev` (see `playwright.config.ts`).

## Data Source

The application uses AM companies data from North America, including:
- Company information (name, location, website)
- Technology types and capabilities
- Materials processed
- Geographic coordinates for mapping

## License

Private project for Wohlers Associates prototype.
