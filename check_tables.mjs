import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking Supabase tables...\n');
  
  const tables = ['companies', 'technologies', 'materials', 'company_technologies', 'company_materials', 'investments', 'mergers_acquisitions', 'service_pricing', 'market_data', 'company_categories'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (!error) {
        console.log(`✅ ${table}: exists (${count || 0} rows)`);
      } else {
        console.log(`❌ ${table}: ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

checkTables().catch(console.error);