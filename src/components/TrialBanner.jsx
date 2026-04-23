import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export default function TrialBanner() {
  const { tenant, profile } = useAuthStore()
  const navigate = useNavigate()
  const [daysLeft, setDaysLeft] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (tenant?.id) checkTrial()
  }, [tenant])

  const checkTrial = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('tenant_id', tenant.id)
      .single()

    if (data?.status === 'trial' && data?.trial_ends_at) {
      const days = Math.ceil((new Date(data.trial_ends_at) - new Date()) / 86400000)
      if (days <= 7) setDaysLeft(Math.max(0, days))
    }
  }

  if (daysLeft === null || dismissed) return null

  const isUrgent = daysLeft <= 3
  const isOwner = profile?.role === 'owner'

  return (
    <div className="px-5 py-2.5 flex items-center justify-between gap-4 text-sm"
      style={{
        background: isUrgent ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
        borderBottom: `1px solid ${isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`,
      }}>
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={14} style={{ color: isUrgent ? '#f87171' : '#f59e0b', flexShrink: 0 }} />
        <span style={{ color: isUrgent ? '#f87171' : '#f59e0b' }}>
          {daysLeft === 0
            ? 'Trial kamu berakhir hari ini.'
            : `Trial berakhir dalam ${daysLeft} hari.`}
          {isOwner && (
            <button onClick={() => navigate('/app/billing')}
              className="ml-2 font-semibold underline underline-offset-2 transition opacity-90 hover:opacity-100">
              Upgrade sekarang
            </button>
          )}
        </span>
      </div>
      <button onClick={() => setDismissed(true)} style={{ color: isUrgent ? '#f87171' : '#f59e0b', flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  )
}
