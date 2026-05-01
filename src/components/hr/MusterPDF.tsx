'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 20, fontFamily: 'Helvetica', fontSize: 8 },
  header: { marginBottom: 12, borderBottom: '2px solid #1a1f2e', paddingBottom: 8 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#1a1f2e' },
  subtitle: { fontSize: 7, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, fontSize: 7 },
  table: { borderWidth: 1, borderColor: '#d1d5db', marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderColor: '#d1d5db' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  cell: { padding: 3, borderRightWidth: 1, borderColor: '#e5e7eb' },
  cellRight: { padding: 3, textAlign: 'right', borderRightWidth: 1, borderColor: '#e5e7eb' },
  cellBold: { padding: 3, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 15, left: 20, right: 20, borderTop: '1px solid #e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6, color: '#9ca3af' },
  summaryRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  summaryBox: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', padding: 6, borderRadius: 2 },
  summaryValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1a1f2e' },
  summaryLabel: { fontSize: 6, color: '#6b7280', marginTop: 1 },
})

function formatINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function MusterPDF({ data, daysInMonth, month }: {
  data: { workers: any[]; projectName: string; month: string; totalWorkers: number }
  daysInMonth: number
  month: string
}) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const daysHeaderWidth = Math.max(10, 80 / (daysInMonth + 3))
  const colWidths = { sl: 5, name: 20, trade: 12, wage: 10, days: daysHeaderWidth, present: 7, absent: 7, total: 12 }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PESPEYIE CONSTRUCTIONS — MUSTER ROLL</Text>
          <Text style={styles.subtitle}>Project: {data.projectName} | Month: {month} | Generated: {new Date().toLocaleDateString('en-IN')}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text>Total Workers: {data.totalWorkers}</Text>
          <Text>Total Present Days: {data.workers.reduce((s: number, w: any) => s + w.present, 0)}</Text>
          <Text>Total Absent Days: {data.workers.reduce((s: number, w: any) => s + w.absent, 0)}</Text>
          <Text>Total Wages: {formatINR(data.workers.reduce((s: number, w: any) => s + w.totalWages, 0))}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellBold, { width: `${colWidths.sl}%` }]}>SL</Text>
            <Text style={[styles.cellBold, { width: `${colWidths.name}%` }]}>Name</Text>
            <Text style={[styles.cellBold, { width: `${colWidths.trade}%` }]}>Trade</Text>
            <Text style={[styles.cellBold, { width: `${colWidths.wage}%` }]}>Wage/Day</Text>
            {days.map(d => (
              <Text key={d} style={[styles.cellBold, { width: `${colWidths.days}%`, textAlign: 'center', fontSize: 6 }]}>
                {d}
              </Text>
            ))}
            <Text style={[styles.cellBold, { width: `${colWidths.present}%`, textAlign: 'center', backgroundColor: '#dcfce7' }]}>P</Text>
            <Text style={[styles.cellBold, { width: `${colWidths.absent}%`, textAlign: 'center', backgroundColor: '#fee2e2' }]}>A</Text>
            <Text style={[styles.cellBold, { width: `${colWidths.total}%`, textAlign: 'right' }]}>Total (₹)</Text>
          </View>

          {data.workers.map((w: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cell, { width: `${colWidths.sl}%` }]}>{idx + 1}</Text>
              <Text style={[styles.cell, { width: `${colWidths.name}%` }]}>{w.name}</Text>
              <Text style={[styles.cell, { width: `${colWidths.trade}%` }]}>{w.trade ?? '—'}</Text>
              <Text style={[styles.cellRight, { width: `${colWidths.wage}%` }]}>{formatINR(w.dailyWage)}</Text>
              {days.map(d => (
                <Text key={d} style={[styles.cell, { width: `${colWidths.days}%`, textAlign: 'center', fontSize: 6 }]}>—</Text>
              ))}
              <Text style={[styles.cell, { width: `${colWidths.present}%`, textAlign: 'center', backgroundColor: '#dcfce7' }]}>{w.present}</Text>
              <Text style={[styles.cell, { width: `${colWidths.absent}%`, textAlign: 'center', backgroundColor: '#fee2e2' }]}>{w.absent}</Text>
              <Text style={[styles.cellRight, { width: `${colWidths.total}%` }]}>{formatINR(w.totalWages)}</Text>
            </View>
          ))}

          <View style={[styles.tableRow, { backgroundColor: '#f3f4f6' }]}>
            <Text style={[styles.cellBold, { width: `${colWidths.sl + colWidths.name + colWidths.trade + colWidths.wage}%` }]}>
              TOTAL ({data.workers.length} workers)
            </Text>
            <Text style={{ width: `${colWidths.days * daysInMonth}%` }} />
            <Text style={[styles.cellBold, { width: `${colWidths.present}%`, textAlign: 'center', backgroundColor: '#bbf7d0' }]}>
              {data.workers.reduce((s: number, w: any) => s + w.present, 0)}
            </Text>
            <Text style={[styles.cellBold, { width: `${colWidths.absent}%`, textAlign: 'center', backgroundColor: '#fecaca' }]}>
              {data.workers.reduce((s: number, w: any) => s + w.absent, 0)}
            </Text>
            <Text style={[styles.cellRight, { width: `${colWidths.total}%`, backgroundColor: '#dbeafe' }]}>
              {formatINR(data.workers.reduce((s: number, w: any) => s + w.totalWages, 0))}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{data.totalWorkers}</Text>
            <Text style={styles.summaryLabel}>Total Workers</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>
              {formatINR(data.workers.reduce((s: number, w: any) => s + w.totalWages, 0))}
            </Text>
            <Text style={styles.summaryLabel}>Total Wages Payable</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{data.workers.reduce((s: number, w: any) => s + w.present, 0)}</Text>
            <Text style={styles.summaryLabel}>Total Present Days</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pespeyie Constructions — Confidential</Text>
          <Text style={styles.footerText}>This is a computer-generated document</Text>
        </View>
      </Page>
    </Document>
  )
}