import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return }
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Gagal reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--c-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
            <span className="text-black text-sm font-black">C</span>
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'var(--c-text)' }}>CasBos</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--c-brand-muted)', border: '1px solid rgba(62,207,142,0.3)' }}>
              <Check size={24} style={{ color: 'var(--c-brand)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--c-text)' }}>Password Diperbarui!</h2>
            <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
              Kamu akan diarahkan ke halaman masuk...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Reset Password</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>Masukkan password baru kamu</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm outline-none transition"
                    style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--c-brand)'}
                    onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                  />
                  <button type="button" onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--c-text-3)' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--c-text-2)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm"
                  style={{ background: 'var(--c-danger-muted)', border: '1px solid var(--c-danger-border)', color: 'var(--c-danger-text)' }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--c-danger-text)' }} />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--c-brand)', color: '#000' }}
                onMouseOver={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
