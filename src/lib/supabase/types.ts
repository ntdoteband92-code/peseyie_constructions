// ============================================================
// Supabase type definitions for Peseyie Constructions
// ============================================================

export type AppRole = 'admin' | 'manager' | 'accountant' | 'supervisor' | 'viewer'

export function isAppRole(value: string): value is AppRole {
  return ['admin', 'manager', 'accountant', 'supervisor', 'viewer'].includes(value)
}
export const isAdmin   = (role: AppRole) => role === 'admin'
export const isManager = (role: AppRole) => role === 'manager'

// ── Enums ────────────────────────────────────────────────────
export type ProjectStatus  = 'ongoing' | 'completed' | 'on_hold' | 'defect_liability' | 'terminated'
export type TenderStatus   = 'identified' | 'documents_purchased' | 'bid_submitted' | 'l1_lowest_bidder' | 'awarded' | 'lost' | 'withdrawn'
export type RaBillStatus   = 'draft' | 'submitted' | 'under_measurement' | 'certified' | 'payment_released' | 'partially_paid'
export type PaymentMode    = 'cash' | 'bank_transfer' | 'neft_rtgs' | 'cheque' | 'upi'
export type OwnershipType  = 'company_owned' | 'hired'
export type EquipmentStatus = 'active' | 'under_maintenance' | 'idle' | 'hired_out' | 'decommissioned'
export type WageType       = 'daily_rate' | 'monthly_salary'
export type EmploymentType = 'direct' | 'contractual'
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'overtime' | 'leave'
export type WorkOrderStatus = 'issued' | 'in_progress' | 'completed' | 'partially_completed' | 'disputed' | 'terminated'
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'fog'
export type DocumentCategory = 'contract' | 'drawing' | 'boq' | 'tender_document' | 'blasting_license' | 'explosive_license' | 'equipment_rc' | 'insurance' | 'fitness_certificate' | 'labour_license' | 'govt_correspondence' | 'ra_bill_copy' | 'photo_report' | 'other'
export type ExpenseCategory = 'fuel' | 'labour_wages' | 'materials' | 'equipment_hire' | 'explosives_purchase' | 'transport' | 'subcontractor_payment' | 'royalty' | 'tds_paid' | 'gst_paid' | 'office_admin' | 'repairs_maintenance' | 'miscellaneous'
export type MaterialCategory = 'aggregate' | 'cement' | 'bitumen' | 'steel' | 'sand' | 'pipes' | 'explosive' | 'detonator' | 'fuel_hsd' | 'lubricants' | 'timber' | 'hardware' | 'other'
export type MaterialUnit = 'mt' | 'cft' | 'cum' | 'bags' | 'litres' | 'kg' | 'nos' | 'rmt'
export type BlastResult  = 'excellent' | 'good' | 'fair' | 'poor'
export type FuelType     = 'hsd' | 'petrol' | 'lubricant'
export type MaintenanceType = 'scheduled_service' | 'breakdown_repair' | 'tyre_change' | 'battery' | 'other'

