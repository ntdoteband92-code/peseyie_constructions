'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 25, fontFamily: 'Helvetica', fontSize: 9 },
  header: { marginBottom: 15, borderBottom: '2px solid #1a1f2e', paddingBottom: 10 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#1a1f2e' },
  subtitle: { fontSize: 8, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 5 },
  infoBox: { width: '48%', borderWidth: 1, borderColor: '#e5e7eb', padding: 5, borderRadius: 2 },
  infoLabel: { fontSize: 7, color: '#6b7280', marginBottom: 1 },
  infoValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1f2e' },
  table: { borderWidth: 1, borderColor: '#d1d5db' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderColor: '#d1d5db' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fafafa' },
  cell: { padding: 4, borderRightWidth: 1, borderColor: '#e5e7eb' },
  cellRight: { padding: 4, textAlign: 'right', borderRightWidth: 1, borderColor: '#e5e7eb' },
  cellBold: { padding: 4, fontFamily: 'Helvetica-Bold' },
  categoryHeader: { flexDirection: 'row', backgroundColor: '#eef2ff', borderBottomWidth: 1, borderColor: '#d1d5db' },
  summaryBox: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  summaryTable: { width: '55%', borderWidth: 1, borderColor: '#d1d5db' },
  summaryRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  summaryLabel: { flex: 2, padding: 5, backgroundColor: '#f3f4f6', fontSize: 9 },
  summaryValue: { flex: 1, padding: 5, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 15, left: 25, right: 25, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6, color: '#9ca3af' },
})

function formatINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

const CATEGORY_COLORS: Record<string, string> = {
  Labour: '#3b82f6',
  Material: '#22c55e',
  Equipment: '#f59e0b',
  Subcontract: '#8b5cf6',
  Overhead: '#ef4444',
  Other: '#6b7280',
}

export function EstimationPDF({ estimation, items }: { estimation: any; items: any[] }) {
  const byCategory: Record<string, any[]> = {}
  items.forEach(item => {
    const cat = item.category ?? 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(item)
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>BILL OF QUANTITIES — {estimation?.name ?? 'Estimate'}</Text>
          <Text style={styles.subtitle}>Pespeyie Constructions | Project: {estimation?.project?.project_name ?? 'N/A'} | Date: {estimation?.estimation_date ? new Date(estimation.estimation_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Estimate Value</Text><Text style={styles.infoValue}>{formatINR(estimation?.grand_total ?? 0)}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Direct Cost</Text><Text style={styles.infoValue}>{formatINR(estimation?.total_direct_cost ?? 0)}</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Overheads</Text><Text style={styles.infoValue}>{estimation?.overheads_pct ?? 0}%</Text></View>
          <View style={styles.infoBox}><Text style={styles.infoLabel}>Profit Margin</Text><Text style={styles.infoValue}>{estimation?.profit_pct ?? 0}%</Text></View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellBold, { flex: 0.5 }]}>Sl</Text>
            <Text style={[styles.cellBold, { flex: 3 }]}>Description</Text>
            <Text style={[styles.cellBold, { flex: 1.2 }]}>Category</Text>
            <Text style={[styles.cellBold, { flex: 0.7 }]}>Unit</Text>
            <Text style={[styles.cellBold, { flex: 0.8 }]}>Qty</Text>
            <Text style={[styles.cellBold, { flex: 1.2 }]}>Rate (₹)</Text>
            <Text style={[styles.cellBold, { flex: 1.3 }]}>Amount (₹)</Text>
          </View>

          {Object.entries(byCategory).map(([category, catItems]) => (
            <View key={category}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.cellBold, { flex: 1, backgroundColor: '#eef2ff', color: CATEGORY_COLORS[category] ?? '#374151' }]}>
                  {category}
                </Text>
              </View>
              {catItems.map((item: any, idx: number) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.cell, { flex: 0.5 }]}>{idx + 1}</Text>
                  <Text style={[styles.cell, { flex: 3 }]}>{item.description ?? '—'}</Text>
                  <Text style={[styles.cell, { flex: 1.2, color: CATEGORY_COLORS[item.category] ?? '#374151', fontSize: 7 }]}>{item.category ?? '—'}</Text>
                  <Text style={[styles.cell, { flex: 0.7 }]}>{item.unit ?? '—'}</Text>
                  <Text style={[styles.cellRight, { flex: 0.8 }]}>{item.quantity?.toLocaleString('en-IN') ?? '0'}</Text>
                  <Text style={[styles.cellRight, { flex: 1.2 }]}>{formatINR(item.rate ?? 0)}</Text>
                  <Text style={[styles.cellRight, { flex: 1.3 }]}>{formatINR(item.amount ?? item.quantity * item.rate)}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={[styles.tableRow, { backgroundColor: '#f3f4f6' }]}>
            <Text style={[styles.cellBold, { flex: 4.2 }]}>TOTAL DIRECT COST</Text>
            <Text style={[styles.cellRight, { flex: 3.8, backgroundColor: '#f3f4f6' }]}>{formatINR(estimation?.total_direct_cost ?? 0)}</Text>
          </View>
          {(estimation?.overheads_pct ?? 0) > 0 && (
            <View style={[styles.tableRow]}>
              <Text style={[styles.cell, { flex: 4.2 }]}>+ Overheads ({estimation?.overheads_pct}%)</Text>
              <Text style={[styles.cellRight, { flex: 3.8 }]}>{formatINR(((estimation?.total_direct_cost ?? 0) * (estimation?.overheads_pct ?? 0)) / 100)}</Text>
            </View>
          )}
          {(estimation?.profit_pct ?? 0) > 0 && (
            <View style={[styles.tableRow]}>
              <Text style={[styles.cell, { flex: 4.2 }]}>+ Profit ({estimation?.profit_pct}%)</Text>
              <Text style={[styles.cellRight, { flex: 3.8 }]}>{formatINR(((((estimation?.total_direct_cost ?? 0) * (1 + (estimation?.overheads_pct ?? 0) / 100)) * (estimation?.profit_pct ?? 0)) / 100))}</Text>
            </View>
          )}
          <View style={[styles.tableRow, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.cellBold, { flex: 4.2, backgroundColor: '#bbf7d0' }]}>GRAND TOTAL</Text>
            <Text style={[styles.cellRight, { flex: 3.8, backgroundColor: '#bbf7d0', fontFamily: 'Helvetica-Bold', fontSize: 11 }]}>{formatINR(estimation?.grand_total ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pespeyie Constructions — Confidential</Text>
          <Text style={styles.footerText}>Generated: {new Date().toLocaleDateString('en-IN')} | This is a computer-generated document</Text>
        </View>
      </Page>
    </Document>
  )
}