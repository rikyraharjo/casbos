import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'

const inputStyle = {
  background: 'var(--c-overlay)',
  border: '1px solid var(--c-border)',
  color: 'var(--c-text)',
}

function Input({ label, type = 'text', value, onChange, placeholder, required, rightEl }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--c-text-2)' }}>{label}</label>
      <div className="relative">
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
          style={{ ...inputStyle, borderColor: focused ? 'var(--c-brand)' : 'var(--c-border)', paddingRight: rightEl ? '2.75rem' : undefined }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
    </div>
  )
}

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <Input
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      rightEl={
        <button type="button" onClick={() => setShow(v => !v)} style={{ color: 'var(--c-text-3)' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--c-text-2)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot' | 'success' | 'forgot-sent'
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, fetchProfile } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register')
  }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user } = await signIn(form.email, form.password)
      await fetchProfile(user.id)
      navigate('/app/dashboard')
    } catch {
      setError('Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Nama lengkap wajib diisi.'); return }
    if (form.password.length < 6) { setError('Password minimal 6 karakter.'); return }
    setError('')
    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } }
      })
      if (signUpError) throw signUpError
      setMode('success')
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!form.email) { setError('Masukkan email kamu.'); return }
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) throw err
      setMode('forgot-sent')
    } catch (err) {
      setError(err.message || 'Gagal mengirim email reset.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => { setMode(m); setError(''); setForm({ full_name: '', email: '', password: '' }) }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--c-bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-14 border-r"
        style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
            <span className="text-black text-sm font-black">C</span>
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'var(--c-text)' }}>CasBos</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-snug mb-4" style={{ color: 'var(--c-text)' }}>
            Sistem Kasir<br />Modern untuk<br />Bisnis Anda
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--c-text-2)' }}>
            Mudah dipakai, harga terjangkau,<br />laporan otomatis via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-8">
          {[
            { value: '5 Menit', label: 'Waktu Setup' },
            { value: 'Multi User', label: 'Kasir & Owner' },
            { value: 'Realtime', label: 'Laporan WA' },
          ].map(({ value, label }, i, arr) => (
            <div key={label} className="flex items-center gap-8">
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--c-text)' }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>{label}</p>
              </div>
              {i < arr.length - 1 && <div className="w-px h-8" style={{ background: 'var(--c-border)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
              <span className="text-black text-sm font-black">C</span>
            </div>
            <span className="font-semibold tracking-tight" style={{ color: 'var(--c-text)' }}>CasBos</span>
          </div>

          {/* Success: register */}
          {mode === 'success' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'var(--c-brand-muted)', border: '1px solid rgba(62,207,142,0.3)' }}>
                <Check size={24} style={{ color: 'var(--c-brand)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--c-text)' }}>Pendaftaran Berhasil!</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--c-text-2)' }}>
                Cek email <strong style={{ color: 'var(--c-text)' }}>{form.email}</strong> dan klik link konfirmasi untuk mengaktifkan akun.
              </p>
              <button onClick={() => switchMode('login')}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition"
                style={{ background: 'var(--c-brand)', color: '#000' }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >Kembali ke Halaman Masuk</button>
            </div>
          )}

          {/* Success: forgot */}
          {mode === 'forgot-sent' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'var(--c-brand-muted)', border: '1px solid rgba(62,207,142,0.3)' }}>
                <Check size={24} style={{ color: 'var(--c-brand)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--c-text)' }}>Email Terkirim!</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--c-text-2)' }}>
                Cek email <strong style={{ color: 'var(--c-text)' }}>{form.email}</strong> dan klik link untuk reset password.
              </p>
              <button onClick={() => switchMode('login')}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition"
                style={{ background: 'var(--c-brand)', color: '#000' }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >Kembali ke Halaman Masuk</button>
            </div>
          )}

          {/* Login / Register / Forgot forms */}
          {['login', 'register', 'forgot'].includes(mode) && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>
                  {mode === 'login' ? 'Masuk' : mode === 'register' ? 'Buat Akun' : 'Lupa Password'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--c-text-2)' }}>
                  {mode === 'login' ? 'Selamat datang kembali'
                    : mode === 'register' ? 'Daftar gratis, siap dalam 5 menit'
                    : 'Masukkan email untuk reset password'}
                </p>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}
                className="space-y-4">
                {mode === 'register' && (
                  <Input label="Nama Lengkap" value={form.full_name} onChange={set('full_name')}
                    placeholder="Nama pemilik toko" required />
                )}
                <Input label="Email" type="email" value={form.email} onChange={set('email')}
                  placeholder="nama@email.com" required />
                {mode !== 'forgot' && (
                  <PasswordInput label="Password" value={form.password} onChange={set('password')}
                    placeholder={mode === 'register' ? 'Min. 6 karakter' : 'Masukkan password'} />
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => switchMode('forgot')}
                      className="text-xs transition"
                      style={{ color: 'var(--c-text-3)' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--c-brand)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
                    >Lupa password?</button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm"
                    style={{ background: 'var(--c-danger-muted)', border: '1px solid var(--c-danger-border)', color: 'var(--c-danger-text)' }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--c-danger-text)' }} />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--c-brand)', color: '#000' }}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? 'Memproses...'
                    : mode === 'login' ? 'Masuk'
                    : mode === 'register' ? 'Buat Akun Gratis'
                    : 'Kirim Link Reset'}
                </button>
              </form>

              <p className="text-center text-sm mt-6" style={{ color: 'var(--c-text-3)' }}>
                {mode === 'login' ? (
                  <>Belum punya akun?{' '}
                    <button onClick={() => switchMode('register')} className="font-medium transition"
                      style={{ color: 'var(--c-brand)' }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >Daftar gratis</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => switchMode('login')} className="font-medium transition"
                      style={{ color: 'var(--c-brand)' }}
                      onMouseOver={e => e.currentTarget.style.opacity = '0.75'}
                      onMouseOut={e => e.currentTarget.style.opacity = '1'}
                    >Kembali ke halaman masuk</button>
                  </>
                )}
              </p>
            </>
          )}

          <p className="text-center text-xs mt-10" style={{ color: 'var(--c-text-3)' }}>
            &copy; {new Date().getFullYear()} CasBos
          </p>
        </div>
      </div>
    </div>
  )
}
