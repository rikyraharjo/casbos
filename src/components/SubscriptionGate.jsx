import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export default function SubscriptionGate({ children }) {
  const { tenant } = useAuthStore()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ok | expired

  useEffect(() => {
    if (tenant?.id) checkSubscription()
  }, [tenant])

  const checkSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at, period_end')
      .eq('tenant_id', tenant.id)
      .single()

    if (!data) { setStatus('ok'); return }

    const now = new Date()

    if (data.status === 'active' && new Date(data.period_end) > now) {
      setStatus('ok')
    } else if (data.status === 'trial' && new Date(data.trial_ends_at) > now) {
      setStatus('ok')
    } else {
      setStatus('expired')
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: 'var(--c-text-3)' }}>
        <Loader2 size={20} className="animate-spin" />
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6" style={{ background: 'var(--c-bg)' }}>
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={24} style={{ color: '#f87171' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--c-text)' }}>
            Akses Terbatas
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            Trial atau langganan kamu sudah berakhir. Pilih paket untuk melanjutkan menggunakan CasBos.
          </p>
          <button
            onClick={() => navigate('/app/billing')}
            className="w-full py-3 rounded-xl font-bold text-sm transition"
            style={{ background: 'var(--c-brand)', color: '#000' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Lihat Paket & Harga
          </button>
        </div>
      </div>
    )
  }

  return children
}
