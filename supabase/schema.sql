-- ============================================================
-- PESEYIE CONSTRUCTIONS - Supabase Database Schema
-- Generated from codebase analysis
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS (must be created before tables that use them)
-- ============================================================

DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS tender_status CASCADE;
DROP TYPE IF EXISTS ra_bill_status CASCADE;
DROP TYPE IF EXISTS payment_mode CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS ownership_type CASCADE;
DROP TYPE IF EXISTS equipment_status CASCADE;
DROP TYPE IF EXISTS wage_type CASCADE;
DROP TYPE IF EXISTS employment_type CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS work_order_status CASCADE;
DROP TYPE IF EXISTS weather_condition CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;
DROP TYPE IF EXISTS material_unit CASCADE;

CREATE TYPE app_role AS ENUM ('admin', 'manager', 'accountant', 'supervisor', 'viewer');
CREATE TYPE project_status AS ENUM ('ongoing', 'completed', 'on_hold', 'defect_liability', 'terminated');
CREATE TYPE tender_status AS ENUM ('identified', 'documents_purchased', 'bid_submitted', 'l1_lowest_bidder', 'awarded', 'lost', 'withdrawn');
CREATE TYPE ra_bill_status AS ENUM ('draft', 'submitted', 'under_measurement', 'certified', 'payment_released', 'partially_paid');
CREATE TYPE payment_mode AS ENUM ('cash', 'bank_transfer', 'neft_rtgs', 'cheque', 'upi');
CREATE TYPE expense_category AS ENUM ('fuel', 'labour_wages', 'materials', 'equipment_hire', 'explosives_purchase', 'transport', 'subcontractor_payment', 'royalty', 'tds_paid', 'gst_paid', 'office_admin', 'repairs_maintenance', 'miscellaneous');
CREATE TYPE ownership_type AS ENUM ('company_owned', 'hired');
CREATE TYPE equipment_status AS ENUM ('active', 'under_maintenance', 'idle', 'hired_out', 'decommissioned');
CREATE TYPE wage_type AS ENUM ('daily_rate', 'monthly_salary');
CREATE TYPE employment_type AS ENUM ('direct', 'contractual');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'overtime', 'leave');
CREATE TYPE work_order_status AS ENUM ('issued', 'in_progress', 'completed', 'partially_completed', 'disputed', 'terminated');
CREATE TYPE weather_condition AS ENUM ('clear', 'cloudy', 'rain', 'heavy_rain', 'fog');
CREATE TYPE document_category AS ENUM ('contract', 'drawing', 'boq', 'tender_document', 'blasting_license', 'explosive_license', 'equipment_rc', 'insurance', 'fitness_certificate', 'labour_license', 'govt_correspondence', 'ra_bill_copy', 'photo_report', 'other');
CREATE TYPE material_unit AS ENUM ('mt', 'cft', 'cum', 'bags', 'litres', 'kg', 'nos', 'rmt');

-- ============================================================
-- TABLES IN CORRECT ORDER (dependencies first)
-- ============================================================

-- 1. ORG_SETTINGS (no dependencies)
CREATE TABLE org_settings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name text NOT NULL,
  address text,
  gstin text,
  pan text,
  phone text,
  email text,
  logo_url text,
  financial_year_start integer NOT NULL DEFAULT 4,
  default_retention_pct numeric NOT NULL DEFAULT 5,
  default_tds_pct numeric NOT NULL DEFAULT 1,
  default_labour_cess_pct numeric NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- 2. PROFILES (no dependencies)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TENDERS (no dependencies)
CREATE TABLE tenders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tender_name text NOT NULL,
  nit_number text,
  department text,
  issuing_department text,
  tender_value numeric,
  duration_months integer,
  submission_deadline date,
  tender_fee numeric,
  emd_amount numeric,
  emd_status text,
  emd_refund_date date,
  bid_submission_date date,
  bid_opening_date date,
  status tender_status NOT NULL DEFAULT 'identified',
  our_quoted_amount numeric,
  rival_l1_amount numeric,
  converted_project_id uuid,
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_is_deleted ON tenders(is_deleted);

