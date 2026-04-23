import { useState, useEffect } from 'react'
import { ShoppingCart, Search, Plus, Minus, X, Check, Loader2, ImageOff, Package, Bell, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import Receipt from '../../components/Receipt'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function ProductImage({ src, name }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className="w-full aspect-square rounded-lg flex items-center justify-center" style={{ background: 'var(--c-overlay)' }}>
        <ImageOff size={20} style={{ color: 'var(--c-text-3)' }} />
      </div>
    )
  }
  return <img src={src} alt={name} onError={() => setError(true)} className="w-full aspect-square object-cover rounded-lg" />
}

export default function KasirPage() {
  const { tenant, profile } = useAuthStore()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashInput, setCashInput] = useState('')
  const [receiptData, setReceiptData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [incomingOrders, setIncomingOrders] = useState([])
  const [showOrders, setShowOrders] = useState(false)
  useEffect(() => {
    if (tenant?.id) {
      fetchProducts()
      fetchIncomingOrders()

      const channel = supabase
        .channel('orders-' + tenant.id)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenant.id}`,
        }, (payload) => {
          setIncomingOrders(prev => [payload.new, ...prev])
          setShowOrders(true)
          // Notifikasi suara sederhana
          try { new Audio('https://www.soundjay.com/buttons/sounds/button-09a.mp3').play() } catch {}
        })
        .subscribe()

      return () => supabase.removeChannel(channel)
    }
  }, [tenant])

  const fetchIncomingOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setIncomingOrders(data)
  }

  const confirmOrder = async (order) => {
    // Masukkan item ke keranjang
    const newItems = order.items.map(item => ({
      id: item.product_id,
      name: item.product_name,
      price: item.price,
      qty: item.qty,
      stock: 999,
      image_url: null,
    }))
    setCart(prev => {
      const merged = [...prev]
      newItems.forEach(newItem => {
        const ex = merged.find(i => i.id === newItem.id)
        if (ex) ex.qty += newItem.qty
        else merged.push(newItem)
      })
      return merged
    })
    // Tandai order sebagai confirmed
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
    setIncomingOrders(prev => prev.filter(o => o.id !== order.id))
  }

  const dismissOrder = async (order) => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    setIncomingOrders(prev => prev.filter(o => o.id !== order.id))
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products').select('*, categories(name)')
      .eq('tenant_id', tenant.id).eq('is_active', true).order('name')
    if (data) {
      setProducts(data)
      setCategories(['Semua', ...new Set(data.map(p => p.categories?.name).filter(Boolean))])
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (activeCategory === 'Semua' || p.categories?.name === activeCategory)
  )

  const addToCart = (product) => setCart(prev => {
    const ex = prev.find(i => i.id === product.id)
    return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }]
  })

  const updateQty = (id, delta) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
  )

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const cashAmount = parseInt(cashInput.replace(/\D/g, '')) || 0
  const change = cashAmount - total

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash' && cashAmount < total) return
    setSaving(true)
    try {
      const { data: trx, error } = await supabase.from('transactions').insert({
        tenant_id: tenant.id, cashier_id: profile.id, cashier_name: profile.full_name,
        total, payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashAmount : total,
        change: paymentMethod === 'cash' ? change : 0,
      }).select('id').single()
      if (error) throw error

      await supabase.from('transaction_items').insert(
        cart.map(i => ({ transaction_id: trx.id, product_id: i.id, product_name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty }))
      )
      for (const item of cart) {
        await supabase.from('products').update({ stock: Math.max(0, item.stock - item.qty) }).eq('id', item.id)
      }

      setShowPayment(false)
      setReceiptData({
        ...trx,
        items: cart.map(i => ({ product_name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
        total,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashAmount : total,
        change: paymentMethod === 'cash' ? change : 0,
      })
      setCart([])
      setCashInput('')
      setPaymentMethod('cash')
      fetchProducts()
    } catch { alert('Gagal menyimpan transaksi.') }
    finally { setSaving(false) }
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* Products */}
      <div className="flex-1 min-w-0">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Kasir</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-3)' }}>Pilih produk untuk ditambahkan ke keranjang</p>
          </div>
          <button
            onClick={() => setShowOrders(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}
          >
            <Bell size={14} />
            <span>Pesanan Masuk</span>
            {incomingOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-black"
                style={{ background: 'var(--c-brand)' }}>
                {incomingOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }} />
          <input
            type="text" placeholder="Cari produk..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--c-brand)'}
            onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
          />
        </div>

        {/* Categories */}
        {categories.length > 1 && (
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                style={activeCategory === cat
                  ? { background: 'var(--c-brand)', color: 'var(--c-brand-text)', border: '1px solid var(--c-brand)' }
                  : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
                }
                onMouseOver={e => { if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--c-brand)' }}
                onMouseOut={e => { if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--c-border)' }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24" style={{ color: 'var(--c-text-3)' }}>
            <Loader2 size={20} className="animate-spin mr-2" /><span className="text-sm">Memuat produk...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <Package size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--c-text-2)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--c-text-2)' }}>Belum ada produk</p>
            <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>Tambahkan produk di menu Produk</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id)
              return (
                <button key={product.id} onClick={() => addToCart(product)}
                  className="rounded-xl text-left transition-all relative overflow-hidden"
                  style={{
                    background: 'var(--c-surface)',
                    border: inCart ? '1px solid var(--c-brand)' : '1px solid var(--c-border)',
                    boxShadow: inCart ? '0 0 0 1px var(--c-brand)' : 'none',
                  }}
                  onMouseOver={e => { if (!inCart) e.currentTarget.style.borderColor = 'var(--c-text-3)' }}
                  onMouseOut={e => { if (!inCart) e.currentTarget.style.borderColor = 'var(--c-border)' }}
                >
                  {inCart && (
                    <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--c-brand)', color: 'var(--c-brand-text)' }}>
                      {inCart.qty}
                    </div>
                  )}
                  <div className="p-3 pb-0"><ProductImage src={product.image_url} name={product.name} /></div>
                  <div className="p-3">
                    <p className="text-sm font-medium leading-tight line-clamp-2" style={{ color: 'var(--c-text)' }}>{product.name}</p>
                    <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--c-brand)' }}>{formatRupiah(product.price)}</p>
                    {product.stock !== null && product.stock < 10 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--c-danger-text)' }}>Stok: {product.stock}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="lg:w-72 xl:w-80 rounded-xl flex flex-col shrink-0"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="px-4 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={14} style={{ color: 'var(--c-text-2)' }} />
            <span className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>Keranjang</span>
          </div>
          {cartCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--c-brand-muted)', color: 'var(--c-brand)' }}>
                {cartCount} item
              </span>
              <button onClick={() => setCart([])} className="text-xs transition"
                style={{ color: 'var(--c-text-3)' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--c-danger-text)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
              >
                Hapus semua
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1" style={{ maxHeight: 380 }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <ShoppingCart size={28} className="opacity-20 mb-2" style={{ color: 'var(--c-text-2)' }} />
              <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>Keranjang kosong</p>
              <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>Tap produk untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-2.5 p-2 rounded-lg transition-colors"
                onMouseOver={e => e.currentTarget.style.background = 'var(--c-overlay)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--c-overlay)' }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ImageOff size={12} style={{ color: 'var(--c-text-3)' }} /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--c-text)' }}>{item.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-brand)' }}>{formatRupiah(item.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="w-5 h-5 rounded flex items-center justify-center transition"
                    style={{ background: 'var(--c-overlay)', color: 'var(--c-text-2)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--c-border)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--c-overlay)'}
                  ><Minus size={10} /></button>
                  <span className="w-5 text-center text-xs font-semibold" style={{ color: 'var(--c-text)' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-5 h-5 rounded flex items-center justify-center transition"
                    style={{ background: 'var(--c-brand-muted)', color: 'var(--c-brand)' }}
                    onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                  ><Plus size={10} /></button>
                  <button onClick={() => removeItem(item.id)} className="ml-0.5 transition"
                    style={{ color: 'var(--c-text-3)' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--c-danger-text)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
                  ><X size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--c-border)' }}>
          {cart.length > 0 && (
            <div className="space-y-1.5">
              {cart.map(i => (
                <div key={i.id} className="flex justify-between text-xs" style={{ color: 'var(--c-text-3)' }}>
                  <span className="truncate max-w-36">{i.name} ×{i.qty}</span>
                  <span>{formatRupiah(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-sm pt-1.5" style={{ color: 'var(--c-text)', borderTop: '1px dashed var(--c-border)' }}>
                <span>Total</span><span>{formatRupiah(total)}</span>
              </div>
            </div>
          )}
          <button onClick={() => cart.length > 0 && setShowPayment(true)} disabled={cart.length === 0}
            className="w-full py-3 rounded-lg font-semibold text-sm transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'var(--c-brand)', color: 'var(--c-brand-text)' }}
            onMouseOver={e => { if (cart.length > 0) e.currentTarget.style.background = 'var(--c-brand-hover)' }}
            onMouseOut={e => e.currentTarget.style.background = 'var(--c-brand)'}
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <h3 className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>Pembayaran</h3>
              <button onClick={() => setShowPayment(false)} className="transition"
                style={{ color: 'var(--c-text-3)' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--c-text-2)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
              ><X size={16} /></button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)' }}>
                <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>Total Tagihan</span>
                <span className="text-xl font-bold" style={{ color: 'var(--c-text)' }}>{formatRupiah(total)}</span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-2.5" style={{ color: 'var(--c-text-3)' }}>Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ key: 'cash', label: 'Tunai' }, { key: 'transfer', label: 'Transfer' }, { key: 'qris', label: 'QRIS' }].map(({ key, label }) => (
                    <button key={key} onClick={() => setPaymentMethod(key)}
                      className="py-2.5 rounded-lg text-sm font-medium transition"
                      style={paymentMethod === key
                        ? { background: 'var(--c-brand)', color: 'var(--c-brand-text)', border: '1px solid var(--c-brand)' }
                        : { background: 'var(--c-overlay)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
                      }
                      onMouseOver={e => { if (paymentMethod !== key) e.currentTarget.style.borderColor = 'var(--c-brand)' }}
                      onMouseOut={e => { if (paymentMethod !== key) e.currentTarget.style.borderColor = 'var(--c-border)' }}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-widest mb-2 block" style={{ color: 'var(--c-text-3)' }}>Uang Diterima</label>
                  <input type="text" value={cashInput}
                    onChange={e => { const n = e.target.value.replace(/\D/g, ''); setCashInput(n ? parseInt(n).toLocaleString('id-ID') : '') }}
                    placeholder="0" autoFocus
                    className="w-full px-4 py-3 rounded-lg text-base font-medium outline-none transition"
                    style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--c-brand)'}
                    onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
                  />
                  {cashAmount > 0 && (
                    <div className="mt-3 flex justify-between items-center px-4 py-3 rounded-lg"
                      style={change >= 0
                        ? { background: 'var(--c-brand-muted)', border: '1px solid rgba(62,207,142,0.2)' }
                        : { background: 'var(--c-danger-muted)', border: '1px solid var(--c-danger-border)' }
                      }
                    >
                      <span className="text-sm" style={{ color: 'var(--c-text-2)' }}>Kembalian</span>
                      <span className="text-base font-bold" style={{ color: change >= 0 ? 'var(--c-brand)' : 'var(--c-danger-text)' }}>
                        {formatRupiah(change)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'qris' && (
                <div className="flex flex-col items-center">
                  {tenant?.qris_image_url ? (
                    <>
                      <div className="rounded-xl overflow-hidden p-2 mb-2" style={{ background: '#fff', border: '1px solid var(--c-border)' }}>
                        <img src={tenant.qris_image_url} alt="QRIS" className="w-48 h-48 object-contain" />
                      </div>
                      <p className="text-xs text-center" style={{ color: 'var(--c-text-3)' }}>
                        Minta pelanggan scan QR ini, lalu konfirmasi setelah cek notif banking kamu
                      </p>
                    </>
                  ) : (
                    <div className="w-full rounded-xl p-4 text-center" style={{ background: 'var(--c-overlay)', border: '1px dashed var(--c-border)' }}>
                      <QrCode size={28} className="mx-auto mb-2 opacity-40" style={{ color: 'var(--c-text-2)' }} />
                      <p className="text-xs font-medium mb-2" style={{ color: 'var(--c-text-2)' }}>Gambar QRIS belum diupload</p>
                      <Link to="/app/settings"
                        onClick={() => setShowPayment(false)}
                        className="text-xs font-semibold underline"
                        style={{ color: 'var(--c-brand)' }}>
                        Upload QRIS di Pengaturan →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <button onClick={handleConfirmPayment}
                disabled={saving || (paymentMethod === 'cash' && cashAmount < total)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--c-brand)', color: 'var(--c-brand-text)' }}
                onMouseOver={e => { if (!saving) e.currentTarget.style.background = 'var(--c-brand-hover)' }}
                onMouseOut={e => e.currentTarget.style.background = 'var(--c-brand)'}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptData && (
        <Receipt
          data={receiptData}
          tenant={tenant}
          kasirName={profile?.full_name}
          onClose={() => setReceiptData(null)}
        />
      )}

      {/* Panel Pesanan Masuk */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowOrders(false)} />
          <div className="relative ml-auto w-full max-w-sm h-full flex flex-col"
            style={{ background: 'var(--c-surface)', borderLeft: '1px solid var(--c-border)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>Pesanan Masuk</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                  {incomingOrders.length > 0 ? `${incomingOrders.length} pesanan menunggu` : 'Tidak ada pesanan'}
                </p>
              </div>
              <button onClick={() => setShowOrders(false)} style={{ color: 'var(--c-text-3)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {incomingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <Bell size={32} style={{ color: 'var(--c-text-2)' }} />
                  <p className="text-sm mt-3" style={{ color: 'var(--c-text-2)' }}>Belum ada pesanan masuk</p>
                </div>
              ) : incomingOrders.map(order => (
                <div key={order.id} className="rounded-xl p-4 space-y-3"
                  style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold" style={{ color: 'var(--c-brand)' }}>Pesanan Baru</p>
                        {order.payment_method === 'qris' ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                            QRIS
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(62,207,142,0.1)', color: 'var(--c-brand)' }}>
                            Bayar di Kasir
                          </span>
                        )}
                      </div>
                      {order.customer_name && (
                        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--c-text)' }}>👤 {order.customer_name}</p>
                      )}
                      {order.table_number && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-2)' }}>🪑 {order.table_number}</p>
                      )}
                      {order.table_note && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-2)' }}>📝 {order.table_note}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-sm font-bold shrink-0" style={{ color: 'var(--c-text)' }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--c-text-2)' }}>
                        <span>{item.product_name} ×{item.qty}</span>
                        <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { confirmOrder(order); setShowOrders(false) }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-black transition"
                      style={{ background: 'var(--c-brand)' }}
                    >
                      <Check size={12} className="inline mr-1" />
                      Terima & Masuk Keranjang
                    </button>
                    <button
                      onClick={() => dismissOrder(order)}
                      className="px-3 py-2 rounded-lg text-xs font-medium transition"
                      style={{ border: '1px solid var(--c-border)', color: 'var(--c-text-3)' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
