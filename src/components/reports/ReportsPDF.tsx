'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9 },
  header: { marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1a1f2e' },
  subtitle: { fontSize: 8, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '1px solid #f3f4f6', paddingVertical: 5 },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellRight: { flex: 1, paddingHorizontal: 4, textAlign: 'right' },
  cellBold: { flex: 1, paddingHorizontal: 4, fontFamily: 'Helvetica-Bold' },
  headerRow: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingVertical: 5, borderBottom: '1px solid #e5e7eb' },
  statBox: { flex: 1, padding: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, margin: 4 },
  statValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1a1f2e' },
  statLabel: { fontSize: 7, color: '#6b7280', marginTop: 2 },
  twoCol: { flexDirection: 'row' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginTop: 4 },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, borderTop: '1px solid #e5e7eb', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#9ca3af' },
})

function formatINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

function formatDate(d) {
  if (!d) return '—'
  try { return format(new Date(d), 'dd/MM/yy') } catch { return '—' }
}

function ProgressBar({ value, max, color = '#f59e0b' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <View style={styles.progressBar}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  )
}

export default function ReportsPDF({ data }) {
  const { stats, projectSummary, expenseByCategory, raBillStatusSummary } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Pespeyie Constructions — Operations Report</Text>
          <Text style={styles.subtitle}>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')} | All values in INR</Text>
        </View>

        {/* Stats Row */}
        <View style={[styles.twoCol, { marginBottom: 20 }]}>
          {[
            { label: 'Total Projects', value: stats.total_projects, sub: `${stats.active_projects} active` },
            { label: 'Total Project Value', value: formatINR(stats.total_project_value), sub: '' },
            { label: 'RA Bills Raised', value: formatINR(stats.total_ra_bills), sub: `${stats.total_ra_bill_count} bills` },
            { label: 'Total Expenses', value: formatINR(stats.total_expenses), sub: '' },
            { label: 'Active Workers', value: stats.active_workers, sub: `${stats.total_workers} registered` },
          ].map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}{s.sub ? ` · ${s.sub}` : ''}</Text>
            </View>
          ))}
        </View>

        {/* Project Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Summary</Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, { flex: 2 }]}>Project</Text>
            <Text style={styles.cell}>Status</Text>
            <Text style={[styles.cellRight]}>Value</Text>
            <Text style={styles.cellRight}>Billed</Text>
            <Text style={styles.cellRight}>Billed %</Text>
            <Text style={styles.cellRight}>Expenses</Text>
          </View>
          {projectSummary.map((p, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.cell, { flex: 2 }]}>{p.name}</Text>
              <Text style={styles.cell}>{p.status?.replace('_', ' ') ?? '—'}</Text>
              <Text style={styles.cellRight}>{formatINR(p.value)}</Text>
              <Text style={styles.cellRight}>{formatINR(p.billed_amount)}</Text>
              <Text style={styles.cellRight}>{p.billed_pct}%</Text>
              <Text style={styles.cellRight}>{formatINR(p.total_expenses)}</Text>
            </View>
          ))}
          <View style={[styles.row, { backgroundColor: '#f9fafb' }]}>
            <Text style={[styles.cellBold, { flex: 2 }]}>Total</Text>
            <Text style={styles.cell} />
            <Text style={[styles.cellRight, styles.cellBold]}>{formatINR(stats.total_project_value)}</Text>
            <Text style={[styles.cellRight, styles.cellBold]}>{formatINR(stats.total_ra_bills)}</Text>
            <Text style={styles.cellRight} />
            <Text style={[styles.cellRight, styles.cellBold]}>{formatINR(stats.total_expenses)}</Text>
          </View>
        </View>

        {/* RA Bill Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RA Bill Status Breakdown</Text>
          <View style={styles.headerRow}>
            <Text style={styles.cell}>Status</Text>
            <Text style={[styles.cellRight]}>Amount</Text>
            <Text style={[styles.cellRight]}>% Share</Text>
            <Text style={[styles.cell, { flex: 2 }]}>Visual</Text>
          </View>
          {(['pending', 'certified', 'approved', 'paid', 'rejected'] as const).map(status => {
            const amount = raBillStatusSummary[status] ?? 0
            const pct = stats.total_ra_bills > 0 ? ((amount / stats.total_ra_bills) * 100).toFixed(1) : '0.0'
            const colors = { pending: '#f59e0b', certified: '#a855f7', approved: '#6366f1', paid: '#22c55e', rejected: '#ef4444' }
            return (
              <View key={status} style={styles.row}>
                <Text style={styles.cell}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                <Text style={styles.cellRight}>{formatINR(amount)}</Text>
                <Text style={styles.cellRight}>{pct}%</Text>
                <View style={[styles.cell, { flex: 2 }]}>
                  <ProgressBar value={amount} max={stats.total_ra_bills} color={colors[status]} />
                </View>
              </View>
            )
          })}
        </View>

        {/* Expense Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Analysis by Category</Text>
          <View style={styles.headerRow}>
            <Text style={styles.cell}>Category</Text>
            <Text style={[styles.cellRight]}>Amount</Text>
            <Text style={[styles.cellRight]}>% Share</Text>
            <Text style={[styles.cell, { flex: 2 }]}>Visual</Text>
          </View>
          {expenseByCategory.map((row, i) => {
            const pct = (row.amount / stats.total_expenses) * 100
            return (
              <View key={i} style={styles.row}>
                <Text style={styles.cell}>{row.category}</Text>
                <Text style={styles.cellRight}>{formatINR(row.amount)}</Text>
                <Text style={styles.cellRight}>{pct.toFixed(1)}%</Text>
                <View style={[styles.cell, { flex: 2 }]}>
                  <ProgressBar value={row.amount} max={stats.total_expenses} />
                </View>
              </View>
            )
          })}
          <View style={[styles.row, { backgroundColor: '#f9fafb' }]}>
            <Text style={styles.cellBold}>Total</Text>
            <Text style={[styles.cellRight, styles.cellBold]}>{formatINR(stats.total_expenses)}</Text>
            <Text style={styles.cellRight}>100%</Text>
            <View style={[styles.cell, { flex: 2 }]} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pespeyie Constructions — Confidential</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  )
}