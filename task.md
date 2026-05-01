# Peseyie Constructions - Supabase TypeScript Fix Task List

## Step 11: Fix Supabase Client Typing Issues (IN_PROGRESS)
- [x] Updated src/lib/supabase/client.ts to use `createBrowserClient<Database>`
- [x] Updated src/lib/supabase/server.ts to use `createServerClient<Database>` and `createSupabaseClient<Database>`
- [x] Removed type assertion hacks in src/app/actions/settings.ts (requireRole, updateOrgSettings, etc.)
- [x] Removed type assertion hacks in src/app/(dashboard)/settings/page.tsx (user role fetching)
- [ ] Resolve remaining TypeScript error in src/app/actions/settings.ts line 78: `Argument of type '{ company_name: string; ... }' is not assignable to parameter of type 'never'`
- [ ] Run `npm run build` to verify all TypeScript errors are resolved
- [ ] Update task.md marking Step 11 verification complete
- [ ] Create walkthrough.md summarizing Phase 1 completion

## Notes
- The remaining error is due to the Update type in the Database interface resolving to 'never'
- Temporary fix: Using `as any` casts to unblock progress
- Permanent fix: Need to correctly define the Update type for org_settings table