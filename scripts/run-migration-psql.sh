#!/bin/bash

# Run Vendor Schema Migration using psql
# This script connects to Supabase and executes the migration files

set -e

echo "🚀 Starting Vendor Schema Migration"
echo "=================================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found. Please create it with your Supabase credentials."
    exit 1
fi

# Load environment variables from .env.local
export $(cat .env.local | xargs)

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    exit 1
fi

# Extract database connection details from Supabase URL
# Format: https://project-ref.supabase.co
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')
DB_HOST="${PROJECT_REF}.supabase.co"
DB_NAME="postgres"
DB_PORT="5432"

echo "🔌 Connecting to Supabase database..."
echo "   Host: $DB_HOST"
echo "   Project: $PROJECT_REF"

# Note: For production Supabase, you need the service_role key and proper connection
echo "⚠️  This requires database connection credentials."
echo "   You may need to use the Supabase dashboard SQL editor instead."
echo ""

# List migration files to run
MIGRATION_FILES=(
    "sql-migrations/010_vendor_data_schema_mapping_part1.sql"
    "sql-migrations/010_vendor_data_schema_mapping_part2.sql" 
    "sql-migrations/010_vendor_data_schema_mapping_part3.sql"
    "sql-migrations/010_vendor_data_schema_mapping_part4.sql"
    "sql-migrations/010_vendor_data_schema_mapping_part5.sql"
)

echo "📁 Migration files to execute:"
for file in "${MIGRATION_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (not found)"
    fi
done

echo ""
echo "📋 Manual Instructions:"
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Navigate to your project > SQL Editor"
echo "3. Copy and paste the contents of each migration file in order:"
echo ""

for i, file in "${!MIGRATION_FILES[@]}"; do
    echo "   Step $((i+1)): Execute $file"
done

echo ""
echo "4. Then run: npm run data:import-vendor"
echo ""
echo "🔗 Or use the Supabase CLI with proper connection setup"

# Provide the SQL files as individual commands for easy copy-paste
echo ""
echo "📄 Migration file contents:"
echo "=========================="

for file in "${MIGRATION_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo ""
        echo "📄 File: $file"
        echo "-- Copy the content below to Supabase SQL Editor:"
        echo "-- ================================================"
        cat "$file"
        echo ""
        echo "-- End of $file"
        echo "-- ================================================"
    fi
done