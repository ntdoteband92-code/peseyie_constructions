import type { Database } from './types'

const test = (db: Database) => {
  const row: Database['public']['Tables']['user_roles']['Row'] = {
    id: 'test',
    user_id: 'test',
    role: 'admin',
    assigned_by: 'test',
    assigned_at: '2023-01-01T00:00:00Z'
  }

  console.log('Database type test passed')
  return row
}

export default test