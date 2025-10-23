import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = "https://ctwgxtfbbveguhoodgrt.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_SERVICE_KEY) {
  console.error("ERROR: SUPABASE_SERVICE_KEY environment variable is required");
  console.error("Please set it with: set SUPABASE_SERVICE_KEY=your_service_role_key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function applyMigration() {
  try {
    console.log("Reading migration file...");
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250123180000_apply_all_user_fixes.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log("Applying migration...");

    // Execute the SQL via Supabase REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error("Error applying migration:", error);
      process.exit(1);
    }

    console.log("Migration applied successfully!");
    console.log("Result:", data);

  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

applyMigration();
