-- =====================================================
-- PESPEYIE CONSTRUCTIONS — SEED DATA
-- Run this in your Supabase SQL editor
-- =====================================================
-- NOTE: Replace 'YOUR_USER_ID' with your auth.users UUID,
-- or the script will use NULL for created_by fields.

DO $$
DECLARE
  admin_user_id UUID := null; -- Set to your user UUID if needed
  tend1 UUID := gen_random_uuid();
  tend2 UUID := gen_random_uuid();
  tend3 UUID := gen_random_uuid();
  proj1 UUID := gen_random_uuid();
  proj2 UUID := gen_random_uuid();
  proj3 UUID := gen_random_uuid();
  emp1 UUID := gen_random_uuid();
  emp2 UUID := gen_random_uuid();
  emp3 UUID := gen_random_uuid();
  emp4 UUID := gen_random_uuid();
  emp5 UUID := gen_random_uuid();
  emp6 UUID := gen_random_uuid();
  emp7 UUID := gen_random_uuid();
  emp8 UUID := gen_random_uuid();
  emp9 UUID := gen_random_uuid();
  emp10 UUID := gen_random_uuid();
  mat1 UUID := gen_random_uuid();
  mat2 UUID := gen_random_uuid();
  mat3 UUID := gen_random_uuid();
  mat4 UUID := gen_random_uuid();
  mat5 UUID := gen_random_uuid();
  mat6 UUID := gen_random_uuid();
  sub1 UUID := gen_random_uuid();
  sub2 UUID := gen_random_uuid();
  wo1 UUID := gen_random_uuid();
  wo2 UUID := gen_random_uuid();
  bill1 UUID := gen_random_uuid();
  bill2 UUID := gen_random_uuid();
  bill3 UUID := gen_random_uuid();
BEGIN

-- ==========================================
-- 1. TENDERS
-- ==========================================
INSERT INTO public.tenders (id, tender_name, nit_number, department, issuing_department, tender_value, duration_months, submission_deadline, emd_amount, emd_status, status, our_quoted_amount, remarks, created_by) VALUES
(tend1, 'Construction of CC Road from Traffic Point to New Market', 'PWD/NE/2024/001', 'PWD Department, Kohima', 'PWD Department, Kohima', 24500000, 12, '2024-03-15', 490000, 'paid', 'bid_submitted', 22150000, 'Road upgradation project in Kohima town area', admin_user_id),
(tend2, 'Maintenance of NH-29 Kohima-Dimapur Highway Section', 'MoRTH/NE/2024/003', 'Ministry of Road Transport & Highways', 'Ministry of Road Transport & Highways', 187000000, 24, '2024-04-20', 3740000, 'paid', 'bid_submitted', 168000000, 'Highway maintenance and strengthening works', admin_user_id),
(tend3, 'Construction of Retaining Wall at Dzoukou Valley Approach', 'PWD/NE/2024/008', 'PWD Department, Dimapur', 'PWD Department, Dimapur', 8900000, 6, '2024-05-10', 178000, 'paid', 'bid_submitted', 8150000, 'Retaining wall and drainage works', admin_user_id);

-- ==========================================
-- 2. PROJECTS
-- ==========================================
INSERT INTO public.projects (id, project_name, contract_number, tender_id, client_name, client_contact_person, client_phone, contract_value, contract_date, start_date, expected_end_date, actual_end_date, location_district, location_state, project_type, status, security_deposit, security_deposit_status, scope_of_work, project_manager_id, created_by) VALUES
(proj1, 'CC Road Construction — Kohima Town', 'PCL/KOH/2023/001', tend1, 'PWD Kohima', 'Er. Kevilizo Kuotsu', '9366874123', 22150000, '2023-06-01', '2023-07-01', '2024-06-30', null, 'Kohima', 'Nagaland', ARRAY['road_construction', 'drainage']::project_type[], 'ongoing', 443000, 'pending', 'Construction of 2.5km CC road with proper drainage and road furniture', admin_user_id, admin_user_id),
(proj2, 'NH-29 Highway Maintenance Package-A', 'MORTH/NE/2023/002', tend2, 'MoRTH Regional Office, Guwahati', 'Mr. Rokohe Shohe', '8794561230', 168000000, '2023-09-01', '2023-10-01', '2025-09-30', null, 'Dimapur', 'Nagaland', ARRAY['road_construction', 'drainage']::project_type[], 'ongoing', 3360000, 'pending', 'Routine maintenance, patching and lane marking on NH-29 Km 120-145', admin_user_id, admin_user_id),
(proj3, 'Dzoukou Retaining Wall & Drainage Works', 'PCL/DIM/2024/002', tend3, 'PWD Dimapur', 'Er. Vineeth Mathew', '7012345678', 8150000, '2024-06-01', '2024-07-15', '2024-12-31', null, 'Dimapur', 'Nagaland', ARRAY['drainage']::project_type[], 'ongoing', 163000, 'pending', 'Construction of 1.2km retaining wall and lined drainage system', admin_user_id, admin_user_id);

