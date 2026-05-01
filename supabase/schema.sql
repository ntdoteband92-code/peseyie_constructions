-- Types and Enums
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'manager',
  'accountant',
  'supervisor',
  'viewer'
);

CREATE TYPE public.tender_status AS ENUM (
  'identified',
  'documents_purchased',
  'bid_submitted',
  'l1_lowest_bidder',
  'awarded',
  'lost',
  'withdrawn'
);

CREATE TYPE public.emd_status AS ENUM (
  'paid',
  'refunded',
  'forfeited'
);

CREATE TYPE public.project_status AS ENUM (
  'ongoing',
  'completed',
  'on_hold',
  'defect_liability',
  'terminated'
);

CREATE TYPE public.project_type AS ENUM (
  'road_construction',
  'blasting',
  'earthwork',
  'structural',
  'drainage',
  'bridge',
  'building',
  'other'
);

CREATE TYPE public.ra_bill_status AS ENUM (
  'draft',
  'submitted',
  'under_measurement',
  'certified',
  'payment_released',
  'partially_paid'
);

CREATE TYPE public.employment_type AS ENUM (
  'direct',
  'contractual'
);

CREATE TYPE public.wage_type AS ENUM (
  'daily_rate',
  'monthly_salary'
);

CREATE TYPE public.ownership_type AS ENUM (
  'company_owned',
  'hired'
);

CREATE TYPE public.equipment_status AS ENUM (
  'active',
  'under_maintenance',
  'idle',
  'hired_out',
  'decommissioned'
);

CREATE TYPE public.work_order_status AS ENUM (
  'issued',
  'in_progress',
  'completed',
  'partially_completed',
  'disputed',
  'terminated'
);

CREATE TYPE public.attendance_status AS ENUM (
  'present',
  'absent',
  'half_day',
  'overtime',
  'leave'
);

CREATE TYPE public.maintenance_type AS ENUM (
  'scheduled_service',
  'breakdown_repair',
  'tyre_change',
  'battery',
  'other'
);

CREATE TYPE public.fuel_type AS ENUM (
  'hsd',
  'petrol',
  'lubricant'
);

CREATE TYPE public.document_category AS ENUM (
  'contract',
  'drawing',
  'boq',
  'tender_document',
  'blasting_license',
  'explosive_license',
  'equipment_rc',
  'insurance',
  'fitness_certificate',
  'labour_license',
  'govt_correspondence',
  'ra_bill_copy',
  'photo_report',
  'other'
);

-- ==========================================
-- 1. AUTHENTICATION & ACCESS CONTROL
-- ==========================================

-- Profiles
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        app_role NOT NULL DEFAULT 'viewer',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Org Settings
CREATE TABLE public.org_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL DEFAULT 'Peseyie Constructions',
  address       TEXT,
  gstin         TEXT,
  pan           TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  financial_year_start INT DEFAULT 4,
  default_retention_pct NUMERIC(5,2) DEFAULT 5.00,
  default_tds_pct       NUMERIC(5,2) DEFAULT 2.00,
  default_labour_cess_pct NUMERIC(5,2) DEFAULT 1.00,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  updated_by    UUID REFERENCES auth.users(id)
);

-- Helper Functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'viewer');

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 2. TENDERS & PROJECTS
-- ==========================================

-- Tenders
CREATE TABLE public.tenders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_name           TEXT NOT NULL,
  nit_number            TEXT,
  issuing_department    TEXT,
  tender_value          NUMERIC(14,2),
  duration_months       INT,
  estimated_duration    TEXT,
  submission_deadline   TIMESTAMPTZ,
  emd_amount            NUMERIC(14,2),
  emd_status            emd_status DEFAULT 'paid',
  tender_fee            NUMERIC(14,2),
  bid_submission_date   TIMESTAMPTZ,
  bid_opening_date      TIMESTAMPTZ,
  status                tender_status DEFAULT 'identified',
  our_quoted_amount     NUMERIC(14,2),
  rival_l1_amount       NUMERIC(14,2),
  remarks               TEXT,
  converted_project_id  UUID,
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  created_by            UUID REFERENCES auth.users(id)
);