// ──  Database interface ─────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      org_settings: {
        Row: {
          id: string
          company_name: string
          address: string | null
          gstin: string | null
          pan: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          financial_year_start: number
          default_retention_pct: number
          default_tds_pct: number
          default_labour_cess_pct: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_name: string
          address?: string | null
          gstin?: string | null
          pan?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          financial_year_start?: number
          default_retention_pct?: number
          default_tds_pct?: number
          default_labour_cess_pct?: number
          updated_by?: string | null
        }
        Update: {
          company_name?: string
          address?: string | null
          gstin?: string | null
          pan?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          financial_year_start?: number
          default_retention_pct?: number
          default_tds_pct?: number
          default_labour_cess_pct?: number
          updated_by?: string | null
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
        Update: {
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: AppRole
          assigned_by: string | null
          assigned_at: string
        }
        Insert: {
          user_id: string
          role: AppRole
          assigned_by?: string | null
        }
        Update: {
          role?: AppRole
          assigned_by?: string | null
        }
      }
      tenders: {
        Row: {
          id: string
          tender_name: string
          nit_number: string | null
          department: string | null
          tender_value: number | null
          duration_months: number | null
          submission_deadline: string | null
          tender_fee: number | null
          emd_amount: number | null
          emd_status: 'paid' | 'refunded' | 'forfeited' | null
          emd_refund_date: string | null
          bid_submission_date: string | null
          bid_opening_date: string | null
          status: TenderStatus
          our_quoted_amount: number | null
          rival_l1_amount: number | null
          converted_project_id: string | null
          remarks: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          issuing_department: string | null
        }
        Insert: {
          tender_name: string
          nit_number?: string | null
          department?: string | null
          tender_value?: number | null
          duration_months?: number | null
          submission_deadline?: string | null
          tender_fee?: number | null
          emd_amount?: number | null
          emd_status?: 'paid' | 'refunded' | 'forfeited' | null
          emd_refund_date?: string | null
          bid_submission_date?: string | null
          bid_opening_date?: string | null
          status?: TenderStatus
          our_quoted_amount?: number | null
          rival_l1_amount?: number | null
          converted_project_id?: string | null
          remarks?: string | null
          is_deleted?: boolean
          created_by?: string | null
          issuing_department?: string | null
        }
        Update: {
          tender_name?: string
          nit_number?: string | null
          department?: string | null
          tender_value?: number | null
          duration_months?: number | null
          submission_deadline?: string | null
          tender_fee?: number | null
          emd_amount?: number | null
          emd_status?: 'paid' | 'refunded' | 'forfeited' | null
          emd_refund_date?: string | null
          bid_submission_date?: string | null
          bid_opening_date?: string | null
          status?: TenderStatus
          our_quoted_amount?: number | null
          rival_l1_amount?: number | null
          converted_project_id?: string | null
          remarks?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
          issuing_department?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          project_name: string
          contract_number: string | null
          tender_id: string | null
          client_name: string | null
          client_contact_person: string | null
          client_phone: string | null
          contract_value: number
          contract_date: string | null
          start_date: string | null
          expected_end_date: string | null
          actual_end_date: string | null
          location_district: string | null
          location_state: string | null
          project_type: string[]
          status: ProjectStatus
          security_deposit: number | null
          security_deposit_status: string | null
          scope_of_work: string | null
          project_manager_id: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_name: string
          contract_number?: string | null
          tender_id?: string | null
          client_name?: string | null
          client_contact_person?: string | null
          client_phone?: string | null
          contract_value: number
          contract_date?: string | null
          start_date?: string | null
          expected_end_date?: string | null
          actual_end_date?: string | null
          location_district?: string | null
          location_state?: string | null
          project_type?: string[]
          status?: ProjectStatus
          security_deposit?: number | null
          security_deposit_status?: string | null
          scope_of_work?: string | null
          project_manager_id?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_name?: string
          contract_number?: string | null
          tender_id?: string | null
          client_name?: string | null
          client_contact_person?: string | null
          client_phone?: string | null
          contract_value?: number
          contract_date?: string | null
          start_date?: string | null
          expected_end_date?: string | null
          actual_end_date?: string | null
          location_district?: string | null
          location_state?: string | null
          project_type?: string[]
          status?: ProjectStatus
          security_deposit?: number | null
          security_deposit_status?: string | null
          scope_of_work?: string | null
          project_manager_id?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      ra_bills: {
        Row: {
          id: string
          project_id: string
          bill_number: string
          bill_date: string
          submitted_to: string | null
          work_done_upto: string | null
          gross_amount: number
          net_payable: number | null
          certified_amount: number | null
          status: RaBillStatus
          remarks: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id: string
          bill_number: string
          bill_date: string
          submitted_to?: string | null
          work_done_upto?: string | null
          gross_amount: number
          net_payable?: number | null
          certified_amount?: number | null
          status?: RaBillStatus
          remarks?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_id?: string
          bill_number?: string
          bill_date?: string
          submitted_to?: string | null
          work_done_upto?: string | null
          gross_amount?: number
          net_payable?: number | null
          certified_amount?: number | null
          status?: RaBillStatus
          remarks?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          project_id: string | null
          expense_date: string
          category: ExpenseCategory
          amount: number
          paid_to: string | null
          payment_mode: PaymentMode | null
          gst_amount: number | null
          gst_invoice_no: string | null
          tds_deducted: number | null
          vendor_id: string | null
          receipt_url: string | null
          notes: string | null
          approved_by: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id?: string | null
          expense_date: string
          category: ExpenseCategory
          amount: number
          paid_to?: string | null
          payment_mode?: PaymentMode | null
          gst_amount?: number | null
          gst_invoice_no?: string | null
          tds_deducted?: number | null
          vendor_id?: string | null
          receipt_url?: string | null
          notes?: string | null
          approved_by?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_id?: string | null
          expense_date?: string
          category?: ExpenseCategory
          amount?: number
          paid_to?: string | null
          payment_mode?: PaymentMode | null
          gst_amount?: number | null
          gst_invoice_no?: string | null
          tds_deducted?: number | null
          vendor_id?: string | null
          receipt_url?: string | null
          notes?: string | null
          approved_by?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      employees: {
        Row: {
          id: string
          full_name: string
          role: string
          contact_number: string | null
          emergency_contact: string | null
          address: string | null
          id_proof_type: string | null
          id_proof_number: string | null
          joining_date: string | null
          employment_type: EmploymentType
          wage_type: WageType
          wage_rate: number
          ot_rate: number | null
          pf_applicable: boolean
          esi_applicable: boolean
          bank_account_no: string | null
          bank_ifsc: string | null
          is_active: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          full_name: string
          role: string
          contact_number?: string | null
          emergency_contact?: string | null
          address?: string | null
          id_proof_type?: string | null
          id_proof_number?: string | null
          joining_date?: string | null
          employment_type: EmploymentType
          wage_type: WageType
          wage_rate: number
          ot_rate?: number | null
          pf_applicable?: boolean
          esi_applicable?: boolean
          bank_account_no?: string | null
          bank_ifsc?: string | null
          is_active?: boolean
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          full_name?: string
          role?: string
          contact_number?: string | null
          emergency_contact?: string | null
          address?: string | null
          id_proof_type?: string | null
          id_proof_number?: string | null
          joining_date?: string | null
          employment_type?: EmploymentType
          wage_type?: WageType
          wage_rate?: number
          ot_rate?: number | null
          pf_applicable?: boolean
          esi_applicable?: boolean
          bank_account_no?: string | null
          bank_ifsc?: string | null
          is_active?: boolean
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          employee_id: string
          project_id: string
          work_date: string
          status: AttendanceStatus
          ot_hours: number | null
          remarks: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          employee_id: string
          project_id: string
          work_date: string
          status: AttendanceStatus
          ot_hours?: number | null
          remarks?: string | null
          created_by?: string | null
        }
        Update: {
          employee_id?: string
          project_id?: string
          work_date?: string
          status?: AttendanceStatus
          ot_hours?: number | null
          remarks?: string | null
          updated_at?: string
          created_by?: string | null
        }
      }
      vendors: {
        Row: {
          id: string
          vendor_name: string
          contact_person: string | null
          phone: string | null
          address: string | null
          gstin: string | null
          pan: string | null
          material_supplied: string | null
          credit_days: number | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          vendor_name: string
          contact_person?: string | null
          phone?: string | null
          address?: string | null
          gstin?: string | null
          pan?: string | null
          material_supplied?: string | null
          credit_days?: number | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          vendor_name?: string
          contact_person?: string | null
          phone?: string | null
          address?: string | null
          gstin?: string | null
          pan?: string | null
          material_supplied?: string | null
          credit_days?: number | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      equipment: {
        Row: {
          id: string
          equipment_name: string
          equipment_type: string
          make: string | null
          model: string | null
          year: number | null
          serial_number: string | null
          registration_no: string | null
          ownership: OwnershipType
          hire_firm_name: string | null
          hire_firm_contact: string | null
          hire_rate: number | null
          hire_rate_unit: string | null
          hire_start_date: string | null
          purchase_cost: number | null
          purchase_date: string | null
          current_project_id: string | null
          status: EquipmentStatus
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          equipment_name: string
          equipment_type: string
          make?: string | null
          model?: string | null
          year?: number | null
          serial_number?: string | null
          registration_no?: string | null
          ownership: OwnershipType
          hire_firm_name?: string | null
          hire_firm_contact?: string | null
          hire_rate?: number | null
          hire_rate_unit?: string | null
          hire_start_date?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          current_project_id?: string | null
          status?: EquipmentStatus
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          equipment_name?: string
          equipment_type?: string
          make?: string | null
          model?: string | null
          year?: number | null
          serial_number?: string | null
          registration_no?: string | null
          ownership?: OwnershipType
          hire_firm_name?: string | null
          hire_firm_contact?: string | null
          hire_rate?: number | null
          hire_rate_unit?: string | null
          hire_start_date?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          current_project_id?: string | null
          status?: EquipmentStatus
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      diary_entries: {
        Row: {
          id: string
          project_id: string
          entry_date: string
          weather_am: WeatherCondition | null
          weather_pm: WeatherCondition | null
          work_done: string | null
          workers_count: number | null
          equipment_on_site: string | null
          visitors: string | null
          materials_received: string | null
          issues: string | null
          written_by: string | null
          verified_by: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id: string
          entry_date: string
          weather_am?: WeatherCondition | null
          weather_pm?: WeatherCondition | null
          work_done?: string | null
          workers_count?: number | null
          equipment_on_site?: string | null
          visitors?: string | null
          materials_received?: string | null
          issues?: string | null
          written_by?: string | null
          verified_by?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_id?: string
          entry_date?: string
          weather_am?: WeatherCondition | null
          weather_pm?: WeatherCondition | null
          work_done?: string | null
          workers_count?: number | null
          equipment_on_site?: string | null
          visitors?: string | null
          materials_received?: string | null
          issues?: string | null
          written_by?: string | null
          verified_by?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string | null
          file_name: string
          storage_url: string
          category: DocumentCategory
          expiry_date: string | null
          notes: string | null
          file_size_kb: number | null
          mime_type: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id?: string | null
          file_name: string
          storage_url: string
          category: DocumentCategory
          expiry_date?: string | null
          notes?: string | null
          file_size_kb?: number | null
          mime_type?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_id?: string | null
          file_name?: string
          storage_url?: string
          category?: DocumentCategory
          expiry_date?: string | null
          notes?: string | null
          file_size_kb?: number | null
          mime_type?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      materials: {
        Row: {
          id: string
          material_name: string
          category: string
          unit: string
          standard_rate: number | null
          min_stock_threshold: number
          is_deleted: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          material_name: string
          category: string
          unit: string
          standard_rate?: number | null
          min_stock_threshold?: number
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          material_name?: string
          category?: string
          unit?: string
          standard_rate?: number | null
          min_stock_threshold?: number
          is_deleted?: boolean
          created_by?: string | null
        }
      }
      material_inward: {
        Row: {
          id: string
          material_id: string
          project_id: string
          inward_date: string
          quantity: number
          rate_per_unit: number
          total_amount: number | null
          vendor_id: string | null
          invoice_no: string | null
          vehicle_no: string | null
          received_by: string | null
          quality_note: string | null
          challan_url: string | null
          is_deleted: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          material_id: string
          project_id: string
          inward_date: string
          quantity: number
          rate_per_unit: number
          total_amount?: number | null
          vendor_id?: string | null
          invoice_no?: string | null
          vehicle_no?: string | null
          received_by?: string | null
          quality_note?: string | null
          challan_url?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          material_id?: string
          project_id?: string
          inward_date?: string
          quantity?: number
          rate_per_unit?: number
          total_amount?: number | null
          vendor_id?: string | null
          invoice_no?: string | null
          vehicle_no?: string | null
          received_by?: string | null
          quality_note?: string | null
          challan_url?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
      }
      material_outward: {
        Row: {
          id: string
          material_id: string
          project_id: string
          outward_date: string
          quantity: number
          issued_to: string | null
          purpose: string | null
          issued_by: string | null
          is_deleted: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          material_id: string
          project_id: string
          outward_date: string
          quantity: number
          issued_to?: string | null
          purpose?: string | null
          issued_by?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          material_id?: string
          project_id?: string
          outward_date?: string
          quantity?: number
          issued_to?: string | null
          purpose?: string | null
          issued_by?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
      }
      subcontractors: {
        Row: {
          id: string
          firm_name: string
          proprietor_name: string | null
          contact_phone: string | null
          address: string | null
          gstin: string | null
          pan: string | null
          specialty: string | null
          license_info: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          firm_name: string
          proprietor_name?: string | null
          contact_phone?: string | null
          address?: string | null
          gstin?: string | null
          pan?: string | null
          specialty?: string | null
          license_info?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          firm_name?: string
          proprietor_name?: string | null
          contact_phone?: string | null
          address?: string | null
          gstin?: string | null
          pan?: string | null
          specialty?: string | null
          license_info?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      work_orders: {
        Row: {
          id: string
          project_id: string
          subcontractor_id: string
          work_description: string
          location_chainage: string | null
          unit: string | null
          quantity: number | null
          rate: number | null
          total_value: number | null
          start_date: string | null
          end_date: string | null
          status: WorkOrderStatus
          tds_pct: number
          remarks: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id: string
          subcontractor_id: string
          work_description: string
          location_chainage?: string | null
          unit?: string | null
          quantity?: number | null
          rate?: number | null
          total_value?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: WorkOrderStatus
          tds_pct?: number
          remarks?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_id?: string
          subcontractor_id?: string
          work_description?: string
          location_chainage?: string | null
          unit?: string | null
          quantity?: number | null
          rate?: number | null
          total_value?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: WorkOrderStatus
          tds_pct?: number
          remarks?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      subcontractor_bills: {
        Row: {
          id: string
          work_order_id: string
          project_id: string
          bill_date: string
          quantity_done: number | null
          amount_claimed: number
          amount_certified: number | null
          tds_deducted: number
          net_payable: number | null
          amount_paid: number
          balance_due: number | null
          payment_date: string | null
          payment_mode: string | null
          reference_no: string | null
          remarks: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          work_order_id: string
          project_id: string
          bill_date: string
          quantity_done?: number | null
          amount_claimed: number
          amount_certified?: number | null
          tds_deducted?: number
          net_payable?: number | null
          amount_paid?: number
          balance_due?: number | null
          payment_date?: string | null
          payment_mode?: string | null
          reference_no?: string | null
          remarks?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          work_order_id?: string
          project_id?: string
          bill_date?: string
          quantity_done?: number | null
          amount_claimed?: number
          amount_certified?: number | null
          tds_deducted?: number
          net_payable?: number | null
          amount_paid?: number
          balance_due?: number | null
          payment_date?: string | null
          payment_mode?: string | null
          reference_no?: string | null
          remarks?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
      blasting_shots: {
        Row: {
          id: string
          project_id: string
          shot_number: string
          blast_date: string
          blast_time: string | null
          location_chainage: string | null
          rock_type: string | null
          bench_height_m: number | null
          holes_drilled: number | null
          hole_depth_m: number | null
          hole_diameter_mm: number | null
          burden_m: number | null
          spacing_m: number | null
          explosive_type: string | null
          total_explosive_kg: number | null
          detonators_count: number | null
          detonator_type: string | null
          initiation_system: string | null
          misfires_count: number
          misfire_action: string | null
          result: string | null
          volume_blasted_cum: number | null
          safety_officer: string | null
          clearance_confirmed: boolean
          authority_intimation_ref: string | null
          remarks: string | null
          is_deleted: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          project_id: string
          shot_number: string
          blast_date: string
          blast_time?: string | null
          location_chainage?: string | null
          rock_type?: string | null
          bench_height_m?: number | null
          holes_drilled?: number | null
          hole_depth_m?: number | null
          hole_diameter_mm?: number | null
          burden_m?: number | null
          spacing_m?: number | null
          explosive_type?: string | null
          total_explosive_kg?: number | null
          detonators_count?: number | null
          detonator_type?: string | null
          initiation_system?: string | null
          misfires_count?: number
          misfire_action?: string | null
          result?: string | null
          volume_blasted_cum?: number | null
          safety_officer?: string | null
          clearance_confirmed?: boolean
          authority_intimation_ref?: string | null
          remarks?: string | null
          is_deleted?: boolean
          created_by?: string | null
        }
        Update: {
          project_id?: string
          shot_number?: string
          blast_date?: string
          blast_time?: string | null
          location_chainage?: string | null
          rock_type?: string | null
          bench_height_m?: number | null
          holes_drilled?: number | null
          hole_depth_m?: number | null
          hole_diameter_mm?: number | null
          burden_m?: number | null
          spacing_m?: number | null
          explosive_type?: string | null
          total_explosive_kg?: number | null
          detonators_count?: number | null
          detonator_type?: string | null
          initiation_system?: string | null
          misfires_count?: number
          misfire_action?: string | null
          result?: string | null
          volume_blasted_cum?: number | null
          safety_officer?: string | null
          clearance_confirmed?: boolean
          authority_intimation_ref?: string | null
          remarks?: string | null
          is_deleted?: boolean
          updated_at?: string
          created_by?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: {
        Args: Record<string, never>
        Returns: AppRole
      }
      get_project_financial_summary: {
        Args: { p_project_id: string }
        Returns: {
          contract_value: number
          total_billed: number
          total_received: number
          retention_held: number
          retention_released: number
          total_spent: number
          gross_margin_pct: number
        }[]
      }
      get_monthly_cashflow: {
        Args: { months_back?: number }
        Returns: { month_label: string; income: number; expenses: number }[]
      }
      get_dashboard_summary: {
        Args: Record<string, never>
        Returns: {
          active_projects_count: number
          active_contract_value: number
          total_retention_held: number
          total_retention_released: number
          outstanding_advances: number
          pending_subcon_payments: number
          equipment_on_ground: number
        }[]
      }
    }
    Enums: {
      app_role: AppRole
      project_status: ProjectStatus
      tender_status: TenderStatus
      ra_bill_status: RaBillStatus
      payment_mode: PaymentMode
      ownership_type: OwnershipType
      equipment_status: EquipmentStatus
      wage_type: WageType
      employment_type: EmploymentType
      attendance_status: AttendanceStatus
      work_order_status: WorkOrderStatus
      weather_condition: WeatherCondition
      document_category: DocumentCategory
      expense_category: ExpenseCategory
      material_category: MaterialCategory
      material_unit: MaterialUnit
      blast_result: BlastResult
      fuel_type: FuelType
      maintenance_type: MaintenanceType
    }
  }
}