-- Update tenders with converted project IDs
UPDATE public.tenders SET converted_project_id = proj1 WHERE id = tend1;
UPDATE public.tenders SET converted_project_id = proj2 WHERE id = tend2;
UPDATE public.tenders SET converted_project_id = proj3 WHERE id = tend3;

-- ==========================================
-- 3. RA BILLS
-- ==========================================
INSERT INTO public.ra_bills (id, project_id, bill_number, bill_date, submitted_to, work_done_upto, gross_amount, net_payable, status, certified_amount, remarks, created_by) VALUES
(bill1, proj1, 'RA-1', '2023-12-31', 'EE, PWD Kohima', '2023-12-20', 4850000, 4462000, 'payment_released', 4625000, 'First RA Bill for CC road work up to CH 0+000 to 1+200', admin_user_id),
(bill2, proj1, 'RA-2', '2024-03-31', 'EE, PWD Kohima', '2024-03-25', 6200000, 5714000, 'payment_released', 5900000, 'Second RA Bill — CH 1+200 to 1+800', admin_user_id),
(bill3, proj1, 'RA-3', '2024-06-30', 'EE, PWD Kohima', '2024-06-25', 5800000, 5344000, 'certified', 5520000, 'Third RA Bill — CH 1+800 to 2+500 with drainage', admin_user_id);

-- RA Bill Deductions
INSERT INTO public.ra_bill_deductions (ra_bill_id, deduction_type, label, percentage, amount) VALUES
(bill1, 'TDS', 'TDS @ 2%', 2.00, 97000),
(bill1, 'Retention', 'Retention @ 5%', 5.00, 242500),
(bill1, 'Royalty', 'Royalty @ 1.5%', 1.50, 72750),
(bill2, 'TDS', 'TDS @ 2%', 2.00, 124000),
(bill2, 'Retention', 'Retention @ 5%', 5.00, 310000),
(bill2, 'Royalty', 'Royalty @ 1.5%', 1.50, 93000),
(bill2, 'Labour Cess', 'Labour Cess @ 1%', 1.00, 62000),
(bill3, 'TDS', 'TDS @ 2%', 2.00, 116000),
(bill3, 'Retention', 'Retention @ 5%', 5.00, 290000),
(bill3, 'Royalty', 'Royalty @ 1.5%', 1.50, 87000);

-- RA Bill Payments
INSERT INTO public.ra_bill_payments (ra_bill_id, project_id, amount_received, payment_date, payment_mode, reference_no, remarks, created_by) VALUES
(bill1, proj1, 4200000, '2024-02-15', 'bank_transfer', 'NEFT/RTGS/2024/001', 'First RA bill — first installment', admin_user_id),
(bill1, proj1, 262000, '2024-03-20', 'bank_transfer', 'NEFT/RTGS/2024/005', 'First RA bill — balance payment', admin_user_id),
(bill2, proj1, 5400000, '2024-05-10', 'bank_transfer', 'NEFT/RTGS/2024/012', 'Second RA bill — 90% advance', admin_user_id),
(bill2, proj1, 314000, '2024-06-15', 'bank_transfer', 'NEFT/RTGS/2024/018', 'Second RA bill — balance', admin_user_id);