CREATE TABLE public.tender_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id   UUID REFERENCES public.tenders(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  document_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id),
  is_deleted  BOOLEAN DEFAULT false
);

-- Projects
CREATE TABLE public.projects (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name            TEXT NOT NULL,
  contract_number         TEXT,
  tender_id               UUID REFERENCES public.tenders(id),
  client_name             TEXT,
  client_contact_person   TEXT,
  client_phone            TEXT,
  contract_value          NUMERIC(14,2) DEFAULT 0,
  contract_date           DATE,
  start_date              DATE,
  expected_end_date       DATE,
  actual_end_date         DATE,
  location_district       TEXT,
  location_state          TEXT,
  project_type            project_type[],
  status                  project_status DEFAULT 'ongoing',
  security_deposit        NUMERIC(14,2),
  security_deposit_status TEXT,
  scope_of_work           TEXT,
  project_manager_id      UUID REFERENCES auth.users(id),
  is_deleted              BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  created_by              UUID REFERENCES auth.users(id)
);

ALTER TABLE public.tenders ADD CONSTRAINT fk_converted_project FOREIGN KEY (converted_project_id) REFERENCES public.projects(id);

CREATE TABLE public.project_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  note_text   TEXT NOT NULL,
  is_deleted  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 3. FINANCIALS (BILLS, EXPENSES, ETC)
-- ==========================================

-- RA Bills
CREATE TABLE public.ra_bills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.projects(id),
  bill_number       TEXT NOT NULL,
  bill_date         DATE NOT NULL,
  submitted_to      TEXT,
  work_done_upto    DATE,
  gross_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  net_payable       NUMERIC(14,2) NOT NULL DEFAULT 0,
  status            ra_bill_status DEFAULT 'draft',
  certified_amount  NUMERIC(14,2),
  remarks           TEXT,
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id)
);

CREATE TABLE public.ra_bill_deductions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_bill_id      UUID NOT NULL REFERENCES public.ra_bills(id) ON DELETE CASCADE,
  deduction_type  TEXT NOT NULL,
  percentage      NUMERIC(5,2),
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ra_bill_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ra_bill_id      UUID NOT NULL REFERENCES public.ra_bills(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES public.projects(id),
  amount_received NUMERIC(14,2) NOT NULL,
  payment_date    DATE NOT NULL,
  reference_no    TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

-- Expenses & Income
CREATE TABLE public.expenses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES public.projects(id),
  expense_date        DATE NOT NULL,
  category            TEXT NOT NULL,
  amount              NUMERIC(14,2) NOT NULL,
  paid_to             TEXT,
  payment_mode        TEXT,
  gst_amount          NUMERIC(14,2),
  gst_invoice_number  TEXT,
  tds_deducted        NUMERIC(14,2),
  notes               TEXT,
  approved_by         UUID REFERENCES auth.users(id),
  receipt_url         TEXT,
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id)
);

CREATE TABLE public.income_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id),
  ra_bill_id      UUID REFERENCES public.ra_bills(id),
  date_received   DATE NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  payment_mode    TEXT,
  reference_no    TEXT,
  remarks         TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

-- Petty Cash
CREATE TABLE public.petty_cash_books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES public.projects(id),
  custodian_id UUID REFERENCES auth.users(id),
  status      TEXT DEFAULT 'Open',
  is_deleted  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.petty_cash_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  petty_cash_book_id  UUID NOT NULL REFERENCES public.petty_cash_books(id),
  entry_date          DATE NOT NULL,
  entry_type          TEXT NOT NULL CHECK (entry_type IN ('In', 'Out')),
  amount              NUMERIC(14,2) NOT NULL,
  category            TEXT,
  description         TEXT,
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id)
);

-- Vendors
CREATE TABLE public.vendors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_person  TEXT,
  address         TEXT,
  gstin           TEXT,
  supplied_items  TEXT,
  credit_terms    INT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.vendor_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID NOT NULL REFERENCES public.vendors(id),
  payment_date    DATE NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  payment_mode    TEXT,
  reference_no    TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 4. EQUIPMENT & FLEET
