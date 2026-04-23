import { useState, useEffect, useRef } from 'react'
import { Check, Loader2, Store, User, Phone, MapPin, MessageCircle, Upload, QrCode, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const inputStyle = {
  base: { background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text)' },
  focus: (e) => e.target.style.borderColor = 'var(--c-brand)',
  blur: (e) => e.target.style.borderColor = 'var(--c-border)',
}

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      {Icon && (
        <div className="p-2.5 rounded-lg shrink-0" style={{ background: 'var(--c-brand-muted)' }}>
          <Icon size={18} style={{ color: 'var(--c-brand)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold" style={{ color: 'var(--c-text)' }}>{title}</h2>
        {description && <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>{description}</p>}
      </div>
    </div>
  )
}

function Section({ children }) {
  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      {children}
    </div>
  )
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--c-text-2)' }}>
        {Icon && <Icon size={12} style={{ color: 'var(--c-text-3)' }} />}
        {label}
      </label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { tenant, profile, setTenant, setProfile } = useAuthStore()

  const [tokoForm, setTokoForm] = useState({ name: '', address: '', phone: '', whatsapp_number: '' })
  const [profileForm, setProfileForm] = useState({ full_name: '' })
  const [printSize, setPrintSize] = useState('80mm')
  const [savingToko, setSavingToko] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrint, setSavingPrint] = useState(false)
  const [successToko, setSuccessToko] = useState(false)
  const [successProfile, setSuccessProfile] = useState(false)
  const [successPrint, setSuccessPrint] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [uploadingQris, setUploadingQris] = useState(false)
  const qrisInputRef = useRef(null)

  useEffect(() => {
    if (tenant) {
      setTokoForm({ name: tenant.name || '', address: tenant.address || '', phone: tenant.phone || '', whatsapp_number: tenant.whatsapp_number || '' })
      setPrintSize(tenant.print_size || '80mm')
    }
    if (profile) setProfileForm({ full_name: profile.full_name || '' })
  }, [tenant, profile])

  const saveToko = async () => {
    setSavingToko(true)
    try {
      const { data, error } = await supabase.from('tenants').update(tokoForm).eq('id', tenant.id).select().single()
      if (error) throw error
      setTenant(data)
      setSuccessToko(true)
      setTimeout(() => setSuccessToko(false), 2000)
    } finally { setSavingToko(false) }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { data, error } = await supabase.from('profiles').update({ full_name: profileForm.full_name }).eq('id', profile.id).select().single()
      if (error) throw error
      setProfile(data)
      setSuccessProfile(true)
      setTimeout(() => setSuccessProfile(false), 2000)
    } finally { setSavingProfile(false) }
  }

  const savePrintSize = async () => {
    setSavingPrint(true)
    try {
      const { data, error } = await supabase.from('tenants').update({ print_size: printSize }).eq('id', tenant.id).select().single()
      if (error) throw error
      setTenant(data)
      setSuccessPrint(true)
      setTimeout(() => setSuccessPrint(false), 2000)
    } finally { setSavingPrint(false) }
  }

  const uploadQris = async (file) => {
    if (!file) return
    setUploadingQris(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${tenant.id}/qris.${ext}`
      const { error: upErr } = await supabase.storage.from('qris').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('qris').getPublicUrl(path)
      const { data, error } = await supabase.from('tenants').update({ qris_image_url: publicUrl }).eq('id', tenant.id).select().single()
      if (error) throw error
      setTenant(data)
    } catch (e) {
      alert('Gagal upload: ' + e.message)
    } finally {
      setUploadingQris(false)
    }
  }

  const isOwner = profile?.role === 'owner'

  return (
    <div className="max-w-3xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text)' }}>Pengaturan</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-text-3)' }}>Kelola informasi toko, profil, dan preferensi aplikasi</p>
      </div>

      {/* Informasi Toko */}
      {isOwner && (
        <Section>
          <SectionHeader
            icon={Store}
            title="Informasi Toko"
            description="Data toko yang akan ditampilkan di struk dan aplikasi"
          />
          <div className="space-y-4">
            <Field label="Nama Toko">
              <input type="text" value={tokoForm.name}
                onChange={e => setTokoForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Masukkan nama toko"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                style={inputStyle.base} onFocus={inputStyle.focus} onBlur={inputStyle.blur}
              />
            </Field>
            <Field label="Alamat">
              <input type="text" value={tokoForm.address}
                onChange={e => setTokoForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Alamat toko (opsional)"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                style={inputStyle.base} onFocus={inputStyle.focus} onBlur={inputStyle.blur}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. Telepon">
                <input type="text" value={tokoForm.phone}
                  onChange={e => setTokoForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="08xx-xxxx-xxxx"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                  style={inputStyle.base} onFocus={inputStyle.focus} onBlur={inputStyle.blur}
                />
              </Field>
              <Field label="Nomor WhatsApp">
                <input type="text" value={tokoForm.whatsapp_number}
                  onChange={e => setTokoForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                  placeholder="628xx-xxxx-xxxx"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                  style={inputStyle.base} onFocus={inputStyle.focus} onBlur={inputStyle.blur}
                />
              </Field>
            </div>
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--c-overlay)', color: 'var(--c-text-3)' }}>
              💡 Nomor WhatsApp untuk menerima laporan harian otomatis. Format: <code>628xxxxxxxxxx</code>
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={saveToko} disabled={savingToko}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ background: successToko ? 'rgba(62,207,142,0.15)' : 'var(--c-brand)', color: successToko ? 'var(--c-brand)' : '#000', border: successToko ? '1px solid rgba(62,207,142,0.3)' : 'none' }}
              >
                {savingToko ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {successToko ? 'Tersimpan!' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* Profil Saya */}
      <Section>
        <SectionHeader
          icon={User}
          title="Profil Saya"
          description="Informasi akun yang digunakan untuk login"
        />
        <div className="space-y-4">
          <Field label="Nama Lengkap">
            <input type="text" value={profileForm.full_name}
              onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Nama lengkap Anda"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
              style={inputStyle.base} onFocus={inputStyle.focus} onBlur={inputStyle.blur}
            />
          </Field>
          <Field label="Role">
            <div className="px-3.5 py-2.5 rounded-lg text-sm capitalize font-medium" style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}>
              {profile?.role}
            </div>
          </Field>
          <div className="flex justify-end pt-2">
            <button onClick={saveProfile} disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              style={{ background: successProfile ? 'rgba(62,207,142,0.15)' : 'var(--c-brand)', color: successProfile ? 'var(--c-brand)' : '#000', border: successProfile ? '1px solid rgba(62,207,142,0.3)' : 'none' }}
            >
              {savingProfile ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {successProfile ? 'Tersimpan!' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </Section>

      {/* Pengaturan Struk */}
      {isOwner && (
        <Section>
          <SectionHeader
            icon={Printer}
            title="Pengaturan Struk"
            description="Atur ukuran kertas untuk printer thermal"
          />
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--c-text-2)' }}>Ukuran Kertas Thermal</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '58mm', label: '58mm (2 inch)', desc: 'Printer thermal kecil' },
                  { value: '80mm', label: '80mm (3 inch)', desc: 'Printer thermal standar' },
                ].map(opt => (
                  <button key={opt.value}
                    onClick={() => setPrintSize(opt.value)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={printSize === opt.value
                      ? { background: 'var(--c-brand-muted)', border: '2px solid var(--c-brand)' }
                      : { background: 'var(--c-overlay)', border: '1px solid var(--c-border)' }
                    }
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: printSize === opt.value ? 'var(--c-brand)' : 'var(--c-border)' }}>
                        {printSize === opt.value && (
                          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--c-brand)' }} />
                        )}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: printSize === opt.value ? 'var(--c-brand)' : 'var(--c-text)' }}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs ml-6" style={{ color: 'var(--c-text-3)' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--c-overlay)', color: 'var(--c-text-3)' }}>
              💡 Pilih ukuran sesuai printer thermal yang kamu gunakan. Pengaturan ini berlaku untuk semua cetak struk.
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={savePrintSize} disabled={savingPrint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                style={{ background: successPrint ? 'rgba(62,207,142,0.15)' : 'var(--c-brand)', color: successPrint ? 'var(--c-brand)' : '#000', border: successPrint ? '1px solid rgba(62,207,142,0.3)' : 'none' }}
              >
                {savingPrint ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {successPrint ? 'Tersimpan!' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* QRIS & Self-Order */}
      {isOwner && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>
              Fitur Self-Order
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
          </div>

          {/* QRIS Toko */}
          <Section>
            <SectionHeader
              icon={QrCode}
              title="QRIS Toko"
              description="Upload QR code untuk pembayaran digital"
            />
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="shrink-0 w-36 h-36 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ border: '1px solid var(--c-border)', background: 'var(--c-overlay)' }}>
                {tenant?.qris_image_url
                  ? <img src={tenant.qris_image_url} alt="QRIS" className="w-full h-full object-contain p-1" />
                  : <div className="flex flex-col items-center gap-2 opacity-40">
                      <QrCode size={32} style={{ color: 'var(--c-text-2)' }} />
                      <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>Belum ada</p>
                    </div>
                }
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                  Upload screenshot QRIS dari aplikasi bank/e-wallet. Pelanggan akan scan QR ini saat memilih bayar QRIS di halaman order.
                </p>
                <input ref={qrisInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => uploadQris(e.target.files[0])} />
                <button
                  onClick={() => qrisInputRef.current.click()}
                  disabled={uploadingQris}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-text-3)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
                >
                  {uploadingQris
                    ? <><Loader2 size={13} className="animate-spin" /> Mengupload...</>
                    : <><Upload size={13} /> {tenant?.qris_image_url ? 'Ganti Gambar' : 'Upload Gambar'}</>
                  }
                </button>
              </div>
            </div>
          </Section>

          {/* QR Self-Order */}
          {tenant?.order_code && (
            <Section>
              <SectionHeader
                title="QR Self-Order"
                description="Pelanggan scan QR ini untuk pesan langsung dari HP"
              />
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="shrink-0 p-3 rounded-xl" style={{ background: '#fff', border: '1px solid var(--c-border)' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/order/' + tenant.order_code)}`}
                    alt="QR Self-Order" width={160} height={160}
                  />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--c-text-3)' }}>Link Order</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate"
                        style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}>
                        {window.location.origin}/order/{tenant.order_code}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/order/${tenant.order_code}`)
                          setCopiedLink(true)
                          setTimeout(() => setCopiedLink(false), 2000)
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition shrink-0"
                        style={copiedLink
                          ? { background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.3)', color: 'var(--c-brand)' }
                          : { background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }
                        }
                      >{copiedLink ? '✓ Disalin!' : 'Salin'}</button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const w = window.open('', '_blank')
                      w.document.write(`<html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Arial">
                        <div style="text-align:center">
                          <p style="font-size:18px;font-weight:700;margin-bottom:8px">${tenant.name}</p>
                          <p style="font-size:13px;color:#666;margin-bottom:16px">Scan untuk pesan</p>
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/order/' + tenant.order_code)}" width="250" height="250" />
                        </div>
                      </body></html>`)
                      w.document.close()
                      w.onload = () => w.print()
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={{ background: 'var(--c-brand)', color: '#000' }}
                  >
                    <Printer size={13} />
                    Print QR Code
                  </button>
                </div>
              </div>
            </Section>
          )}
        </>
      )}

      {/* Tenant ID */}
      {isOwner && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--c-text-3)' }}>
              Lainnya
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
          </div>

          <Section>
            <SectionHeader
              title="ID Tenant"
              description="Kode untuk mengundang kasir bergabung ke toko"
            />
            <div className="flex items-center gap-3">
              <code className="flex-1 px-3.5 py-2.5 rounded-lg text-xs font-mono truncate"
                style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}>
                {tenant?.id}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(tenant?.id || ''); alert('ID Tenant disalin!') }}
                className="px-3 py-2.5 rounded-lg text-xs font-medium transition shrink-0"
                style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}
              >
                Salin
              </button>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