-- ==========================================
-- 4. EXPENSES
-- ==========================================
INSERT INTO public.expenses (project_id, expense_date, category, amount, paid_to, payment_mode, gst_amount, notes, created_by) VALUES
(proj1, '2023-07-05', 'material_purchase', 450000, 'Naga Hardware & Steel', 'bank_transfer', 40500, 'Grade 40 steel bars for foundation', admin_user_id),
(proj1, '2023-07-12', 'material_purchase', 180000, 'Dimapur Cement Agency', 'bank_transfer', 16200, 'OPC 53 grade cement — 300 bags', admin_user_id),
(proj1, '2023-07-20', 'equipment_rental', 85000, 'BEGA Earth Movers', 'bank_transfer', null, 'Excavator on hire — 7 days', admin_user_id),
(proj1, '2023-08-03', 'labour_payment', 320000, 'Site Workers', 'cash', null, 'Skilled labour payment for July first fortnight', admin_user_id),
(proj1, '2023-08-15', 'fuel', 62000, 'IOCL Kohima', 'cash', null, 'Diesel for equipment — 400L', admin_user_id),
(proj1, '2023-09-01', 'subcontractor_payment', 450000, 'M/s L. Ezathy Earthworks', 'bank_transfer', null, 'Earthwork contract — first phase', admin_user_id),
(proj1, '2023-09-15', 'material_purchase', 240000, 'RBS Quarry Products', 'bank_transfer', 21600, 'Aggregates and sand for GSB layer', admin_user_id),
(proj1, '2023-10-05', 'equipment_rental', 72000, 'BEGA Earth Movers', 'bank_transfer', null, 'Tipper hire — 15 trips', admin_user_id),
(proj1, '2023-10-20', 'labour_payment', 380000, 'Site Workers', 'cash', null, 'October full month wages', admin_user_id),
(proj1, '2023-11-10', 'fuel', 55000, 'IOCL Kohima', 'cash', null, 'Diesel for equipment', admin_user_id),
(proj1, '2023-11-25', 'material_purchase', 120000, 'Naga Hardware & Steel', 'bank_transfer', 10800, 'Mild steel bars for rebar work', admin_user_id),
(proj1, '2023-12-15', 'subcontractor_payment', 320000, 'M/s R. Lotha Concrete Works', 'bank_transfer', null, 'Concrete work — second phase', admin_user_id),
(proj2, '2023-10-15', 'equipment_rental', 250000, 'Northeast Construction Equip', 'bank_transfer', null, 'Pothole filling machine on hire', admin_user_id),
(proj2, '2023-11-01', 'material_purchase', 180000, 'PHD Cement Corp', 'bank_transfer', 16200, 'Cold mix material for patching', admin_user_id),
(proj2, '2023-11-20', 'labour_payment', 420000, 'Site Workers', 'cash', null, 'Skilled workers — November', admin_user_id),
(proj2, '2023-12-05', 'fuel', 85000, 'BPCL Dimapur', 'cash', null, 'Diesel for tanker and equipment', admin_user_id);

-- Income entries
INSERT INTO public.income_entries (project_id, ra_bill_id, date_received, amount, payment_mode, reference_no, remarks, created_by) VALUES
(proj1, bill1, '2024-02-15', 4200000, 'bank_transfer', 'NEFT/RTGS/2024/001', 'First RA bill — first installment', admin_user_id),
(proj1, bill1, '2024-03-20', 262000, 'bank_transfer', 'NEFT/RTGS/2024/005', 'First RA bill — balance payment', admin_user_id),
(proj1, bill2, '2024-05-10', 5400000, 'bank_transfer', 'NEFT/RTGS/2024/012', 'Second RA bill — 90% advance', admin_user_id),
(proj1, bill2, '2024-06-15', 314000, 'bank_transfer', 'NEFT/RTGS/2024/018', 'Second RA bill — balance', admin_user_id);

-- ==========================================
-- 5. EQUIPMENT
-- ==========================================
INSERT INTO public.equipment (id, equipment_name, equipment_type, make, model, ownership, hire_firm_name, hire_rate, status, created_by) VALUES
(gen_random_uuid(), 'Excavator — CAT 320D', 'earthmoving', 'Caterpillar', '320D L', 'company_owned', null, null, 'active', admin_user_id),
(gen_random_uuid(), 'Excavator — Volvo EC210D', 'earthmoving', 'Volvo', 'EC210D', 'company_owned', null, null, 'active', admin_user_id),
(gen_random_uuid(), 'Soil Compactor — Ammann APR 2620', 'compaction', 'Ammann', 'APR 2620', 'company_owned', null, null, 'active', admin_user_id);

