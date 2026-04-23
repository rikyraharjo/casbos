import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, X, ImageOff, Loader2, CheckCircle, Package, User, Banknote, QrCode, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function formatRupiah(a) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(a)
}

function ProductImage({ src, name }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-2xl">
        <Package size={32} className="text-gray-300" />
      </div>
    )
  }
  return <img src={src} alt={name} onError={() => setError(true)} className="w-full h-40 object-cover rounded-t-2xl" />
}

export default function OrderPage() {
  const { code } = useParams()
  const [tenant, setTenant]         = useState(null)
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [search, setSearch]         = useState('')
  const [cart, setCart]             = useState([])
  const [customerName, setCustomerName]   = useState('')
  const [tableNumber, setTableNumber]     = useState('')
  const [tableNote, setTableNote]         = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading]             = useState(true)
  const [submitting, setSubmitting]       = useState(false)
  const [done, setDone]                   = useState(false)
  const [notFound, setNotFound]           = useState(false)
  const [showCart, setShowCart]           = useState(false)

  useEffect(() => { fetchTenantAndProducts() }, [code])

  const fetchTenantAndProducts = async () => {
    setLoading(true)
    const { data: tenantData } = await supabase
      .from('tenants').select('id, name, order_code, qris_image_url').eq('order_code', code).single()

    if (!tenantData) { setNotFound(true); setLoading(false); return }
    setTenant(tenantData)

    const { data } = await supabase
      .from('products').select('*, categories(name)')
      .eq('tenant_id', tenantData.id).eq('is_active', true).order('name')

    if (data) {
      setProducts(data)
      setCategories(['Semua', ...new Set(data.map(p => p.categories?.name).filter(Boolean))])
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    (activeCategory === 'Semua' || p.categories?.name === activeCategory) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (product) => setCart(prev => {
    const ex = prev.find(i => i.id === product.id)
    return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }]
  })

  const updateQty = (id, delta) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
  )

  const total     = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const handleSubmit = async () => {
    if (cart.length === 0 || !customerName.trim()) return
    setSubmitting(true)
    try {
      await supabase.from('orders').insert({
        tenant_id: tenant.id,
        customer_name: customerName.trim(),
        table_number: tableNumber.trim() || null,
        items: cart.map(i => ({ product_id: i.id, product_name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty })),
        total,
        table_note: tableNote || null,
        payment_method: paymentMethod,
        status: 'pending',
      })
      setDone(paymentMethod)
      setCart([])
      setCustomerName('')
      setTableNumber('')
      setTableNote('')
      setPaymentMethod('cash')
    } catch {
      alert('Gagal mengirim pesanan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <Loader2 size={28} className="animate-spin" style={{ color: '#3ecf8e' }} />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#f8fafc' }}>
      <Package size={52} className="mb-4" style={{ color: '#d1d5db' }} />
      <h1 className="text-lg font-bold text-gray-700">Toko tidak ditemukan</h1>
      <p className="text-sm text-gray-400 mt-1">Pastikan QR code yang kamu scan benar.</p>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
          style={{ background: done === 'qris' ? 'rgba(99,102,241,0.1)' : 'rgba(62,207,142,0.12)' }}>
          <CheckCircle size={48} style={{ color: done === 'qris' ? '#818cf8' : '#3ecf8e' }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Pesanan Terkirim!</h1>

        {done === 'qris' ? (
          <>
            <p className="text-sm text-gray-500 mb-6">Scan QRIS di bawah untuk membayar, lalu tunjukkan bukti ke kasir.</p>
            {tenant?.qris_image_url ? (
              <div className="bg-white rounded-3xl p-4 shadow-md mb-6" style={{ border: '1px solid #e2e8f0' }}>
                <img src={tenant.qris_image_url} alt="QRIS" className="w-56 h-56 object-contain" />
                <p className="text-xs text-gray-400 mt-3 font-medium">{tenant.name}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 mb-6 text-center" style={{ border: '1px solid #e2e8f0' }}>
                <QrCode size={48} className="mx-auto mb-2" style={{ color: '#d1d5db' }} />
                <p className="text-sm text-gray-400">QRIS belum diatur.<br/>Silakan bayar ke kasir.</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mb-8">Setelah bayar, tunjukkan bukti transfer ke kasir untuk konfirmasi.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">Pesanan kamu sudah masuk ke kasir.</p>
            <div className="bg-white rounded-2xl px-6 py-4 mb-8 flex items-center gap-3" style={{ border: '1px solid #e2e8f0' }}>
              <Banknote size={20} style={{ color: '#3ecf8e' }} />
              <p className="text-sm font-semibold text-gray-700">Silakan ke kasir untuk membayar</p>
            </div>
          </>
        )}
      </div>

      <div className="p-6">
        <button onClick={() => setDone(false)}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: '#3ecf8e', boxShadow: '0 4px 16px rgba(62,207,142,0.3)' }}>
          Pesan Lagi
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-base truncate">{tenant?.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Pesan langsung dari HP kamu</p>
          </div>
          <button onClick={() => setShowCart(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm transition-all ml-3"
            style={{
              background: cartCount > 0 ? '#3ecf8e' : '#fff',
              color: cartCount > 0 ? '#fff' : '#64748b',
              border: cartCount > 0 ? 'none' : '1px solid #e2e8f0'
            }}>
            <ShoppingCart size={16} />
            {cartCount > 0 && <span className="tabular-nums">{cartCount}</span>}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm bg-gray-50 border border-gray-200 outline-none transition placeholder:text-gray-400"
              style={{ color: '#1e293b' }}
              onFocus={e => { e.target.style.borderColor = '#3ecf8e'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f9fafb' }}
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div className="px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={activeCategory === cat
                  ? { background: '#3ecf8e', color: '#fff', boxShadow: '0 2px 8px rgba(62,207,142,0.25)' }
                  : { background: '#f1f5f9', color: '#64748b' }
                }>{cat}</button>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="p-4 pb-28">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(226,232,240,0.5)' }}>
              <Package size={36} style={{ color: '#cbd5e1' }} />
            </div>
            <p className="text-sm font-medium text-gray-600">Tidak ada menu ditemukan</p>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id)
              const habis  = product.stock === 0
              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden transition-all"
                  style={{
                    border: inCart ? '2px solid #3ecf8e' : '1px solid #e8ecf0',
                    boxShadow: inCart ? '0 4px 12px rgba(62,207,142,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                    opacity: habis ? 0.5 : 1,
                  }}>
                  <div className="relative">
                    <ProductImage src={product.image_url} name={product.name} />
                    {inCart && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                        style={{ background: '#3ecf8e' }}>{inCart.qty}</div>
                    )}
                    {habis && (
                      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]"
                        style={{ background: 'rgba(0,0,0,0.4)' }}>
                        <span className="text-white text-xs font-bold bg-black/70 px-3 py-1.5 rounded-full">Habis</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2 min-h-[40px]">{product.name}</p>
                    <p className="text-base font-bold mb-3" style={{ color: '#3ecf8e' }}>{formatRupiah(product.price)}</p>
                    {!habis && (
                      inCart ? (
                        <div className="flex items-center justify-between gap-1.5">
                          <button onClick={() => updateQty(product.id, -1)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all active:scale-95"
                            style={{ background: '#f1f5f9', color: '#64748b' }}>
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold text-gray-800 min-w-[24px] text-center">{inCart.qty}</span>
                          <button onClick={() => updateQty(product.id, 1)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all active:scale-95"
                            style={{ background: '#3ecf8e' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                          style={{ background: '#3ecf8e' }}>
                          + Tambah
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-30 pointer-events-none">
          <button onClick={() => setShowCart(true)}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-between px-6 pointer-events-auto"
            style={{ background: '#3ecf8e', boxShadow: '0 8px 24px rgba(62,207,142,0.4)' }}>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-xl px-2.5 py-1 text-xs font-bold">{cartCount} item</div>
            </div>
            <span>Lihat Pesanan</span>
            <span className="font-bold">{formatRupiah(total)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[92vh] flex flex-col"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="font-bold text-gray-800 text-base">Pesanan Kamu</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 p-1"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Nama pelanggan */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#64748b' }}>
                  <User size={12} /> Nama Kamu <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama kamu"
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition placeholder:text-gray-400"
                  style={{ border: '1.5px solid #e2e8f0', color: '#1e293b', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#3ecf8e'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Nomor meja */}
              <div>
                <label className="text-xs font-semibold mb-2 uppercase tracking-wide block" style={{ color: '#64748b' }}>
                  Nomor Meja (opsional)
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  placeholder="Contoh: Meja 3, Lantai 2, dll."
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition placeholder:text-gray-400"
                  style={{ border: '1.5px solid #e2e8f0', color: '#1e293b', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#3ecf8e'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Items */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>Item Pesanan</p>
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2"
                    style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRupiah(item.price)} / item</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center"
                        style={{ background: '#f1f5f9', color: '#64748b' }}>
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-bold text-gray-800 w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                        style={{ background: '#3ecf8e' }}>
                        <Plus size={11} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-800 w-20 text-right shrink-0">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Catatan */}
              <div>
                <label className="text-xs font-semibold mb-2 uppercase tracking-wide block" style={{ color: '#64748b' }}>
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={tableNote}
                  onChange={e => setTableNote(e.target.value)}
                  placeholder="Tidak pedas, tanpa bawang, dll."
                  className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition placeholder:text-gray-400"
                  style={{ border: '1.5px solid #e2e8f0', color: '#1e293b', background: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#3ecf8e'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div className="p-5 border-t" style={{ background: '#fff' }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">Total Pembayaran</span>
                <span className="text-xl font-bold text-gray-900">{formatRupiah(total)}</span>
              </div>

              {/* Pilih metode bayar */}
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>Cara Bayar</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition"
                    style={paymentMethod === 'cash'
                      ? { background: 'rgba(62,207,142,0.12)', border: '2px solid #3ecf8e', color: '#16a34a' }
                      : { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b' }
                    }
                  >
                    <Banknote size={16} />
                    Bayar di Kasir
                  </button>
                  <button
                    onClick={() => setPaymentMethod('qris')}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition"
                    style={paymentMethod === 'qris'
                      ? { background: 'rgba(99,102,241,0.1)', border: '2px solid #818cf8', color: '#6366f1' }
                      : { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b' }
                    }
                  >
                    <QrCode size={16} />
                    Bayar QRIS
                  </button>
                </div>
              </div>

              {!customerName.trim() && (
                <p className="text-xs mb-3 text-center" style={{ color: '#f87171' }}>Masukkan nama kamu dulu sebelum memesan</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting || cart.length === 0 || !customerName.trim()}
                className="w-full py-4 rounded-2xl font-bold text-white text-sm transition disabled:opacity-40"
                style={{ background: '#3ecf8e', boxShadow: '0 4px 16px rgba(62,207,142,0.3)' }}>
                {submitting
                  ? <Loader2 size={18} className="animate-spin mx-auto" />
                  : paymentMethod === 'qris' ? 'Pesan & Lihat QRIS' : 'Kirim Pesanan ke Kasir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
