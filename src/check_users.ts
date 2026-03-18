import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('users:', data);
  const { data: cu } = await supabase.from('company_users').select('*');
  console.log('company_users:', cu);
}
check();