-- 4. PROJECTS (depends on tenders)
CREATE TABLE projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_name text NOT NULL,
  contract_number text,
  tender_id uuid REFERENCES tenders(id),
  client_name text,
  client_contact_person text,
  client_phone text,
  contract_value numeric NOT NULL DEFAULT 0,
  contract_date date,
  start_date date,
  expected_end_date date,
  actual_end_date date,
  location_district text,
  location_state text,
  project_type text[],
  status project_status NOT NULL DEFAULT 'ongoing',
  security_deposit numeric,
  security_deposit_status text,
  scope_of_work text,
  project_manager_id text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_is_deleted ON projects(is_deleted);
CREATE INDEX idx_projects_tender_id ON projects(tender_id);

-- 5. VENDORS (no dependencies on our tables)
CREATE TABLE vendors (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_name text NOT NULL,
  contact_person text,
  phone text,
  address text,
  gstin text,
  pan text,
  material_supplied text,
  credit_days integer,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_vendors_vendor_name ON vendors(vendor_name);
CREATE INDEX idx_vendors_is_deleted ON vendors(is_deleted);

-- 6. EMPLOYEES (no dependencies)
CREATE TABLE employees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name text NOT NULL,
  role text NOT NULL,
  contact_number text,
  emergency_contact text,
  address text,
  id_proof_type text,
  id_proof_number text,
  joining_date date,
  employment_type employment_type NOT NULL DEFAULT 'direct',
  wage_type wage_type NOT NULL DEFAULT 'daily_rate',
  wage_rate numeric NOT NULL DEFAULT 0,
  ot_rate numeric,
  pf_applicable boolean NOT NULL DEFAULT false,
  esi_applicable boolean NOT NULL DEFAULT false,
  bank_account_no text,
  bank_ifsc text,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_employees_is_deleted ON employees(is_deleted);
CREATE INDEX idx_employees_full_name ON employees(full_name);

-- 7. WORKERS (no dependencies)
CREATE TABLE workers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  worker_name text NOT NULL,
  daily_wage numeric,
  trade text,
  father_name text,
  date_of_joining date,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_workers_is_active ON workers(is_active);

-- 8. SUBCONTRACTORS (no dependencies)
CREATE TABLE subcontractors (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  firm_name text NOT NULL,
  proprietor_name text,
  contact_phone text,
  address text,
  gstin text,
  pan text,
  specialty text,
  license_info text,
  is_active boolean NOT NULL DEFAULT true,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_subcontractors_firm_name ON subcontractors(firm_name);
CREATE INDEX idx_subcontractors_is_active ON subcontractors(is_active);
CREATE INDEX idx_subcontractors_is_deleted ON subcontractors(is_deleted);

-- 9. MATERIALS (no dependencies)
CREATE TABLE materials (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_name text NOT NULL,
  category text NOT NULL,
  unit material_unit NOT NULL,
  standard_rate numeric,
  min_stock_threshold numeric NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_is_deleted ON materials(is_deleted);

-- 10. USER_ROLES (no dependencies, but FK to auth.users)
CREATE TABLE user_roles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by text,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- 11. RA_BILLS (depends on projects)
CREATE TABLE ra_bills (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  bill_number text NOT NULL,
  bill_date date NOT NULL,
  submitted_to text,
  work_done_upto text,
  gross_amount numeric NOT NULL DEFAULT 0,
  net_payable numeric,
  certified_amount numeric,
  status ra_bill_status NOT NULL DEFAULT 'draft',
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_ra_bills_project_id ON ra_bills(project_id);
CREATE INDEX idx_ra_bills_status ON ra_bills(status);
CREATE INDEX idx_ra_bills_is_deleted ON ra_bills(is_deleted);

-- 12. RA_BILL_DEDUCTIONS (depends on ra_bills)
CREATE TABLE ra_bill_deductions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ra_bill_id uuid NOT NULL REFERENCES ra_bills(id) ON DELETE CASCADE,
  deduction_type text NOT NULL,
  label text NOT NULL,
  percentage numeric,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ra_bill_deductions_ra_bill_id ON ra_bill_deductions(ra_bill_id);

-- 13. RA_BILL_PAYMENTS (depends on ra_bills and projects)
CREATE TABLE ra_bill_payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ra_bill_id uuid NOT NULL REFERENCES ra_bills(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id),
  amount_received numeric NOT NULL,
  payment_date date NOT NULL,
  payment_mode text,
  reference_no text,
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_ra_bill_payments_ra_bill_id ON ra_bill_payments(ra_bill_id);
CREATE INDEX idx_ra_bill_payments_project_id ON ra_bill_payments(project_id);

-- 14. EXPENSES (depends on projects and vendors)
CREATE TABLE expenses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  expense_date date NOT NULL,
  category expense_category NOT NULL,
  amount numeric NOT NULL,
  paid_to text,
  payment_mode payment_mode,
  gst_amount numeric,
  gst_invoice_no text,
  tds_deducted numeric,
  vendor_id uuid REFERENCES vendors(id),
  receipt_url text,
  notes text,
  approved_by text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_is_deleted ON expenses(is_deleted);

-- 15. ATTENDANCE (depends on employees and projects)
CREATE TABLE attendance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  work_date date NOT NULL,
  status attendance_status NOT NULL,
  ot_hours numeric,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  UNIQUE(project_id, work_date, employee_id)
);

CREATE INDEX idx_attendance_project_id ON attendance(project_id);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_work_date ON attendance(work_date);

-- 16. ADVANCE_RECORDS (depends on employees and projects)
CREATE TABLE advance_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES employees(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  advance_date date NOT NULL,
  amount_given numeric NOT NULL,
  amount_recovered numeric,
  reason text,
  approved_by text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_advance_records_employee_id ON advance_records(employee_id);
CREATE INDEX idx_advance_records_project_id ON advance_records(project_id);
CREATE INDEX idx_advance_records_is_deleted ON advance_records(is_deleted);

-- 17. EQUIPMENT (depends on projects)
CREATE TABLE equipment (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  equipment_name text NOT NULL,
  equipment_type text NOT NULL,
  make text,
  model text,
  year integer,
  serial_number text,
  registration_no text,
  ownership ownership_type NOT NULL DEFAULT 'company_owned',
  hire_firm_name text,
  hire_firm_contact text,
  hire_rate numeric,
  hire_rate_unit text,
  hire_start_date date,
  purchase_cost numeric,
  purchase_date date,
  current_project_id uuid REFERENCES projects(id),
  status equipment_status NOT NULL DEFAULT 'active',
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_current_project_id ON equipment(current_project_id);
CREATE INDEX idx_equipment_is_deleted ON equipment(is_deleted);

-- 18. VEHICLES (depends on projects)
CREATE TABLE vehicles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_name text NOT NULL,
  vehicle_type text NOT NULL,
  registration_no text,
  make text,
  model text,
  ownership ownership_type NOT NULL DEFAULT 'company_owned',
  hire_firm_name text,
  hire_rate numeric,
  hire_rate_unit text,
  fitness_expiry date,
  insurance_expiry date,
  permit_expiry date,
  current_project_id uuid REFERENCES projects(id),
  status equipment_status NOT NULL DEFAULT 'active',
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_current_project_id ON vehicles(current_project_id);
CREATE INDEX idx_vehicles_is_deleted ON vehicles(is_deleted);

-- 19. DIARY_ENTRIES (depends on projects)
CREATE TABLE diary_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  entry_date date NOT NULL,
  weather_am weather_condition,
  weather_pm weather_condition,
  work_done text,
  workers_count integer,
  equipment_on_site text,
  visitors text,
  materials_received text,
  issues text,
  written_by text,
  verified_by text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_diary_entries_project_id ON diary_entries(project_id);
CREATE INDEX idx_diary_entries_entry_date ON diary_entries(entry_date);
CREATE INDEX idx_diary_entries_is_deleted ON diary_entries(is_deleted);

-- 20. DOCUMENTS (depends on projects)
CREATE TABLE documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  file_name text NOT NULL,
  storage_url text NOT NULL,
  category document_category NOT NULL,
  expiry_date date,
  notes text,
  file_size_kb numeric,
  mime_type text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_is_deleted ON documents(is_deleted);

-- 21. DOCUMENT_VERSIONS (depends on documents)
CREATE TABLE document_versions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_no numeric NOT NULL,
  storage_url text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);

-- 22. MATERIAL_INWARD (depends on materials, projects, vendors)
CREATE TABLE material_inward (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES materials(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  inward_date date NOT NULL,
  quantity numeric NOT NULL,
  rate_per_unit numeric NOT NULL,
  total_amount numeric,
  vendor_id uuid REFERENCES vendors(id),
  invoice_no text,
  vehicle_no text,
  received_by text,
  quality_note text,
  challan_url text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_material_inward_material_id ON material_inward(material_id);
CREATE INDEX idx_material_inward_project_id ON material_inward(project_id);
CREATE INDEX idx_material_inward_inward_date ON material_inward(inward_date);
CREATE INDEX idx_material_inward_is_deleted ON material_inward(is_deleted);

-- 23. MATERIAL_OUTWARD (depends on materials and projects)
CREATE TABLE material_outward (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES materials(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  outward_date date NOT NULL,
  quantity numeric NOT NULL,
  issued_to text,
  purpose text,
  issued_by text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_material_outward_material_id ON material_outward(material_id);
CREATE INDEX idx_material_outward_project_id ON material_outward(project_id);
CREATE INDEX idx_material_outward_is_deleted ON material_outward(is_deleted);

-- 24. WORK_ORDERS (depends on projects and subcontractors)
CREATE TABLE work_orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  subcontractor_id uuid NOT NULL REFERENCES subcontractors(id),
  work_description text NOT NULL,
  location_chainage text,
  unit text,
  quantity numeric,
  rate numeric,
  total_value numeric,
  start_date date,
  end_date date,
  status work_order_status NOT NULL DEFAULT 'issued',
  tds_pct numeric NOT NULL DEFAULT 1,
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_work_orders_project_id ON work_orders(project_id);
CREATE INDEX idx_work_orders_subcontractor_id ON work_orders(subcontractor_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_is_deleted ON work_orders(is_deleted);

-- 25. SUBCONTRACTOR_BILLS (depends on work_orders and projects)
CREATE TABLE subcontractor_bills (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  work_order_id uuid NOT NULL REFERENCES work_orders(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  bill_date date NOT NULL,
  quantity_done numeric,
  amount_claimed numeric NOT NULL,
  amount_certified numeric,
  tds_deducted numeric NOT NULL DEFAULT 0,
  net_payable numeric,
  amount_paid numeric NOT NULL DEFAULT 0,
  balance_due numeric,
  payment_date date,
  payment_mode text,
  reference_no text,
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_subcontractor_bills_work_order_id ON subcontractor_bills(work_order_id);
CREATE INDEX idx_subcontractor_bills_project_id ON subcontractor_bills(project_id);
CREATE INDEX idx_subcontractor_bills_is_deleted ON subcontractor_bills(is_deleted);

-- 26. BLASTING_SHOTS (depends on projects)
CREATE TABLE blasting_shots (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  shot_number text NOT NULL,
  blast_date date NOT NULL,
  blast_time text,
  location_chainage text,
  rock_type text,
  bench_height_m numeric,
  holes_drilled integer,
  hole_depth_m numeric,
  hole_diameter_mm numeric,
  burden_m numeric,
  spacing_m numeric,
  explosive_type text,
  total_explosive_kg numeric,
  detonators_count integer,
  detonator_type text,
  initiation_system text,
  misfires_count integer NOT NULL DEFAULT 0,
  misfire_action text,
  result text,
  volume_blasted_cum numeric,
  safety_officer text,
  clearance_confirmed boolean NOT NULL DEFAULT false,
  authority_intimation_ref text,
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_blasting_shots_project_id ON blasting_shots(project_id);
CREATE INDEX idx_blasting_shots_blast_date ON blasting_shots(blast_date);
CREATE INDEX idx_blasting_shots_is_deleted ON blasting_shots(is_deleted);

-- 27. INCOME_ENTRIES (depends on projects and ra_bills)
CREATE TABLE income_entries (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  ra_bill_id uuid REFERENCES ra_bills(id),
  date_received date NOT NULL,
  amount numeric NOT NULL,
  payment_mode text,
  reference_no text,
  remarks text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_income_entries_project_id ON income_entries(project_id);
CREATE INDEX idx_income_entries_ra_bill_id ON income_entries(ra_bill_id);
CREATE INDEX idx_income_entries_is_deleted ON income_entries(is_deleted);

-- 28. EXPLOSIVES_REGISTER (depends on projects)
CREATE TABLE explosives_register (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  license_id text,
  project_id uuid REFERENCES projects(id),
  entry_date date NOT NULL,
  entry_type text NOT NULL,
  explosive_type text NOT NULL,
  quantity numeric NOT NULL,
  source_dealer text,
  transport_permit text,
  invoice_no text,
  blast_shot_ref text,
  issued_to text,
  received_by text,
  is_correction boolean,
  correction_of text,
  correction_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_explosives_register_project_id ON explosives_register(project_id);
CREATE INDEX idx_explosives_register_entry_date ON explosives_register(entry_date);

-- 29. ESTIMATIONS (depends on tenders and projects)
CREATE TABLE estimations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_name text NOT NULL,
  tender_id uuid REFERENCES tenders(id),
  project_id uuid REFERENCES projects(id),
  estimate_date date,
  overhead_pct numeric,
  profit_margin_pct numeric,
  total_direct_cost numeric,
  grand_total numeric,
  notes text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

CREATE INDEX idx_estimations_project_id ON estimations(project_id);
CREATE INDEX idx_estimations_tender_id ON estimations(tender_id);
CREATE INDEX idx_estimations_is_deleted ON estimations(is_deleted);

-- 30. ESTIMATION_ITEMS (depends on estimations)
CREATE TABLE estimation_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimation_id uuid NOT NULL REFERENCES estimations(id) ON DELETE CASCADE,
  item_order numeric,
  description text,
  unit text,
  quantity numeric,
  rate numeric,
  amount numeric,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimation_items_estimation_id ON estimation_items(estimation_id);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON org_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subcontractors_updated_at BEFORE UPDATE ON subcontractors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ra_bills_updated_at BEFORE UPDATE ON ra_bills FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_advance_records_updated_at BEFORE UPDATE ON advance_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON diary_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subcontractor_bills_updated_at BEFORE UPDATE ON subcontractor_bills FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blasting_shots_updated_at BEFORE UPDATE ON blasting_shots FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_income_entries_updated_at BEFORE UPDATE ON income_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_estimations_updated_at BEFORE UPDATE ON estimations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ra_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE ra_bill_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ra_bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inward ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_outward ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE blasting_shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE explosives_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimations ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimation_items ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow all authenticated users (adjust for production)
CREATE POLICY "Allow all authenticated users" ON org_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON user_roles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON tenders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON workers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON subcontractors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON ra_bills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON ra_bill_deductions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON ra_bill_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON advance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON equipment FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON vehicles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON diary_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON document_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON materials FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON material_inward FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON material_outward FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON work_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON subcontractor_bills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON blasting_shots FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON income_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON explosives_register FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON estimations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users" ON estimation_items FOR ALL TO authenticated USING (true);

-- ============================================================
-- SEED DATA: Create initial org settings
-- ============================================================

INSERT INTO org_settings (company_name, financial_year_start, default_retention_pct, default_tds_pct, default_labour_cess_pct)
VALUES ('Pesiyie Constructions', 4, 5, 1, 1);