-- ==========================================

CREATE TABLE public.equipment (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name       TEXT NOT NULL,
  equipment_type       TEXT NOT NULL,
  make                TEXT,
  model               TEXT,
  year                INT,
  serial_number       TEXT,
  ownership            ownership_type NOT NULL,
  hire_firm           TEXT,
  hire_contact        TEXT,
  hire_rate           NUMERIC(14,2),
  hire_rate_unit      TEXT,
  hire_start_date     DATE,
  purchase_cost       NUMERIC(14,2),
  purchase_date       DATE,
  status              equipment_status DEFAULT 'active',
  assigned_project_id UUID REFERENCES public.projects(id),
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id)
);

CREATE TABLE public.vehicles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name         TEXT NOT NULL,
  vehicle_type        TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  make                TEXT,
  model               TEXT,
  ownership            ownership_type NOT NULL,
  hire_firm           TEXT,
  hire_rate           NUMERIC(14,2),
  hire_rate_unit      TEXT,
  fitness_expiry      DATE,
  insurance_expiry    DATE,
  permit_expiry       DATE,
  status              equipment_status DEFAULT 'active',
  assigned_project_id UUID REFERENCES public.projects(id),
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id)
);

CREATE TABLE public.equipment_usage_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID REFERENCES public.equipment(id),
  vehicle_id      UUID REFERENCES public.vehicles(id),
  project_id      UUID REFERENCES public.projects(id),
  log_date        DATE NOT NULL,
  shift           TEXT,
  hours_operated  NUMERIC(10,2),
  trips_made      INT,
  operator_name   TEXT,
  meter_start     NUMERIC(14,2),
  meter_end       NUMERIC(14,2),
  breakdown_noted BOOLEAN DEFAULT false,
  remarks         TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id),
  CHECK (equipment_id IS NOT NULL OR vehicle_id IS NOT NULL)
);

CREATE TABLE public.fuel_stock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id),
  inward_date     DATE NOT NULL,
  quantity_litres NUMERIC(10,2) NOT NULL,
  rate_per_litre  NUMERIC(10,2),
  supplier_id     UUID REFERENCES public.vendors(id),
  invoice_no      TEXT,
  total_amount    NUMERIC(14,2),
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.fuel_issues (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id),
  equipment_id    UUID REFERENCES public.equipment(id),
  vehicle_id      UUID REFERENCES public.vehicles(id),
  issue_date      DATE NOT NULL,
  quantity_litres NUMERIC(10,2) NOT NULL,
  issued_by       UUID REFERENCES auth.users(id),
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id),
  CHECK (equipment_id IS NOT NULL OR vehicle_id IS NOT NULL)
);

CREATE TABLE public.maintenance_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID REFERENCES public.equipment(id),
  vehicle_id      UUID REFERENCES public.vehicles(id),
  maintenance_date DATE NOT NULL,
  type            TEXT NOT NULL,
  description     TEXT,
  workshop_name   TEXT,
  parts_replaced  TEXT,
  labour_cost     NUMERIC(14,2) DEFAULT 0,
  parts_cost      NUMERIC(14,2) DEFAULT 0,
  total_cost      NUMERIC(14,2) DEFAULT 0,
  next_service_due DATE,
  downtime_days   INT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id),
  CHECK (equipment_id IS NOT NULL OR vehicle_id IS NOT NULL)
);

-- ==========================================
-- 5. HR & PAYROLL
-- ==========================================

CREATE TABLE public.employees (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  role                TEXT NOT NULL,
  contact_number      TEXT,
  emergency_contact   TEXT,
  address             TEXT,
  id_proof_type       TEXT,
  id_proof_number     TEXT,
  joining_date        DATE,
  employment_type     employment_type NOT NULL,
  wage_type           wage_type NOT NULL,
  wage_rate           NUMERIC(10,2) NOT NULL,
  pf_applicable       BOOLEAN DEFAULT false,
  esi_applicable      BOOLEAN DEFAULT false,
  bank_account        TEXT,
  ifsc                TEXT,
  status              TEXT DEFAULT 'Active',
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id)
);

