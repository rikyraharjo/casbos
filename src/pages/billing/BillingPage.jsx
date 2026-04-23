import { useState, useEffect } from 'react'
import { Check, Loader2, ChevronRight, AlertTriangle, Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 99000,
    priceStr: 'Rp 99.000',
    period: '/bulan',
    desc: 'Untuk usaha yang baru mulai digital',
    features: [
      '1 toko',
      'Hingga 3 akun kasir',
      'Produk & stok tidak terbatas',
      'Riwayat transaksi lengkap',
      'Struk digital & cetak',
    ],
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 199000,
    priceStr: 'Rp 199.000',
    period: '/bulan',
    desc: 'Pantau toko dari mana saja',
    features: [
      '1 toko',
      'Kasir tidak terbatas',
      'Produk & stok tidak terbatas',
      'Riwayat transaksi lengkap',
      'Struk digital & cetak',
      'Laporan WA otomatis setiap hari',
      'Export laporan ke CSV',
    ],
    highlight: true,
  },
]

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export default function BillingPage() {
  const { tenant, profile } = useAuthStore()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)

  const isOwner = profile?.role === 'owner'

  useEffect(() => {
    if (tenant?.id) fetchSubscription()
  }, [tenant])

  const fetchSubscription = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single()
    setSubscription(data)
    setLoading(false)
  }

  const handlePay = async (planKey) => {
    setPaying(planKey)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: planKey }),
        },
      )

      const data = await res.json()
      console.log('create-payment response:', data)
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      if (!data.token) throw new Error('Token tidak diterima dari server. Cek logs Edge Function.')

      // Load Midtrans Snap
      const snapUrl = data.is_production
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js'

      await loadSnapScript(snapUrl, data.client_key)

      window.snap.pay(data.token, {
        onSuccess: () => { fetchSubscription() },
        onPending: () => { fetchSubscription() },
        onError: (err) => { console.error(err) },
        onClose: () => {},
      })
    } catch (err) {
      alert(err.message || 'Gagal membuat pembayaran')
    } finally {
      setPaying(null)
    }
  }

  const loadSnapScript = (url, clientKey) => new Promise((resolve, reject) => {
    if (document.querySelector('#midtrans-snap')) { resolve(); return }
    const script = document.createElement('script')
    script.id = 'midtrans-snap'
    script.src = url
    script.setAttribute('data-client-key', clientKey)
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

  const statusColor = {
    trial: { bg: 'rgba(251,191,36,0.08)', color: '#f59e0b', border: 'rgba(251,191,36,0.2)' },
    active: { bg: 'rgba(62,207,142,0.08)', color: '#3ecf8e', border: 'rgba(62,207,142,0.2)' },
    expired: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
    cancelled: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  }

  const statusLabel = { trial: 'Trial', active: 'Aktif', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan' }

  const daysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / 86400000))
    : null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Billing & Langganan</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-3)' }}>Kelola paket langganan CasBos kamu</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--c-text-3)' }}>
          <Loader2 size={20} className="animate-spin mr-2" /><span className="text-sm">Memuat...</span>
        </div>
      ) : (
        <>
          {/* Status Card */}
          {subscription && (
            <div className="rounded-xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--c-text-3)' }}>
                    Status Langganan
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold capitalize" style={{ color: 'var(--c-text)' }}>
                      {subscription.plan === 'trial' ? 'Trial' : `Paket ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}`}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: statusColor[subscription.status]?.bg,
                        color: statusColor[subscription.status]?.color,
                        border: `1px solid ${statusColor[subscription.status]?.border}`,
                      }}>
                      {statusLabel[subscription.status]}
                    </span>
                  </div>

                  {subscription.status === 'trial' && daysLeft !== null && (
                    <div className="flex items-center gap-2 mt-3 text-sm">
                      {daysLeft <= 3
                        ? <AlertTriangle size={14} style={{ color: '#f87171' }} />
                        : <Shield size={14} style={{ color: '#f59e0b' }} />
                      }
                      <span style={{ color: daysLeft <= 3 ? '#f87171' : 'var(--c-text-2)' }}>
                        {daysLeft > 0
                          ? `Trial berakhir dalam ${daysLeft} hari (${formatDate(subscription.trial_ends_at)})`
                          : 'Trial sudah berakhir'
                        }
                      </span>
                    </div>
                  )}

                  {subscription.status === 'active' && (
                    <p className="text-sm mt-2" style={{ color: 'var(--c-text-2)' }}>
                      Aktif hingga <strong>{formatDate(subscription.period_end)}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plan Cards */}
          {isOwner && (subscription?.status === 'trial' || subscription?.status === 'expired' || subscription?.status === 'active') && (
            <div>
              <p className="text-sm font-medium mb-4" style={{ color: 'var(--c-text-2)' }}>
                {subscription?.status === 'active' ? 'Perpanjang atau ganti paket:' : 'Pilih paket untuk melanjutkan:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLANS.map((plan) => (
                  <div key={plan.key} className="rounded-xl relative"
                    style={{
                      background: 'var(--c-surface)',
                      border: plan.highlight ? '2px solid var(--c-brand)' : '1px solid var(--c-border)',
                    }}>
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: 'var(--c-brand)', color: '#000' }}>
                        Paling Populer
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                        style={{ color: plan.highlight ? 'var(--c-brand)' : 'var(--c-text-3)' }}>
                        {plan.name}
                      </p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-bold" style={{ color: 'var(--c-text)' }}>{plan.priceStr}</span>
                        <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>{plan.period}</span>
                      </div>
                      <p className="text-xs mb-5" style={{ color: 'var(--c-text-3)' }}>{plan.desc}</p>

                      <button
                        onClick={() => handlePay(plan.key)}
                        disabled={!!paying}
                        className="w-full py-2.5 rounded-lg text-sm font-bold transition mb-5 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={plan.highlight
                          ? { background: 'var(--c-brand)', color: '#000' }
                          : { border: '1px solid var(--c-border)', color: 'var(--c-text-2)', background: 'transparent' }
                        }
                        onMouseOver={e => plan.highlight
                          ? e.currentTarget.style.opacity = '0.85'
                          : e.currentTarget.style.borderColor = 'var(--c-text-3)'}
                        onMouseOut={e => plan.highlight
                          ? e.currentTarget.style.opacity = '1'
                          : e.currentTarget.style.borderColor = 'var(--c-border)'}
                      >
                        {paying === plan.key
                          ? <Loader2 size={14} className="animate-spin" />
                          : <ChevronRight size={14} />
                        }
                        {paying === plan.key ? 'Memproses...' : `Pilih ${plan.name}`}
                      </button>

                      <div className="space-y-2">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs">
                            <Check size={12} className="shrink-0" style={{ color: 'var(--c-brand)' }} />
                            <span style={{ color: 'var(--c-text-2)' }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isOwner && (
            <div className="rounded-xl p-5 text-sm" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}>
              Hanya owner yang dapat mengelola langganan. Hubungi pemilik toko untuk informasi lebih lanjut.
            </div>
          )}
        </>
      )}
    </div>
  )
}
