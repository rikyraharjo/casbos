import { useState, useEffect } from 'react'
import { Plus, Loader2, Check, X, UserCheck, UserX, Shield, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const inputStyle = {
  base: { background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text)' },
  focus: (e) => e.target.style.borderColor = 'var(--c-brand)',
  blur: (e) => e.target.style.borderColor = 'var(--c-border)',
}

export default function TimPage() {
  const { tenant, profile: currentProfile } = useAuthStore()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  const isOwner = currentProfile?.role === 'owner'

  useEffect(() => {
    if (tenant?.id) fetchMembers()
  }, [tenant])

  const fetchMembers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at')
    if (data) setMembers(data)
    setLoading(false)
  }

  const toggleActive = async (member) => {
    if (member.id === currentProfile?.id) return
    await supabase.from('profiles').update({ is_active: !member.is_active }).eq('id', member.id)
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m))
  }

  const addKasir = async () => {
    if (!form.email || !form.password || !form.full_name) return
    setSaving(true)
    setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            tenant_id: tenant.id,
            role: 'kasir',
          }
        }
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('Gagal membuat akun.')
      setShowModal(false)
      setForm({ full_name: '', email: '', password: '' })
      setTimeout(fetchMembers, 1000)
    } catch (err) {
      setError(err.message || 'Gagal menambahkan kasir.')
    } finally {
      setSaving(false)
    }
  }

  const roleIcon = (role) => role === 'owner'
    ? <Shield size={11} style={{ color: 'var(--c-brand)' }} />
    : <User size={11} style={{ color: 'var(--c-text-3)' }} />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Tim</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-3)' }}>{members.length} anggota di toko ini</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: 'var(--c-brand)', color: '#000' }}
          >
            <Plus size={14} /> Tambah Kasir
          </button>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--c-text-3)' }}>
            <Loader2 size={20} className="animate-spin mr-2" /><span className="text-sm">Memuat tim...</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                {['Nama', 'Role', 'Status', isOwner ? 'Aksi' : ''].filter(Boolean).map((h, i) => (
                  <th key={h} className={`px-5 py-3.5 text-xs font-medium uppercase tracking-widest text-left`}
                    style={{ color: 'var(--c-text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => (
                <tr key={member.id} className="transition-colors"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border-subtle)' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--c-overlay)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: member.role === 'owner' ? 'var(--c-brand)' : 'var(--c-overlay)', color: member.role === 'owner' ? '#000' : 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                        {(member.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                          {member.full_name}
                          {member.id === currentProfile?.id && (
                            <span className="ml-2 text-xs" style={{ color: 'var(--c-text-3)' }}>(Anda)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-1 rounded-md capitalize"
                      style={member.role === 'owner'
                        ? { background: 'var(--c-brand-muted)', color: 'var(--c-brand)', border: '1px solid rgba(62,207,142,0.15)' }
                        : { background: 'var(--c-overlay)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
                      }
                    >
                      {roleIcon(member.role)}{member.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-1 rounded-md"
                      style={member.is_active
                        ? { background: 'rgba(62,207,142,0.08)', color: '#3ecf8e' }
                        : { background: 'rgba(239,68,68,0.08)', color: '#f87171' }
                      }
                    >
                      {member.is_active ? <><UserCheck size={11} />Aktif</> : <><UserX size={11} />Nonaktif</>}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-5 py-3.5">
                      {member.id !== currentProfile?.id && member.role !== 'owner' && (
                        <button onClick={() => toggleActive(member)}
                          className="text-xs px-3 py-1.5 rounded-lg transition"
                          style={member.is_active
                            ? { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                            : { background: 'var(--c-brand-muted)', color: 'var(--c-brand)', border: '1px solid rgba(62,207,142,0.2)' }
                          }
                        >
                          {member.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah Kasir */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <h3 className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>Tambah Kasir</h3>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ color: 'var(--c-text-3)' }}><X size={16} /></button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {[
                { label: 'Nama Lengkap', key: 'full_name', type: 'text', placeholder: 'Nama kasir' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'email@contoh.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 karakter' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--c-text-2)' }}>{label}</label>
                  <input type={type} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                    style={inputStyle.base} onFocus={inputStyle.focus} onBlur={inputStyle.blur}
                  />
                </div>
              ))}
              {error && (
                <div className="px-3.5 py-2.5 rounded-lg text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}
              <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                Kasir akan bisa login dengan email dan password ini.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => { setShowModal(false); setError('') }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                style={{ background: 'transparent', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}
              >Batal</button>
              <button onClick={addKasir} disabled={saving || !form.email || !form.password || !form.full_name}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: 'var(--c-brand)', color: '#000' }}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Tambah Kasir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
