'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: { padding: 25, fontFamily: 'Helvetica', fontSize: 9 },
  header: { marginBottom: 15, borderBottom: '2px solid #1a1f2e', paddingBottom: 10 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#1a1f2e' },
  subtitle: { fontSize: 8, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 5 },
  infoBox: { width: '48%', borderWidth: 1, borderColor: '#e5e7eb', padding: 6, borderRadius: 2 },
  infoLabel: { fontSize: 7, color: '#6b7280', marginBottom: 1 },
  infoValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1f2e' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 6, borderBottom: '1px solid #e5e7eb', paddingBottom: 3 },
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderColor: '#d1d5db' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fafafa' },
  cell: { padding: 4, borderRightWidth: 1, borderColor: '#e5e7eb' },
  cellRight: { padding: 4, textAlign: 'right', borderRightWidth: 1, borderColor: '#e5e7eb' },
  cellBold: { padding: 4, fontFamily: 'Helvetica-Bold' },
  deductionRow: { flexDirection: 'row', paddingVertical: 3, borderBottom: '1px dotted #e5e7eb' },
  deductionsContainer: { borderWidth: 1, borderColor: '#d1d5db', padding: 8, borderRadius: 2 },
  summaryBox: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  summaryTable: { width: '50%', borderWidth: 1, borderColor: '#d1d5db' },
  summaryRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  summaryLabel: { flex: 2, padding: 5, backgroundColor: '#f3f4f6', fontSize: 9 },
  summaryValue: { flex: 1, padding: 5, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 15, left: 25, right: 25, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, alignSelf: 'flex-start', marginTop: 2 },
})

function formatINR(n: number) {
  if (isNaN(n) || n === null || n === undefined) return '₹0'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try { return format(new Date(d), 'dd/MM/yyyy') } catch { return '—' }
}

export function RaBillPDF({ bill }: { bill: any }) {
  const deductions = bill.ra_bill_deductions ?? []
  const payments = bill.ra_bill_payments ?? []
  const totalDeductions = deductions.reduce((s: number, d: any) => s + (d.deduction_amount ?? 0), 0)
  const netAmount = (bill.certified_amount ?? bill.gross_amount ?? 0) - totalDeductions
  const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount_paid ?? 0), 0)
  const balance = netAmount - totalPaid

  const STATUS_COLORS: Record<string, string> = {
    draft: '#6b7280', submitted: '#3b82f6', under_measurement: '#8b5cf6',
    certified: '#a855f7', payment_released: '#22c55e', partially_paid: '#f59e0b',
    paid: '#22c55e', rejected: '#ef4444',
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>RUNNING ACCOUNT BILL — {bill.bill_number ?? 'RA Bill'}</Text>
          <Text style={styles.subtitle}>Pespeyie Constructions | {bill.project?.project_name ?? '—'} | Generated: {format(new Date(), 'dd MMM yyyy')}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill No.</Text>
            <Text style={styles.infoValue}>{bill.bill_number ?? '—'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Bill Date</Text>
            <Text style={styles.infoValue}>{formatDate(bill.bill_date)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Project</Text>
            <Text style={styles.infoValue}>{bill.project?.project_name ?? '—'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[bill.status] + '20', color: STATUS_COLORS[bill.status] }]}>
              {bill.status?.replace('_', ' ').toUpperCase() ?? '—'}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Work Done Upto</Text>
            <Text style={styles.infoValue}>{formatDate(bill.work_done_upto)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Submitted To</Text>
            <Text style={styles.infoValue}>{bill.submitted_to ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gross Amount</Text>
              <Text style={styles.summaryValue}>{formatINR(bill.gross_amount)}</Text>
            </View>
            {deductions.map((d: any, i: number) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Less: {d.deduction_description ?? `Deduction ${i + 1}`} ({d.deduction_percentage ? `${d.deduction_percentage}%` : 'Fixed'})</Text>
                <Text style={[styles.summaryValue, { color: '#ef4444' }]}>- {formatINR(d.deduction_amount)}</Text>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { backgroundColor: '#dbeafe', fontFamily: 'Helvetica-Bold' }]}>Certified Amount</Text>
              <Text style={[styles.summaryValue, { backgroundColor: '#dbeafe' }]}>{formatINR(bill.certified_amount ?? bill.gross_amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Deductions</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>- {formatINR(totalDeductions)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { backgroundColor: '#dcfce7', fontFamily: 'Helvetica-Bold', fontSize: 10 }]}>NET PAYABLE</Text>
              <Text style={[styles.summaryValue, { backgroundColor: '#dcfce7', fontSize: 10 }]}>{formatINR(netAmount)}</Text>
            </View>
            {totalPaid > 0 && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount Paid</Text>
                  <Text style={[styles.summaryValue, { color: '#22c55e' }]}>- {formatINR(totalPaid)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { backgroundColor: '#fee2e2', fontFamily: 'Helvetica-Bold' }]}>BALANCE DUE</Text>
                  <Text style={[styles.summaryValue, { backgroundColor: '#fee2e2', color: balance > 0 ? '#ef4444' : '#22c55e' }]}>
                    {formatINR(Math.abs(balance))}{balance < 0 ? ' (EXCESS)' : ''}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {deductions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deduction Details</Text>
            <View style={styles.deductionsContainer}>
              {deductions.map((d: any, i: number) => (
                <View key={i} style={styles.deductionRow}>
                  <Text style={{ flex: 1, fontSize: 8 }}>{i + 1}. {d.deduction_description ?? `Deduction ${i + 1}`}</Text>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>{d.deduction_percentage ? `${d.deduction_percentage}%` : 'Fixed'} | </Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{formatINR(d.deduction_amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.cellBold, { flex: 1 }]}>Date</Text>
                <Text style={[styles.cellBold, { flex: 1 }]}>Reference</Text>
                <Text style={[styles.cellBold, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                <Text style={[styles.cellBold, { flex: 1 }]}>Mode</Text>
              </View>
              {payments.map((p: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 1 }]}>{formatDate(p.payment_date)}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{p.reference_no ?? '—'}</Text>
                  <Text style={[styles.cellRight, { flex: 1 }]}>{formatINR(p.amount_paid)}</Text>
                  <Text style={[styles.cell, { flex: 1 }]}>{p.payment_mode ?? '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {bill.remarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remarks</Text>
            <Text style={{ fontSize: 8, color: '#6b7280' }}>{bill.remarks}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pespeyie Constructions — Confidential | This is a computer-generated document</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  )
}