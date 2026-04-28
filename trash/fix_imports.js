const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/Pedro/Downloads/Obra-Log/apps/app/src/app/actions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('createServerSupabaseClient') && !content.includes('import { createServerSupabaseClient }')) {
    const importStatement = "import { createServerSupabaseClient } from '@/config/supabaseServer';\n";
    content = importStatement + content;
    fs.writeFileSync(filePath, content);
    console.log('Fixed imports in', file);
  }
});