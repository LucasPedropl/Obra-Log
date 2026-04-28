const fs = require('fs');
const path = require('path');

const files = ['adminActions.ts', 'globalUsers.ts', 'instanceUsers.ts'];

for (const file of files) {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // 1. Add import
    if (!content.includes('createServerSupabaseClient')) {
        content = content.replace(
            /import\s+\{\s*supabaseAdmin\s*\}\s+from\s+'@\/config\/supabaseAdmin';/,
            "import { supabaseAdmin } from '@/config/supabaseAdmin';\nimport { createServerSupabaseClient } from '@/config/supabaseServer';"
        );
    }

    // 2. Inject supabase init inside async functions
    const fnRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\s*\{/g;
    content = content.replace(fnRegex, (match, name, args) => {
        return `${match}\n\tconst supabase = await createServerSupabaseClient();`;
    });

    // 3. Replace usages of supabaseAdmin with supabase (EXCEPT supabaseAdmin.auth)
    // We will find "supabaseAdmin" that is NOT followed by ".auth"
    content = content.replace(/supabaseAdmin(?!\.auth)/g, 'supabase');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Processed ${file}`);
}
