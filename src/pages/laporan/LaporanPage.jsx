import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, ArrowDownToLine, Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

function formatRupiah(a) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(a)
}

const paymentLabel = { cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS' }
const paymentStyle = {
  cash:     { background: 'rgba(62,207,142,0.1)',  color: '#3ecf8e' },
  transfer: { background: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
  qris:     { background: 'rgba(251,191,36,0.1)',  color: '#f59e0b' },
}

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const PRESETS = [
  { label: 'Hari Ini', getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return { from: d, to: new Date() } } },
  { label: '7 Hari',   getValue: () => { const d = new Date(); d.setDate(d.getDate()-6); d.setHours(0,0,0,0); return { from: d, to: new Date() } } },
  { label: '30 Hari',  getValue: () => { const d = new Date(); d.setDate(d.getDate()-29); d.setHours(0,0,0,0); return { from: d, to: new Date() } } },
]

function getMonthRange(year, month) {
  const from = new Date(year, month, 1)
  const to   = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { from, to }
}

export default function LaporanPage() {
  const { tenant } = useAuthStore()

  // mode: 'preset' | 'month'
  const [mode, setMode]               = useState('preset')
  const [activePreset, setActivePreset] = useState(0)

  const now = new Date()
  const [selYear, setSelYear]   = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth())

  const [transactions, setTransactions] = useState([])
  const [topProducts, setTopProducts]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState({ omzet: 0, count: 0, avg: 0 })

  useEffect(() => {
    if (tenant?.id) fetchData()
  }, [tenant, mode, activePreset, selYear, selMonth])

  const getRange = () => {
    if (mode === 'month') return getMonthRange(selYear, selMonth)
    return PRESETS[activePreset].getValue()
  }

  const fetchData = async () => {
    setLoading(true)
    const { from, to } = getRange()

    const { data } = await supabase
      .from('transactions')
      .select('*, transaction_items(product_name, qty, subtotal)')
      .eq('tenant_id', tenant.id)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data)
      const omzet = data.reduce((s, t) => s + t.total, 0)
      setStats({ omzet, count: data.length, avg: data.length ? Math.round(omzet / data.length) : 0 })

      const productMap = {}
      data.forEach(t => {
        ;(t.transaction_items || []).forEach(item => {
          if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 }
          productMap[item.product_name].qty += item.qty
          productMap[item.product_name].revenue += item.subtotal
        })
      })
      setTopProducts(
        Object.entries(productMap)
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      )
    }
    setLoading(false)
  }

  const prevMonth = () => {
    if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1) }
    else setSelMonth(m => m - 1)
  }
  const nextMonth = () => {
    const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth()
    if (isCurrentMonth) return
    if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1) }
    else setSelMonth(m => m + 1)
  }

  const periodLabel = () => {
    if (mode === 'month') return `${BULAN[selMonth]} ${selYear}`
    return PRESETS[activePreset].label
  }

  const exportPDF = () => {
    const { from, to } = getRange()
    const dateRange = mode === 'month'
      ? `${BULAN[selMonth]} ${selYear}`
      : `${from.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – ${to.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`

    const topProductsRows = topProducts.map((p, i) => `
      <tr>
        <td>#${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.qty} terjual</td>
        <td style="text-align:right">${formatRupiah(p.revenue)}</td>
      </tr>`).join('')

    const trxRows = transactions.map(trx => {
      const totalItems = (trx.transaction_items || []).reduce((s, it) => s + it.qty, 0)
      return `
      <tr>
        <td>${new Date(trx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${trx.cashier_name}</td>
        <td>${totalItems} item</td>
        <td>${paymentLabel[trx.payment_method] || trx.payment_method}</td>
        <td style="text-align:right">${formatRupiah(trx.total)}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Laporan ${dateRange}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 28px; }
    .stat { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
    .stat-val { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .stat-label { font-size: 11px; color: #666; }
    h2 { font-size: 13px; font-weight: 600; margin-bottom: 10px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 8px 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: center; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Laporan Penjualan</h1>
  <p class="subtitle">Periode: ${dateRange} &nbsp;·&nbsp; Dicetak: ${new Date().toLocaleString('id-ID')}</p>

  <div class="stats">
    <div class="stat">
      <div class="stat-val">${formatRupiah(stats.omzet)}</div>
      <div class="stat-label">Total Omzet</div>
    </div>
    <div class="stat">
      <div class="stat-val">${stats.count}</div>
      <div class="stat-label">Total Transaksi</div>
    </div>
    <div class="stat">
      <div class="stat-val">${formatRupiah(stats.avg)}</div>
      <div class="stat-label">Rata-rata / Transaksi</div>
    </div>
  </div>

  ${topProducts.length > 0 ? `
  <h2>Produk Terlaris</h2>
  <table>
    <thead><tr><th>#</th><th>Produk</th><th>Qty</th><th style="text-align:right">Omzet</th></tr></thead>
    <tbody>${topProductsRows}</tbody>
  </table>` : ''}

  <h2>Riwayat Transaksi (${transactions.length})</h2>
  <table>
    <thead><tr><th>Waktu</th><th>Kasir</th><th>Items</th><th>Metode</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${trxRows}</tbody>
  </table>

  <p class="footer">Dibuat oleh CasBos &nbsp;·&nbsp; casbos.com</p>
</body>
</html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    w.onload = () => { w.print() }
  }

  const isNextMonthDisabled = selYear === now.getFullYear() && selMonth === now.getMonth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Laporan</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-3)' }}>Ringkasan penjualan — {periodLabel()}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset buttons */}
          {PRESETS.map((p, i) => (
            <button key={p.label}
              onClick={() => { setMode('preset'); setActivePreset(i) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={mode === 'preset' && activePreset === i
                ? { background: 'var(--c-brand)', color: '#000', border: '1px solid var(--c-brand)' }
                : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
              }
            >{p.label}</button>
          ))}

          {/* Month picker */}
          <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
            <button onClick={() => { setMode('month'); prevMonth() }}
              className="px-2 py-1.5 transition"
              style={{ color: 'var(--c-text-3)', background: 'var(--c-surface)' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--c-text)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
            ><ChevronLeft size={13} /></button>
            <button
              onClick={() => setMode('month')}
              className="px-2.5 py-1.5 text-xs font-medium transition"
              style={mode === 'month'
                ? { background: 'var(--c-brand)', color: '#000' }
                : { background: 'var(--c-surface)', color: 'var(--c-text-2)' }
              }
            >{BULAN[selMonth].slice(0,3)} {selYear}</button>
            <button onClick={() => { setMode('month'); nextMonth() }}
              disabled={isNextMonthDisabled}
              className="px-2 py-1.5 transition disabled:opacity-30"
              style={{ color: 'var(--c-text-3)', background: 'var(--c-surface)' }}
              onMouseOver={e => { if (!isNextMonthDisabled) e.currentTarget.style.color = 'var(--c-text)' }}
              onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
            ><ChevronRight size={13} /></button>
          </div>

          {/* Export PDF */}
          <button
            onClick={exportPDF}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40"
            style={{ background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-text-3)'; e.currentTarget.style.color = 'var(--c-text)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-2)' }}
          >
            <FileText size={13} />
            Export PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--c-text-3)' }}>
          <Loader2 size={20} className="animate-spin mr-2" /><span className="text-sm">Memuat laporan...</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Omzet', value: formatRupiah(stats.omzet), icon: TrendingUp, color: '#3ecf8e', muted: 'rgba(62,207,142,0.1)' },
              { label: 'Total Transaksi', value: stats.count, icon: ShoppingCart, color: '#818cf8', muted: 'rgba(99,102,241,0.1)' },
              { label: 'Rata-rata / Transaksi', value: formatRupiah(stats.avg), icon: ArrowDownToLine, color: '#f59e0b', muted: 'rgba(251,191,36,0.1)' },
            ].map(({ label, value, icon: Icon, color, muted }) => (
              <div key={label} className="rounded-xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <div className="p-2 rounded-lg w-fit mb-3" style={{ background: muted }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction Table */}
            <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <h2 className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Riwayat Transaksi</h2>
                <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{transactions.length} transaksi</span>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-14">
                  <ShoppingCart size={28} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--c-text-2)' }} />
                  <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Belum ada transaksi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                        {['Waktu', 'Kasir', 'Items', 'Metode', 'Total'].map((h, i) => (
                          <th key={h} className={`px-4 py-3 text-xs font-medium uppercase tracking-widest ${i === 4 ? 'text-right' : 'text-left'}`}
                            style={{ color: 'var(--c-text-3)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((trx, i) => {
                        const totalItems = (trx.transaction_items || []).reduce((s, it) => s + it.qty, 0)
                        return (
                          <tr key={trx.id} className="transition-colors"
                            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border-subtle)' }}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--c-overlay)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--c-text-2)' }}>
                              {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              <br />
                              <span style={{ color: 'var(--c-text-3)', fontSize: '10px' }}>
                                {new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm" style={{ color: 'var(--c-text)' }}>{trx.cashier_name}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--c-text-2)' }}>{totalItems} item</td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-medium px-2 py-1 rounded-md" style={paymentStyle[trx.payment_method]}>
                                {paymentLabel[trx.payment_method]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                              {formatRupiah(trx.total)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <h2 className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>Produk Terlaris</h2>
              </div>
              {topProducts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>Belum ada data</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-5 shrink-0" style={{ color: i === 0 ? 'var(--c-brand)' : 'var(--c-text-3)' }}>
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--c-text)' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>{p.qty} terjual</p>
                      </div>
                      <p className="text-xs font-semibold shrink-0" style={{ color: 'var(--c-brand)' }}>{formatRupiah(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
