# Prebuild Check System

The Wohlers AM Explorer prebuild check system ensures code quality and consistency before builds. It automatically runs essential checks to catch issues early in the development process.

## Quick Start

```bash
# Run prebuild checks (default mode)
npm run prebuild

# Run build (automatically includes prebuild check)
npm run build

# Other available commands
npm run typecheck    # TypeScript type checking only
npm run lint:check   # ESLint without max-warnings restriction
```

## Check Modes

### Normal Mode (Default)
- Runs all essential checks
- Fails on critical issues (missing files, type errors, lint errors)
- Warns on environment variable issues locally

```bash
npm run prebuild
```

### Relaxed Mode (Development)
- Runs all checks but continues even on failures
- Useful for development when some issues are acceptable temporarily

```bash
PREBUILD_RELAXED=1 npm run prebuild
```

### Strict Mode (CI/Production)
- Enforces all checks strictly
- Fails on any issues including missing environment variables
- Automatically enabled when `CI=true`

```bash
PREBUILD_STRICT=1 npm run prebuild
# or
CI=true npm run prebuild
```

## What Gets Checked

### 1. Essential Project Files
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ Next.js config (`next.config.js|ts|mjs`)
- ⚠️ Tailwind config (`tailwind.config.js|ts`) - optional

### 2. Node.js Version
- ✅ Verifies Node.js >= 18.17.0 (required for Next.js 15)
- ✅ Reads version requirement from `package.json#engines.node`

### 3. Environment Variables
- ✅ Checks required `NEXT_PUBLIC_*` variables from `.env.local.example`
- ✅ Validates Supabase configuration variables
- ⚠️ Warns locally, fails in CI/strict mode for missing vars

### 4. ESLint Code Quality
- ✅ Runs with `--max-warnings=0` (zero tolerance for warnings)
- ✅ Enforces consistent code style and best practices
- ❌ Fails on any ESLint warnings or errors

### 5. TypeScript Type Checking
- ✅ Runs `tsc --noEmit` for comprehensive type checking
- ✅ Catches type errors before build
- ⚠️ Gracefully skips if TypeScript not available

## Integration with Build Process

The prebuild check is automatically integrated into the build process:

```json
{
  "scripts": {
    "prebuild": "node scripts/prebuild-check.mjs",
    "build": "next build"  // Automatically runs prebuild first
  }
}
```

## Exit Codes

- **0**: All checks passed
- **1**: Checks failed (unless in relaxed mode)

## Common Issues & Solutions

### ESLint Warnings
```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Check without strict warnings
npm run lint:check
```

### TypeScript Errors
```bash
# Run type checking only
npm run typecheck

# Common fixes
# 1. Add proper types instead of 'any'
# 2. Update imports/exports
# 3. Fix null/undefined handling
```

### Missing Environment Variables
```bash
# Copy example file and configure
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Bypass for Development
```bash
# Temporarily bypass all checks
PREBUILD_RELAXED=1 npm run build

# Bypass specific issues by fixing them rather than using relaxed mode
```

## CI/CD Integration

For automated deployments, the prebuild check runs in strict mode:

```bash
# Vercel/Netlify deployment
CI=true npm run build

# Manual CI pipeline
env CI=true npm run prebuild && npm run build
```

## Performance

- **Typical runtime**: 2-8 seconds
- **Parallel execution**: ESLint and TypeScript run sequentially for clear output
- **Caching**: Leverages npm/Next.js caching for faster subsequent runs

## Configuration

The prebuild check is configured in `scripts/prebuild-check.mjs`:

- Node.js version requirement from `package.json#engines.node`
- Environment variables from `.env.local.example`
- ESLint configuration from project's ESLint config
- TypeScript configuration from `tsconfig.json`

No additional configuration required for most use cases.