-- ==========================================
-- 6. VEHICLES
-- ==========================================
INSERT INTO public.vehicles (id, vehicle_name, vehicle_type, registration_no, make, model, ownership, hire_firm_name, hire_rate, fitness_expiry, insurance_expiry, status, created_by) VALUES
(gen_random_uuid(), 'Tata LPK 2518 Tipper', 'truck', 'NL-01-AA-1234', 'Tata', 'LPK 2518', 'company_owned', null, null, '2025-08-15', '2025-08-20', 'active', admin_user_id),
(gen_random_uuid(), 'Mahindra Bolero Pickup', 'light_goods', 'NL-01-BB-5678', 'Mahindra', 'Bolero', 'company_owned', null, null, '2025-02-10', '2025-02-15', 'active', admin_user_id),
(gen_random_uuid(), 'JCB 3DX Backhoe Loader', 'earthmoving', 'NL-01-CC-9012', 'JCB', '3DX', 'hired', 'BEGA Earth Movers', 450000, '2025-11-05', '2025-06-30', 'active', admin_user_id);

-- ==========================================
-- 7. EMPLOYEES
-- ==========================================
INSERT INTO public.employees (id, full_name, role, contact_number, address, joining_date, employment_type, wage_type, wage_rate, is_active, created_by) VALUES
(emp1, 'Kevilizo Kuotsu', 'Site Engineer', '9366874123', 'Kezo Town, Kohima', '2023-06-15', 'direct', 'monthly_salary', 45000, true, admin_user_id),
(emp2, 'Rokohe Shohe', 'Supervisor', '8794561230', 'New Market, Kohima', '2023-06-20', 'direct', 'monthly_salary', 32000, true, admin_user_id),
(emp3, 'Vineeth Mathew', 'Surveyor', '7012345678', 'Dimapur', '2023-07-01', 'direct', 'monthly_salary', 28000, true, admin_user_id),
(emp4, 'Apfu Khongsai', 'Skilled Worker', '9486071234', 'Mokokchung', '2023-07-10', 'direct', 'daily_rate', 750, true, admin_user_id),
(emp5, 'Benito Yeptho', 'Skilled Worker', '9625437890', 'Wokha', '2023-07-10', 'direct', 'daily_rate', 750, true, admin_user_id),
(emp6, 'Lijiang Jamir', 'Machine Operator', '9345128760', 'Chumoukedima', '2023-08-01', 'direct', 'daily_rate', 900, true, admin_user_id),
(emp7, 'Shiang Phot', 'Unskilled Worker', '9486712301', 'Tseminyu', '2023-08-15', 'direct', 'daily_rate', 550, true, admin_user_id),
(emp8, 'Purrankhu Nakhro', 'Unskilled Worker', '8792143650', 'Kohima Village', '2023-08-15', 'direct', 'daily_rate', 550, true, admin_user_id),
(emp9, 'Kelhou Asabela', 'Safety Officer', '7012498765', 'Dimapur', '2023-09-01', 'direct', 'monthly_salary', 35000, true, admin_user_id),
(emp10, 'Wezhozo Nakhro', 'Blasting Foreman', '9366012345', 'Mon', '2023-09-15', 'direct', 'monthly_salary', 38000, true, admin_user_id);

-- ==========================================
-- 8. MATERIALS
-- ==========================================
INSERT INTO public.materials (id, material_name, category, unit, standard_rate, min_stock_threshold, created_by) VALUES
(mat1, 'OPC 53 Grade Cement (Birla/ACC)', 'cement', 'bags', 380, 50, admin_user_id),
(mat2, 'Mild Steel Bars — 10mm', 'steel', 'quintal', 6200, 10, admin_user_id),
(mat3, 'Mild Steel Bars — 16mm', 'steel', 'quintal', 6100, 10, admin_user_id),
(mat4, 'Mild Steel Bars — 20mm', 'steel', 'quintal', 6000, 8, admin_user_id),
(mat5, 'Fine Aggregate (Sand — River)', 'aggregate', 'cum', 1800, 30, admin_user_id),
(mat6, 'Coarse Aggregate — 20mm', 'aggregate', 'cum', 1200, 40, admin_user_id);

