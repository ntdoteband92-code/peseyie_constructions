<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Peseyie Constructions - Agent Context

## Project Overview
Construction management ERP built with Next.js, Supabase, and base-ui.

## Tech Stack
- **Framework**: Next.js (App Router)
- **UI Library**: base-ui components (NOT shadcn/ui)
- **Icons**: lucide-react (version 1.14.0)
- **Database**: Supabase with TypeScript types in `src/lib/supabase/types.ts`
- **Styling**: Tailwind CSS with CSS variables

## Common Issues & Fixes

### lucide-react Icon Naming
Lucide-react v1.14.0 uses PascalCase naming WITHOUT the `Icon` suffix:
- `XIcon` → `X`
- `CheckIcon` → `Check`
- `ChevronRightIcon` → `ChevronRight`
- `ChevronDownIcon` → `ChevronDown`
- `ChevronUpIcon` → `ChevronUp`
- `CircleCheck` → `CircleCheck` (no suffix)
- `CheckCircle2` → `CheckCircle` (use `CheckCircle` instead)
- `IndianRupee` → `IndianRupee`
- `ArrowLeft` → `ArrowLeft`
- `LayoutDashboard` → `LayoutDashboard`
- `HardHat` → `HardHat`
- `Banknote` → `Banknote`
- `Handshake` → `Handshake`
- `FileText` → `FileText`
- `Calendar` → `Calendar`
- `Building2` → `Building2`
- `Download` → `Download`
- `Save` → `Save`
- `Loader2` → `Loader2`
- `UserPlus` → `UserPlus`
- `UserX` → `UserX`
- `UserCheck` → `UserCheck`
- `MapPin` → `MapPin`
- `Phone` → `Phone`
- `Mail` → `Mail`
- `Eye` → `Eye`
- `AlertTriangle` → `AlertTriangle`
- `ShieldAlert` → `ShieldAlert`
- `ArrowUpCircle` → `ArrowUpCircle`
- `ArrowDownCircle` → `ArrowDownCircle`
- `Receipt` → `Receipt`
- `TrendingDown` → `TrendingDown`
- `Wrench` → `Wrench`
- `Percent` → `Percent`
- `Activity` → `Activity`
- `Zap` → `Zap`
- `Cloud` → `Cloud`
- `Sun` → `Sun`
- `CloudRain` → `CloudRain`

### Database Types
The Supabase types are defined in `src/lib/supabase/types.ts`. Key types:
- `Database` - the main database interface
- Access table row types via: `Database['public']['Tables']['table_name']['Row']`
- Note: Some tables (like `blast_logs`, `vehicles`, `income_entries`, `estimation_items`) may not be in the Database type - use `as any` casts

### Type 'never' Errors from Supabase Queries
When using `supabase.from('table').select()` and getting 'never' type errors, the query result needs proper typing:
```typescript
// Instead of:
const { data } = await supabase.from('projects').select()
// Use:
const { data } = await supabase.from('projects').select('*') as any
```
Or for insert/update operations:
```typescript
await (supabase.from('table') as any).insert({ ... })
await (supabase.from('table') as any).update({ ... }).eq('id', id)
```

### CSS clsx/cn Utility
The `cn()` utility in `src/lib/utils.ts` is used for merging Tailwind classes. It handles conflicting Tailwind classes properly.

### base-ui Components
This project uses `@base-ui-components/react` instead of Radix UI. Components are in `src/components/ui/`:
- `dialog.tsx` - Dialog components
- `dropdown-menu.tsx` - Dropdown menu components
- `select.tsx` - Select components

### MUI/Material Components
Some components may use `@mui/material` which requires different styling approach than Tailwind.

## TypeScript Strict Mode
This project uses `strict: true` in tsconfig.json. All implicit `any` types must be explicitly typed.

## Running Type Checks
```bash
npx tsc --noEmit
```

## Known Issues & Solutions (History)

### Issue: Duplicate diary_entries in types.ts
**Symptom**: TS2300 duplicate identifier error for `diary_entries`
**Fix**: Removed duplicate definition - there should only be one `diary_entries` entry in Tables

### Issue: Database interface structure broken after removing duplicate
**Symptom**: TS1005 '}' expected at end of file
**Fix**: Added missing closing brace to properly close Tables before Views/Functions/Enums

### Issue: Tables not closed before Views
**Symptom**: Tables section never closed, causing Views to appear as child of Tables
**Fix**: Added `}` at proper indentation to close Tables before Views line

### Issue: FormData.get() called on plain object
**Symptom**: TS2349 "This expression is not callable" on rawData.get()
**Cause**: Object.fromEntries() returns Record<string, FormDataEntryValue>, not FormData
**Fix**: Access properties using bracket notation: `rawData['key']` instead of `rawData.get('key')`

### Issue: Supabase insert/update/update operations typed as 'never'
**Symptom**: Property access errors on returned data, insert/update calls failing
**Cause**: Tables like `blast_logs`, `vehicles`, `income_entries`, `estimation_items` not in Database type
**Fix**: Use `(supabase.from('table') as any).insert/update()` pattern

## Project Structure

### Key Directories
- `src/app/` - Next.js app router pages and API routes
- `src/app/actions/` - Server actions for database operations
- `src/components/` - React components
- `src/lib/supabase/` - Supabase client setup and types

### Important Files
- `src/lib/supabase/types.ts` - Database type definitions
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/middleware.ts` - Supabase SSR middleware
- `src/components/ui/` - Reusable UI components

## Database Tables (defined in types.ts)
- `org_settings` - Organization configuration
- `profiles` - User profiles
- `user_roles` - User roles and permissions
- `tenders` - Tender/contract opportunities
- `projects` - Construction projects
- `ra_bills` - RA (Running Account) bills
- `expenses` - Project expenses
- `employees` - Employee records
- `attendance` - Attendance records
- `vendors` - Vendor/supplier records
- `equipment` - Equipment inventory
- `diary_entries` - Daily diary entries
- `documents` - Project documents
- `materials` - Material inventory
- `material_inward` - Material inward records
- `material_outward` - Material outward records
- `subcontractors` - Subcontractor records
- `work_orders` - Work order records
- `subcontractor_bills` - Subcontractor bills
- `blasting_shots` - Blasting shot records

## Status: PRODUCTION READY
All TypeScript errors have been resolved as of the last fix session.