CREATE TABLE public.attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES public.employees(id),
  project_id      UUID REFERENCES public.projects(id),
  attendance_date DATE NOT NULL,
  status          TEXT NOT NULL,
  ot_hours        NUMERIC(5,2) DEFAULT 0,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id),
  UNIQUE(employee_id, attendance_date)
);

CREATE TABLE public.salary_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES public.employees(id),
  project_id      UUID REFERENCES public.projects(id),
  month_year      TEXT NOT NULL, -- e.g. '2024-10'
  gross_amount    NUMERIC(14,2) NOT NULL,
  deductions      NUMERIC(14,2) DEFAULT 0,
  net_payable     NUMERIC(14,2) NOT NULL,
  amount_paid     NUMERIC(14,2) DEFAULT 0,
  payment_date    DATE,
  payment_mode    TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.advance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES public.employees(id),
  project_id      UUID REFERENCES public.projects(id),
  advance_date    DATE NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  reason          TEXT,
  approved_by     UUID REFERENCES auth.users(id),
  is_recovered    BOOLEAN DEFAULT false,
  recovery_date   DATE,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 6. MATERIALS & INVENTORY
-- ==========================================

CREATE TABLE public.materials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  unit            TEXT NOT NULL,
  standard_rate   NUMERIC(10,2),
  min_stock_level NUMERIC(14,2),
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.material_inward (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id     UUID NOT NULL REFERENCES public.materials(id),
  project_id      UUID NOT NULL REFERENCES public.projects(id),
  inward_date     DATE NOT NULL,
  quantity        NUMERIC(14,2) NOT NULL,
  rate_per_unit   NUMERIC(14,2),
  total_amount    NUMERIC(14,2),
  supplier_id     UUID REFERENCES public.vendors(id),
  invoice_no      TEXT,
  vehicle_number  TEXT,
  received_by     TEXT,
  quality_note    TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.material_outward (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id     UUID NOT NULL REFERENCES public.materials(id),
  project_id      UUID NOT NULL REFERENCES public.projects(id),
  outward_date    DATE NOT NULL,
  quantity        NUMERIC(14,2) NOT NULL,
  issued_to       TEXT,
  purpose         TEXT,
  issued_by       UUID REFERENCES auth.users(id),
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

-- Explosives
CREATE TABLE public.explosives_license (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_number  TEXT NOT NULL,
  expiry_date     DATE NOT NULL,
  magazine_location TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.explosives_register (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  explosive_type  TEXT NOT NULL,
  entry_date      DATE NOT NULL,
  entry_type      TEXT NOT NULL CHECK (entry_type IN ('Inward', 'Issue', 'Return', 'Correction')),
  quantity        NUMERIC(14,2) NOT NULL,
  source_dealer   TEXT,
  invoice_no      TEXT,
  permit_no       TEXT,
  shot_number     TEXT, -- Reference to blast shot
  issued_to       TEXT, -- Foreman
  issued_by       UUID REFERENCES auth.users(id),
  correction_of   UUID, -- Reference to another register entry
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
  -- NO is_deleted column. No updates/deletes allowed via RLS.
);

CREATE TABLE public.blasting_shots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.projects(id),
  shot_number         TEXT NOT NULL,
  blast_date          DATE NOT NULL,
  blast_time          TIME,
  location_chainage   TEXT,
  rock_type           TEXT,
  bench_height        NUMERIC(10,2),
  holes_drilled       INT,
  hole_depth          NUMERIC(10,2),
  hole_diameter       NUMERIC(10,2),
  pattern_burden      NUMERIC(10,2),
  pattern_spacing     NUMERIC(10,2),
  explosive_type      TEXT,
  total_explosive_kg  NUMERIC(10,2),
  detonators_used     INT,
  detonator_type      TEXT,
  initiation_system   TEXT,
  misfires            INT DEFAULT 0,
  misfire_action      TEXT,
  result              TEXT,
  volume_blasted_cum  NUMERIC(14,2),
  safety_officer      TEXT,
  clearance_confirmed BOOLEAN DEFAULT false,
  police_intimation   TEXT,
  remarks             TEXT,
  is_deleted          BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 7. SUBCONTRACTORS
-- ==========================================

CREATE TABLE public.subcontractors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_name       TEXT NOT NULL,
  proprietor_name TEXT,
  contact_number  TEXT,
  address         TEXT,
  gst_number      TEXT,
  pan             TEXT,
  specialty       TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.work_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id),
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id),
  work_description TEXT,
  location        TEXT,
  uom             TEXT,
  quantity        NUMERIC(14,2),
  rate            NUMERIC(14,2),
  total_value     NUMERIC(14,2),
  start_date      DATE,
  end_date        DATE,
  status          work_order_status DEFAULT 'issued',
  tds_rate        NUMERIC(5,2) DEFAULT 0,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.subcontractor_bills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  bill_date       DATE NOT NULL,
  work_done_qty   NUMERIC(14,2),
  amount_claimed  NUMERIC(14,2),
  amount_certified NUMERIC(14,2),
  tds_deducted    NUMERIC(14,2),
  net_payable     NUMERIC(14,2),
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.subcontractor_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_bill_id UUID NOT NULL REFERENCES public.subcontractor_bills(id) ON DELETE CASCADE,
  payment_date          DATE NOT NULL,
  amount_paid           NUMERIC(14,2) NOT NULL,
  payment_mode          TEXT,
  reference_no          TEXT,
  is_deleted            BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  created_by            UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 8. DIARY, DOCUMENTS & ESTIMATION
-- ==========================================

CREATE TABLE public.diary_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id),
  entry_date      DATE NOT NULL,
  weather_am      TEXT,
  weather_pm      TEXT,
  work_done       TEXT,
  workers_present INT,
  equipment_onsite TEXT,
  visitors        TEXT,
  materials_recd  TEXT,
  issues          TEXT,
  verified_by     UUID REFERENCES auth.users(id),
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.diary_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id  UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,
  label           TEXT, -- Before / During / After / General
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id),
  category        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  expiry_date     DATE,
  notes           TEXT,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.document_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  file_url        TEXT NOT NULL,
  version_number  INT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.estimations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES public.projects(id),
  tender_id       UUID REFERENCES public.tenders(id),
  name            TEXT NOT NULL,
  estimation_date DATE NOT NULL,
  total_direct_cost NUMERIC(14,2) DEFAULT 0,
  overheads_pct   NUMERIC(5,2) DEFAULT 0,
  profit_pct      NUMERIC(5,2) DEFAULT 0,
  grand_total     NUMERIC(14,2) DEFAULT 0,
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id)
);

