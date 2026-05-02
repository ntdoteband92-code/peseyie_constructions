import type { Database } from './src/lib/supabase/types'

const testTable: Database['public']['Tables']['user_roles']['Row'] = {
  id: '',
  user_id: '',
  role: 'admin',
  assigned_by: 'test',
  assigned_at: ''
}

console.log('Test successful')