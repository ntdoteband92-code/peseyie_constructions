import type { Database } from './src/lib/supabase/types'

// Test that the Database type is working
const testTable: Database['public']['Tables']['user_roles'] = {
  Row: {
    id: '',
    user_id: '',
    role: 'admin',
    assigned_by: null,
    assigned_at: ''
  }
}

console.log('Test successful')