CREATE TABLE public.estimation_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimation_id   UUID NOT NULL REFERENCES public.estimations(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  unit            TEXT,
  quantity        NUMERIC(14,2) DEFAULT 0,
  rate            NUMERIC(14,2) DEFAULT 0,
  amount          NUMERIC(14,2) DEFAULT 0,
  category        TEXT, -- Labour/Material/Equipment/Subcontract/Overheads
  is_deleted      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 9. RPC FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION get_project_financial_summary(p_project_id UUID)
RETURNS TABLE (
  contract_value    NUMERIC,
  total_billed      NUMERIC,
  total_received    NUMERIC,
  retention_held    NUMERIC,
  total_spent       NUMERIC,
  gross_margin_pct  NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    p.contract_value,
    COALESCE(SUM(rb.gross_amount), 0) AS total_billed,
    COALESCE(SUM(pay.amount_received), 0) AS total_received,
    COALESCE(SUM(
      (SELECT COALESCE(SUM(d.amount),0) FROM ra_bill_deductions d
       WHERE d.ra_bill_id = rb.id AND d.deduction_type = 'retention')
    ), 0) AS retention_held,
    COALESCE((SELECT SUM(e.amount) FROM expenses e
              WHERE e.project_id = p_project_id AND e.is_deleted = false), 0) AS total_spent,
    CASE WHEN p.contract_value > 0
      THEN ROUND(
        ((COALESCE(SUM(pay.amount_received),0) -
          COALESCE((SELECT SUM(e.amount) FROM expenses e
                    WHERE e.project_id = p_project_id AND e.is_deleted = false),0))
         / p.contract_value) * 100, 2)
      ELSE 0
    END AS gross_margin_pct
  FROM projects p
  LEFT JOIN ra_bills rb ON rb.project_id = p.id AND rb.is_deleted = false
  LEFT JOIN ra_bill_payments pay ON pay.ra_bill_id = rb.id AND pay.is_deleted = false
  WHERE p.id = p_project_id
  GROUP BY p.contract_value;
$$;

CREATE OR REPLACE FUNCTION get_monthly_cashflow(months_back INT DEFAULT 6)
RETURNS TABLE (month TEXT, income NUMERIC, expenses NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(d, 'Mon YYYY') AS month,
    COALESCE((SELECT SUM(amount) FROM income_entries
              WHERE DATE_TRUNC('month', date_received) = d
              AND is_deleted = false), 0) AS income,
    COALESCE((SELECT SUM(amount) FROM expenses
              WHERE DATE_TRUNC('month', expense_date) = d
              AND is_deleted = false), 0) AS expenses
  FROM generate_series(
    DATE_TRUNC('month', NOW()) - ((months_back-1) || ' months')::interval,
    DATE_TRUNC('month', NOW()),
    '1 month'::interval
  ) AS d;
$$;

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END
$$;

-- Pattern 1: Admin and Manager Full Write, Others Read Only
-- Example: projects, tenders, vendors, equipment, vehicles, employees, materials, subcontractors

-- Projects
CREATE POLICY "Anyone authenticated can view projects" ON public.projects FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Admin and manager can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "Admin and manager can update projects" ON public.projects FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY "Only admin can delete projects" ON public.projects FOR UPDATE TO authenticated USING (get_my_role() = 'admin' AND is_deleted = false); -- Soft delete

-- Tenders
CREATE POLICY "Anyone can view tenders" ON public.tenders FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Admin/manager can insert tenders" ON public.tenders FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'manager', 'accountant'));
CREATE POLICY "Admin/manager can update tenders" ON public.tenders FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'manager', 'accountant'));

-- Pattern 2: Supervisor+ Write Access
-- Example: attendance, equipment_usage_log, fuel_issues, material_inward, material_outward, blasting_shots, diary_entries

CREATE POLICY "Anyone can view attendance" ON public.attendance FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Supervisor+ can mark attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'manager', 'accountant', 'supervisor'));
CREATE POLICY "Supervisor+ can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'manager', 'accountant', 'supervisor'));

-- Pattern 3: Finance Only Write Access
-- Example: ra_bills, expenses, income_entries, salary_payments, vendor_payments, subcontractor_payments

CREATE POLICY "Anyone can view bills" ON public.ra_bills FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Finance can insert bills" ON public.ra_bills FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'manager', 'accountant'));
CREATE POLICY "Finance can update bills" ON public.ra_bills FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'manager', 'accountant'));

CREATE POLICY "Anyone can view expenses" ON public.expenses FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "Finance can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'manager', 'accountant'));
CREATE POLICY "Finance can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'manager', 'accountant'));

-- Org Settings
CREATE POLICY "Anyone can view org settings" ON public.org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Manager can update org settings" ON public.org_settings FOR UPDATE TO authenticated USING (get_my_role() IN ('admin', 'manager'));

-- Profiles & User Roles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated USING (get_my_role() = 'admin');

CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (get_my_role() = 'admin');

-- Explosives Register (No Updates/Deletes)
CREATE POLICY "Anyone can view explosives log" ON public.explosives_register FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supervisor+ can insert explosives log" ON public.explosives_register FOR INSERT TO authenticated WITH CHECK (get_my_role() IN ('admin', 'manager', 'supervisor'));
-- No UPDATE or DELETE policies intentionally.
