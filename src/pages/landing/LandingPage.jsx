import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Star, X, ChevronRight } from 'lucide-react'

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  {
    problem: 'Tidak tahu omzet hari ini kecuali pulang ke toko dulu',
    fix: 'Laporan omzet, transaksi, dan produk terlaris masuk WhatsApp kamu setiap pagi — otomatis.',
  },
  {
    problem: 'Kasir catat di kertas — bisa salah, bisa hilang, bisa dimanipulasi',
    fix: 'Setiap transaksi tersimpan digital dengan nama kasir dan waktu persisnya. Tidak bisa dihapus.',
  },
  {
    problem: 'Stok habis baru ketahuan pas pelanggan sudah mau bayar',
    fix: 'Stok otomatis berkurang tiap transaksi. Kamu bisa pantau kapan saja dari HP.',
  },
  {
    problem: 'Aplikasi kasir lain mahal, ribet, atau butuh mesin khusus',
    fix: 'CasBos jalan di HP atau laptop yang sudah kamu punya. Tidak ada hardware tambahan.',
  },
]

const FEATURES = [
  {
    img: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=700&h=440&q=80',
    tag: 'Laporan Otomatis',
    title: 'Omzet masuk WhatsApp tiap pagi',
    desc: 'Tanpa buka laptop, tanpa hitung manual. Setiap pagi kamu dapat ringkasan omzet, total transaksi, dan 5 produk terlaris langsung di WhatsApp.',
    align: 'left',
  },
  {
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&h=440&q=80',
    tag: 'Kontrol Penuh',
    title: 'Pantau kasir tanpa harus ada di toko',
    desc: 'Setiap transaksi tercatat atas nama kasir yang bertugas, lengkap dengan waktu dan metode bayar. Kamu tahu persis apa yang terjadi di toko.',
    align: 'right',
  },
  {
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&h=440&q=80',
    tag: 'Analitik Cerdas',
    title: 'Tahu produk apa yang paling laku',
    desc: 'Lihat laporan produk terlaris per hari, minggu, atau bulan. Gunakan datanya untuk keputusan stok yang lebih tepat dan omzet yang lebih tinggi.',
    align: 'left',
  },
]

const MINI_FEATURES = [
  {
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&h=260&q=80',
    title: 'Pakai HP Apapun',
    desc: 'Berbasis web. Buka browser, langsung jalan. Tidak perlu install apapun.',
  },
  {
    img: 'https://images.unsplash.com/photo-1556742212-5b321f3c261b?auto=format&fit=crop&w=400&h=260&q=80',
    title: 'Struk Digital & Print',
    desc: 'Struk langsung muncul setelah bayar. Bisa dicetak atau dikirim digital.',
  },
  {
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&h=260&q=80',
    title: 'Multi Kasir',
    desc: 'Tambah kasir dalam hitungan detik. Semua transaksi mereka terpantau.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: 'Rp 99.000',
    period: '/bulan',
    highlight: false,
    badge: null,
    desc: 'Untuk usaha kecil yang baru mulai digital',
    features: [
      { text: '1 toko', ok: true },
      { text: 'Hingga 3 akun kasir', ok: true },
      { text: 'Produk & stok tidak terbatas', ok: true },
      { text: 'Riwayat transaksi lengkap', ok: true },
      { text: 'Struk digital & cetak', ok: true },
      { text: 'Laporan WA otomatis', ok: false },
      { text: 'Export laporan CSV', ok: false },
      { text: 'Multi toko', ok: false },
    ],
    cta: 'Coba Gratis 14 Hari',
  },
  {
    name: 'Pro',
    price: 'Rp 199.000',
    period: '/bulan',
    highlight: true,
    badge: 'Paling Populer',
    desc: 'Untuk owner yang ingin pantau toko dari mana saja',
    features: [
      { text: '1 toko', ok: true },
      { text: 'Kasir tidak terbatas', ok: true },
      { text: 'Produk & stok tidak terbatas', ok: true },
      { text: 'Riwayat transaksi lengkap', ok: true },
      { text: 'Struk digital & cetak', ok: true },
      { text: 'Laporan WA otomatis setiap hari', ok: true },
      { text: 'Export laporan ke CSV', ok: true },
      { text: 'Multi toko', ok: false },
    ],
    cta: 'Coba Gratis 14 Hari',
  },
  {
    name: 'Business',
    price: 'Rp 399.000',
    period: '/bulan',
    highlight: false,
    badge: null,
    desc: 'Untuk bisnis dengan lebih dari satu cabang',
    features: [
      { text: 'Hingga 5 toko', ok: true },
      { text: 'Kasir tidak terbatas', ok: true },
      { text: 'Produk & stok tidak terbatas', ok: true },
      { text: 'Riwayat transaksi lengkap', ok: true },
      { text: 'Struk digital & cetak', ok: true },
      { text: 'Laporan WA otomatis per toko', ok: true },
      { text: 'Export laporan ke CSV', ok: true },
      { text: 'Dashboard multi toko', ok: true },
    ],
    cta: 'Coba Gratis 14 Hari',
  },
]