-- Material Inward
INSERT INTO public.material_inward (material_id, project_id, inward_date, quantity, rate_per_unit, total_amount, invoice_no, vehicle_no, received_by, created_by) VALUES
(mat1, proj1, '2023-07-12', 300, 380, 114000, 'INV/2023/045', 'NL-01-AA-1234', 'Rokohe Shohe', admin_user_id),
(mat2, proj1, '2023-07-05', 50, 6200, 310000, 'INV/2023/038', 'NL-01-AA-1234', 'Rokohe Shohe', admin_user_id),
(mat3, proj1, '2023-07-05', 60, 6100, 366000, 'INV/2023/038', 'NL-01-AA-1234', 'Rokohe Shohe', admin_user_id),
(mat4, proj1, '2023-07-05', 40, 6000, 240000, 'INV/2023/038', 'NL-01-AA-1234', 'Rokohe Shohe', admin_user_id),
(mat5, proj1, '2023-08-20', 100, 1800, 180000, 'INV/2023/055', 'NL-01-BB-5678', 'Rokohe Shohe', admin_user_id),
(mat6, proj1, '2023-08-20', 150, 1200, 180000, 'INV/2023/056', 'NL-01-BB-5678', 'Rokohe Shohe', admin_user_id);

-- ==========================================
-- 9. SUBCONTRACTORS
-- ==========================================
INSERT INTO public.subcontractors (id, firm_name, proprietor_name, contact_phone, address, gstin, specialty, is_deleted, created_by) VALUES
(sub1, 'M/s L. Ezathy Earthworks', 'L. Ezathy', '9366023451', 'Kezo Town, Kohima', '13AAAFL1234Q1ZX', 'Earthwork excavation and compaction', false, admin_user_id),
(sub2, 'M/s R. Lotha Concrete Works', 'R. Lotha', '9486056789', 'New Market, Kohima', '13AABFL5678Q1ZY', 'RCC and concrete works', false, admin_user_id);

-- Work Orders
INSERT INTO public.work_orders (id, project_id, subcontractor_id, work_description, location_chainage, unit, quantity, rate, total_value, start_date, status, tds_pct, created_by) VALUES
(wo1, proj1, sub1, 'Earthwork excavation and compaction', 'CH 0+000 to 1+500', 'cum', 1500, 1200, 1800000, '2023-08-01', 'completed', 2.00, admin_user_id),
(wo2, proj1, sub2, 'Concrete works for drain and cc road', 'CH 1+200 to 2+000', 'cum', 800, 2750, 2200000, '2023-10-01', 'in_progress', 2.00, admin_user_id);

-- ==========================================
-- 10. DIARY ENTRIES
-- ==========================================
INSERT INTO public.diary_entries (project_id, entry_date, work_done, workers_count, equipment_on_site, visitors, materials_received, created_by) VALUES
(proj1, '2024-06-01', 'Started CC road concreting from CH 2+200. Laid 80 running meters of 150mm thick M25 concrete. Water curing applied.', 18, 'JCB 3DX, Concrete Mixer', 'SI visit for quality inspection', 'Sand 10cu.m, Aggregates 15cu.m', admin_user_id),
(proj1, '2024-06-02', 'Continued concreting at CH 2+280 to 2+350. Started formwork for drain at CH 1+900 side. Steel cutting for rebar done at site.', 16, 'Concrete Mixer, JCB 3DX', null, 'Steel bars 2 quintal', admin_user_id),
(proj1, '2024-06-03', 'Rain stopped work from 9am to 2pm. Site inspection and cleaning of drainage channels. Rebar bending work in progress.', 8, null, 'PWD AE inspection at 3pm', null, admin_user_id),
(proj1, '2024-06-04', 'Resumed CC road work from CH 2+350 to 2+440. Compacted subgrade. Started gravelly sub-base placement.', 20, 'Excavator, Compactor, JCB', null, 'GSB material 25cu.m', admin_user_id),
(proj1, '2024-06-05', 'GSB compaction and CC road continuation from CH 2+440 to 2+520. Road marking work started near entry point.', 22, 'Compactor, Concrete Mixer', 'Supervisor from PWD visited', 'Cement 50 bags', admin_user_id),
(proj2, '2024-06-01', 'Pothole patching on NH-29 Km 122-128 using cold mix. Surface dressing on Km 130-132.', 12, 'Pothole Filling Machine, Tanker', 'Traffic police visited for lane management', 'Cold mix 25MT', admin_user_id),
(proj2, '2024-06-02', 'Continued surface dressing on Km 132-138. Applied tack coat. Road marking on completed section.', 10, 'Surface Dressing Unit, Tanker', null, 'Bitumen 3MT', admin_user_id),
(proj2, '2024-06-03', 'Rain disrupted work after 11am. Site drainage cleared. Equipment maintenance (oil check) done.', 5, null, null, null, admin_user_id);

