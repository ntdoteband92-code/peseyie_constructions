import type { Database } from './types'

// Test that the Database type is working by accessing a table
const test = (db: Database) => {
  // This should work if the generic is properly applied
  const userRolesTable = db.public.Tables['user_roles']
  const row: userRolesTable.Row = {
    id: 'test',
    user_id: 'test',
    role: 'admin',
    assigned_by: null,
    assigned_at: '2023-01-01T00:00:00Z'
  }
  
  console.log('Database type test passed')
  return row
}

export default test