const fs = require('fs');
const file = 'C:/Users/Pedro/Downloads/Obra-Log/apps/app/src/app/actions/overviewActions.ts';
let content = fs.readFileSync(file, 'utf8');

// replace the import
content = content.replace(
  "import { supabaseAdmin } from '@/config/supabaseAdmin';",
  "import { createServerSupabaseClient } from '@/config/supabaseServer';"
);

// fix the first function
content = content.replace(
  "export async function getObraOverviewStats(siteId: string) {\n\ttry {\n",
  "export async function getObraOverviewStats(siteId: string) {\n\tconst supabase = await createServerSupabaseClient();\n\ttry {\n"
);

// check if there are other exports that need supabase
if (content.includes("export async function getRecentEquipments") && !content.includes("const supabase = await createServerSupabaseClient();", content.indexOf("getRecentEquipments"))) {
  content = content.replace(
    "export async function getRecentEquipments(siteId: string) {\n\ttry {\n",
    "export async function getRecentEquipments(siteId: string) {\n\tconst supabase = await createServerSupabaseClient();\n\ttry {\n"
  );
}

// We'll just generically inject 'const supabase = await createServerSupabaseClient();' into any export async function that lacks it
const regex = /export async function (\w+)\(([^)]*)\) \{\n\ttry \{/g;
content = content.replace(regex, (match, p1, p2) => {
   return `export async function ${p1}(${p2}) {\n\tconst supabase = await createServerSupabaseClient();\n\ttry {`;
});

// Remove duplicates if any
content = content.replace(/(const supabase = await createServerSupabaseClient\(\);\n\t)+/g, "const supabase = await createServerSupabaseClient();\n\t");

fs.writeFileSync(file, content);