-- ==========================================
-- 11. DOCUMENTS
-- ==========================================
INSERT INTO public.documents (project_id, file_name, storage_url, category, expiry_date, notes, created_by) VALUES
(proj1, 'Blasting Permit — Kohima District 2024', 'https://example.com/blasting-permit-2024.pdf', 'blasting_license', '2025-06-30', 'Valid for 12 months from date of issue', admin_user_id),
(proj1, 'Contractors All Risk Policy 2024', 'https://example.com/car-policy-2024.pdf', 'insurance', '2025-03-15', 'Sum insured 2.5 Crores', admin_user_id),
(proj2, 'Vehicle Fitness — NL-01-CC-9012 JCB', 'https://example.com/jcb-rc-2024.pdf', 'equipment_rc', '2025-11-05', 'Fitness valid up to Nov 2025', admin_user_id),
(proj2, 'NH-29 Work Zone Fitness Certificate', 'https://example.com/nh29-fitness.pdf', 'fitness_certificate', '2025-01-15', 'Traffic management plan approved', admin_user_id),
(proj1, 'RA-2 Copy with measurements', 'https://example.com/ra-bill-2.pdf', 'ra_bill_copy', null, 'Submitted to EE PWD Kohima', admin_user_id),
(proj1, 'Site Photos — June 2024 Progress', 'https://example.com/photos-june-2024.pdf', 'photo_report', null, 'Including drone shots', admin_user_id);

-- ==========================================
-- 12. BLASTING SHOTS
-- ==========================================
INSERT INTO public.blasting_shots (project_id, shot_number, blast_date, blast_time, location_chainage, rock_type, bench_height_m, holes_drilled, hole_depth_m, burden_m, spacing_m, explosive_type, total_explosive_kg, detonators_count, detonator_type, initiation_system, misfires_count, result, volume_blasted_cum, safety_officer, clearance_confirmed, remarks, created_by) VALUES
(proj2, 'BL-2024-001', '2024-03-15', '13:30:00', 'NH-29 Km 135+200 to 135+350', 'Hard Rock (Granite)', 3.0, 24, 3.0, 1.2, 1.5, 'ANFO', 48, 24, 'MS Detonator', 'delay_det', 0, 'good', 180, 'Kelhou Asabela', true, 'Successful blast — 24 holes fired in 4 rows with 25ms delay sequence. Good fragmentation.', admin_user_id),
(proj2, 'BL-2024-002', '2024-03-22', '13:45:00', 'NH-29 Km 136+000 to 136+150', 'Hard Rock (Granite)', 2.8, 20, 2.8, 1.1, 1.4, 'Emulsion Explosive', 35, 20, 'MS Detonator', 'delay_det', 0, 'good', 140, 'Kelhou Asabela', true, 'Controlled blast for hard rock cutting. Fly rock distance measured at 8m (within limit).', admin_user_id),
(proj2, 'BL-2024-003', '2024-04-05', '14:00:00', 'NH-29 Km 137+100 to 137+250', 'Boulder/Weathered Rock', 1.5, 12, 1.5, 0.8, 1.0, 'ANFO', 18, 12, 'ND Detonator', 'delay_det', 0, 'good', 60, 'Kelhou Asabela', true, 'Secondary blasting for boulder splitting. Clean detonation, no incidents.', admin_user_id);

RAISE NOTICE 'Seed data inserted successfully!';
RAISE NOTICE 'Project 1: CC Road Construction — Kohima Town (ID: %)', proj1;
RAISE NOTICE 'Project 2: NH-29 Highway Maintenance (ID: %)', proj2;
RAISE NOTICE 'Project 3: Dzoukou Retaining Wall (ID: %)', proj3;
END $$;