const TESTIMONIALS = [
  {
    name: 'Budi S.',
    business: 'Warung Makan, Surabaya',
    text: 'Dulu saya harus pulang ke warung buat tahu omzet hari ini. Sekarang tinggal cek WA setiap pagi. Beda banget.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80',
  },
  {
    name: 'Rina M.',
    business: 'Toko Kelontong, Bandung',
    text: 'Kasir saya yang tidak melek teknologi pun langsung bisa pakai. Setup 10 menit, langsung jalan.',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80',
  },
  {
    name: 'Agus P.',
    business: 'Kedai Kopi, Jakarta',
    text: 'Baru tahu produk mana yang paling laku setelah pakai CasBos. Sekarang fokus ke situ, omzet naik 30%.',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&q=80',
  },
]

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function NavBar({ onLogin, onDaftar }) {
  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
            <span className="text-black text-sm font-black">C</span>
          </div>
          <span className="font-semibold tracking-tight text-sm" style={{ color: 'var(--c-text)' }}>CasBos</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogin}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition"
            style={{ color: 'var(--c-text-2)' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--c-text)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-2)'}
          >Masuk</button>
          <button onClick={onDaftar}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition"
            style={{ background: 'var(--c-brand)', color: '#000' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >Coba Gratis</button>
        </div>
      </div>
    </nav>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const goLogin = () => navigate('/login')
  const goDaftar = () => navigate('/login?mode=register')

  return (
    <div style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>
      <NavBar onLogin={goLogin} onDaftar={goDaftar} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--c-border) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          opacity: 0.5,
        }} />
        {/* Green glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center top, rgba(62,207,142,0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28 text-center">
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
            style={{ color: 'var(--c-text)' }}>
            Tau Omzet Toko<br />
            <span style={{ color: 'var(--c-brand)' }}>Tanpa ke Toko</span>
          </h1>

          <p className="text-lg md:text-xl max-w-lg mx-auto mb-10"
            style={{ color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            Kasir digital yang kirim laporan penjualan ke WhatsApp kamu setiap pagi.
            Siap dalam 5 menit, jalan di HP yang sudah kamu punya.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <button onClick={goDaftar}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition w-full sm:w-auto justify-center"
              style={{ background: 'var(--c-brand)', color: '#000' }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              Mulai Gratis 14 Hari <ArrowRight size={15} />
            </button>
            <button onClick={goLogin}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition w-full sm:w-auto justify-center"
              style={{ border: '1px solid var(--c-border)', color: 'var(--c-text-2)', background: 'transparent' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-text-3)'; e.currentTarget.style.color = 'var(--c-text)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-2)' }}
            >Sudah punya akun</button>
          </div>

          {/* WA Preview Card */}
          <div className="max-w-xs mx-auto text-left">
            <div className="rounded-2xl overflow-hidden shadow-xl"
              style={{ border: '1px solid var(--c-border)', background: 'var(--c-surface)' }}>
              <div className="px-4 py-3 flex items-center gap-2.5" style={{ background: '#075E54' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: '#128C7E', color: '#fff' }}>C</div>
                <div>
                  <p className="text-white text-xs font-semibold">CasBos Report</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>Toko Anda · online</p>
                </div>
              </div>
              <div className="p-4">
                <div className="rounded-xl p-3.5 text-xs leading-relaxed"
                  style={{ background: '#dcf8c6', color: '#111' }}>
                  <p className="font-bold text-sm mb-2">Laporan Harian — Senin, 24 Mar</p>
                  <div className="space-y-1">
                    <p>Omzet &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Rp 2.847.000</strong></p>
                    <p>Transaksi &nbsp; <strong>34 transaksi</strong></p>
                    <p>Terlaku &nbsp;&nbsp;&nbsp;&nbsp; <strong>Es Teh Manis (47x)</strong></p>
                  </div>
                  <p className="mt-2.5 text-xs" style={{ color: '#666' }}>Terkirim otomatis oleh CasBos</p>
                </div>
              </div>
            </div>
            <p className="text-center text-xs mt-3" style={{ color: 'var(--c-text-3)' }}>
              Seperti ini laporan yang kamu terima setiap pagi
            </p>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ─────────────────────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-brand)' }}>
              Masalah yang sering terjadi
            </p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: 'var(--c-text)' }}>
              Familiar dengan<br />situasi ini?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAIN_POINTS.map(({ problem, fix }) => (
              <div key={problem} className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--c-border)' }}>
                <div className="flex items-start gap-3 px-5 py-4"
                  style={{ background: 'rgba(239,68,68,0.04)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(239,68,68,0.12)' }}>
                    <X size={11} style={{ color: '#f87171' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--c-text-3)', lineHeight: 1.65 }}>{problem}</p>
                </div>
                <div className="flex items-start gap-3 px-5 py-4"
                  style={{ background: 'rgba(62,207,142,0.04)', borderTop: '1px solid var(--c-border)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--c-brand-muted)' }}>
                    <Check size={11} style={{ color: 'var(--c-brand)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--c-text)', lineHeight: 1.65 }}>{fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--c-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-brand)' }}>
              Harga
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--c-text)' }}>
              Lebih Murah dari Satu Nota Hilang
            </h2>
            <p className="text-base" style={{ color: 'var(--c-text-2)' }}>
              Semua paket gratis 14 hari. Tidak perlu kartu kredit.
            </p>
          </div>

          <div className="max-w-sm mx-auto mb-10 mt-6">
            <div className="rounded-xl px-5 py-3 text-center text-sm"
              style={{ background: 'var(--c-brand-muted)', border: '1px solid rgba(62,207,142,0.2)', color: 'var(--c-brand)' }}>
              Rata-rata pengguna hemat <strong>4–6 jam/minggu</strong> dari pencatatan manual
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div key={plan.name} className="rounded-2xl relative"
                style={{
                  background: 'var(--c-surface)',
                  border: plan.highlight ? '2px solid var(--c-brand)' : '1px solid var(--c-border)',
                }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'var(--c-brand)', color: '#000' }}>
                    {plan.badge}
                  </div>
                )}
                <div className="p-7">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: plan.highlight ? 'var(--c-brand)' : 'var(--c-text-3)' }}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold" style={{ color: 'var(--c-text)' }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: 'var(--c-text-3)' }}>{plan.period}</span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: 'var(--c-text-3)' }}>{plan.desc}</p>

                  <button onClick={goDaftar}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition mb-7 flex items-center justify-center gap-1.5"
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
                    {plan.cta} <ChevronRight size={14} />
                  </button>

                  <div className="space-y-2.5">
                    {plan.features.map(({ text, ok }) => (
                      <div key={text} className="flex items-center gap-2.5 text-sm">
                        {ok
                          ? <Check size={13} className="shrink-0" style={{ color: 'var(--c-brand)' }} />
                          : <X size={13} className="shrink-0" style={{ color: 'var(--c-text-3)', opacity: 0.35 }} />
                        }
                        <span style={{ color: ok ? 'var(--c-text-2)' : 'var(--c-text-3)', opacity: ok ? 1 : 0.45 }}>
                          {text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (big alternating) ───────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-brand)' }}>
              Fitur utama
            </p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--c-text)' }}>
              Semua yang kamu butuhkan,<br />tidak lebih, tidak kurang
            </h2>
          </div>

          <div className="space-y-6">
            {FEATURES.map(({ img, tag, title, desc, align }) => (
              <div key={title}
                className={`rounded-2xl overflow-hidden flex flex-col ${align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                style={{ border: '1px solid var(--c-border)', background: 'var(--c-overlay)', minHeight: 320 }}>
                {/* Image */}
                <div className="md:w-1/2 shrink-0 relative overflow-hidden" style={{ minHeight: 240 }}>
                  <img src={img} alt={title} className="w-full h-full object-cover absolute inset-0" />
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
                </div>
                {/* Text */}
                <div className="md:w-1/2 flex flex-col justify-center p-8 md:p-12">
                  <span className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: 'var(--c-brand)' }}>{tag}</span>
                  <h3 className="text-2xl font-bold mb-4 leading-tight" style={{ color: 'var(--c-text)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-2)', lineHeight: 1.75 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mini feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
            {MINI_FEATURES.map(({ img, title, desc }) => (
              <div key={title} className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--c-border)', background: 'var(--c-overlay)' }}>
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <img src={img} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)' }} />
                </div>
                <div className="p-5">
                  <h3 className="font-bold mb-1.5 text-sm" style={{ color: 'var(--c-text)' }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--c-text-3)', lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--c-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-brand)' }}>
              Testimoni
            </p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--c-text)' }}>
              UMKM yang Sudah<br />Merasakan Manfaatnya
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, business, text, img }) => (
              <div key={name} className="p-6 rounded-2xl flex flex-col gap-4"
                style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="var(--c-brand)" style={{ color: 'var(--c-brand)' }} />
                  ))}
                </div>
                <p className="text-sm flex-1" style={{ color: 'var(--c-text-2)', lineHeight: 1.75 }}>
                  "{text}"
                </p>
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <img src={img} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>{name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>{business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="border-t relative overflow-hidden" style={{ borderColor: 'var(--c-border)', background: 'var(--c-surface)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(62,207,142,0.07) 0%, transparent 65%)' }} />
        <div className="relative max-w-3xl mx-auto px-6 py-28 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 leading-tight" style={{ color: 'var(--c-text)' }}>
            Coba Dulu,<br />Bayar Nanti
          </h2>
          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: 'var(--c-text-2)', lineHeight: 1.75 }}>
            14 hari gratis penuh, semua fitur Pro terbuka. Kalau tidak cocok, tidak perlu bayar apapun.
          </p>
          <button onClick={goDaftar}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-base transition mb-6"
            style={{ background: 'var(--c-brand)', color: '#000' }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Daftar Sekarang — Gratis <ArrowRight size={16} />
          </button>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
            style={{ color: 'var(--c-text-3)' }}>
            {['Tidak perlu kartu kredit', 'Setup 5 menit', 'Cancel kapan saja'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <Check size={11} style={{ color: 'var(--c-brand)' }} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: 'var(--c-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
              <span className="text-black text-xs font-black">C</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>CasBos</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
            &copy; {new Date().getFullYear()} CasBos · Dibuat untuk UMKM Indonesia
          </p>
        </div>
      </footer>
    </div>
  )
}
