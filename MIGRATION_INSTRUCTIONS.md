# Migration 007 Manual Execution Instructions

Since we can't execute the migration automatically, please follow these steps to apply migration `007_wohlers_reports_schema.sql`:

## Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Go to https://supabase.com/dashboard/project/trxudkgkbhylmcnqaqmm
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `sql-migrations/007_wohlers_reports_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

## Option 2: Alternative Execution Steps

If the file is too large for the web editor, run it in smaller chunks:

### Step 1: Create Core Tables
```sql
-- Core Tables (Copy from lines 10-96 of the migration file)
CREATE TABLE IF NOT EXISTS coes_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('COE', 'Association')),
    country VARCHAR(100) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    established_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continue with other tables...
```

### Step 2: Create Indexes (Lines 152-169)
### Step 3: Create Views (Lines 173-242)
### Step 4: Insert Seed Data (Lines 248-323)
### Step 5: Enable RLS (Lines 329-355)

## Verification

After running the migration, you can verify it worked by running:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('coes_associations', 'contributors', 'events', 'america_makes_members', 'countries');
```

This should return 5 rows showing the new tables exist.

## What This Migration Adds

- ✅ COE's and Associations table
- ✅ Contributors table  
- ✅ Events table (for ICAM)
- ✅ America Makes Members table
- ✅ Countries and US States reference data
- ✅ Company types standardization
- ✅ Views for reporting
- ✅ Proper indexing and RLS policies

## Next Steps After Migration

Once this migration is applied, we can:
1. Import the missing data for the 4 remaining dashboard tabs
2. Complete Phase II (schema + data)
3. Move to Phase III (enhanced features)