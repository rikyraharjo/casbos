import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, Package, Users, Loader2 } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatRupiahShort(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`
  return amount
}

const paymentLabel = { cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS' }
const paymentStyle = {
  cash:     { background: 'rgba(62,207,142,0.1)',  color: '#3ecf8e' },
  transfer: { background: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
  qris:     { background: 'rgba(251,191,36,0.1)',  color: '#f59e0b' },
}

const statDefs = [
  { key: 'omzet',     label: 'Omzet Hari Ini',  icon: TrendingUp, color: '#3ecf8e', muted: 'rgba(62,207,142,0.12)',  sub: 'Total pendapatan hari ini' },
  { key: 'transaksi', label: 'Transaksi',         icon: ShoppingCart, color: '#818cf8', muted: 'rgba(99,102,241,0.12)',  sub: 'Transaksi hari ini' },
  { key: 'produk',    label: 'Produk Aktif',      icon: Package,    color: '#f59e0b', muted: 'rgba(251,191,36,0.12)',  sub: 'Total produk terdaftar' },
  { key: 'kasir',     label: 'Pengguna',          icon: Users,      color: '#f472b6', muted: 'rgba(244,114,182,0.12)', sub: 'Kasir & owner aktif' },
]

function CustomTooltipLine({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
      <p style={{ color: 'var(--c-text-3)' }} className="mb-1">{label}</p>
      <p className="font-semibold">{formatRupiah(payload[0].value)}</p>
    </div>
  )
}

function CustomTooltipBar({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
      <p style={{ color: 'var(--c-text-3)' }} className="mb-1">{label}</p>
      <p className="font-semibold">{formatRupiah(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { profile, tenant } = useAuthStore()
  const [stats, setStats] = useState({ omzet: 0, transaksi: 0, produk: 0, kasir: 0 })
  const [recentTrx, setRecentTrx] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenant?.id) fetchDashboard()
  }, [tenant])

  const fetchDashboard = async () => {
    setLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [trxRes, produkRes, kasirRes, recentRes, weeklyRes, topProdRes] = await Promise.all([
      supabase.from('transactions').select('total').eq('tenant_id', tenant.id).gte('created_at', today.toISOString()),
      supabase.from('products').select('id', { count: 'exact' }).eq('tenant_id', tenant.id).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('tenant_id', tenant.id).eq('is_active', true),
      supabase.from('transactions')
        .select('id, total, payment_method, cashier_name, created_at, transaction_items(qty)')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('transactions')
        .select('total, created_at')
        .eq('tenant_id', tenant.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('transaction_items')
        .select('product_name, subtotal, qty, transactions!inner(tenant_id)')
        .eq('transactions.tenant_id', tenant.id)
        .gte('created_at', sevenDaysAgo.toISOString()),
    ])

    setStats({
      omzet:     (trxRes.data || []).reduce((s, t) => s + t.total, 0),
      transaksi: trxRes.data?.length || 0,
      produk:    produkRes.count || 0,
      kasir:     kasirRes.count || 0,
    })
    setRecentTrx(recentRes.data || [])

    // Build 7-day chart data
    const dayMap = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
      dayMap[d.toISOString().slice(0, 10)] = { day: key, omzet: 0 }
    }
    for (const t of (weeklyRes.data || [])) {
      const dateKey = t.created_at.slice(0, 10)
      if (dayMap[dateKey]) dayMap[dateKey].omzet += t.total
    }
    setWeeklyData(Object.values(dayMap))

    // Build top products
    const prodMap = {}
    for (const item of (topProdRes.data || [])) {
      if (!prodMap[item.product_name]) prodMap[item.product_name] = { name: item.product_name, omzet: 0, qty: 0 }
      prodMap[item.product_name].omzet += item.subtotal
      prodMap[item.product_name].qty += item.qty
    }
    const sorted = Object.values(prodMap).sort((a, b) => b.omzet - a.omzet).slice(0, 5)
    setTopProducts(sorted)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96" style={{ color: 'var(--c-text-3)' }}>
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Memuat data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-3)' }}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}Halo, <span style={{ color: 'var(--c-text-2)' }}>{profile?.full_name}</span>
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statDefs.map(({ key, label, icon: Icon, color, muted, sub }) => (
          <div key={key} className="rounded-xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="p-2 rounded-lg w-fit mb-4" style={{ background: muted }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--c-text)' }}>
              {key === 'omzet' ? formatRupiah(stats[key]) : stats[key]}
            </p>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--c-text-2)' }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart: Omzet 7 Hari */}
        <div className="rounded-xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <h2 className="font-medium text-sm mb-4" style={{ color: 'var(--c-text)' }}>Omzet 7 Hari Terakhir</h2>
          {weeklyData.every(d => d.omzet === 0) ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: 'var(--c-text-3)' }}>
              Belum ada data transaksi
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltipLine />} cursor={{ stroke: 'var(--c-border)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="omzet" stroke="#3ecf8e" strokeWidth={2} dot={{ r: 3, fill: '#3ecf8e', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3ecf8e' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart: Top Produk */}
        <div className="rounded-xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <h2 className="font-medium text-sm mb-4" style={{ color: 'var(--c-text)' }}>Top 5 Produk Terlaris</h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-sm" style={{ color: 'var(--c-text-3)' }}>
              Belum ada data produk
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false} />
                <XAxis type="number" tickFormatter={formatRupiahShort} tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--c-text-3)' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'var(--c-overlay)' }} />
                <Bar dataKey="omzet" fill="#3ecf8e" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h2 className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>Transaksi Terbaru</h2>
          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{recentTrx.length} transaksi</span>
        </div>

        {recentTrx.length === 0 ? (
          <div className="text-center py-14">
            <ShoppingCart size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--c-text-2)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--c-text-2)' }}>Belum ada transaksi</p>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>Mulai transaksi di halaman Kasir</p>
          </div>
        ) : (
          recentTrx.map((trx, i) => {
            const totalItems = (trx.transaction_items || []).reduce((s, item) => s + item.qty, 0)
            return (
              <div
                key={trx.id}
                className="flex items-center justify-between px-5 py-3.5 transition-colors cursor-default"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border-subtle)' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--c-surface-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--c-overlay)' }}>
                    <ShoppingCart size={13} style={{ color: 'var(--c-text-3)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{trx.cashier_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                      {totalItems} item · {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-md" style={paymentStyle[trx.payment_method]}>
                    {paymentLabel[trx.payment_method]}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{formatRupiah(trx.total)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
