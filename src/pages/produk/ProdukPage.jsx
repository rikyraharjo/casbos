import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, X, Check, Loader2, ImageOff, Upload, Package, ChevronDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const emptyForm = { name: '', price: '', category: '', stock: '', image_url: '' }

const inputCss = {
  base: { background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text)' },
  onFocus: (e) => e.target.style.borderColor = 'var(--c-brand)',
  onBlur:  (e) => e.target.style.borderColor = 'var(--c-border)',
}

function ProductImage({ src, name, size = 'md' }) {
  const [error, setError] = useState(false)
  const sizeClass = size === 'sm' ? 'w-9 h-9' : 'w-full aspect-square'
  if (!src || error) {
    return (
      <div className={`${sizeClass} rounded-lg flex items-center justify-center shrink-0`} style={{ background: 'var(--c-overlay)' }}>
        <ImageOff size={size === 'sm' ? 13 : 22} style={{ color: 'var(--c-text-3)' }} />
      </div>
    )
  }
  return <img src={src} alt={name} onError={() => setError(true)} className={`${sizeClass} object-cover rounded-lg shrink-0`} />
}

function ImageUploader({ value, onChange }) {
  const inputRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const { tenant } = useAuthStore()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return alert('File harus berupa gambar.')
    if (file.size > 2 * 1024 * 1024) return alert('Ukuran gambar maksimal 2MB.')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filename = `${tenant.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filename, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('product-images').getPublicUrl(filename)
      setPreview(data.publicUrl)
      onChange(data.publicUrl)
    } catch (err) { alert('Gagal upload gambar: ' + err.message) }
    finally { setUploading(false) }
  }

  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--c-text-3)' }}>
        Foto Produk <span className="normal-case font-normal" style={{ color: 'var(--c-text-3)' }}>(opsional)</span>
      </label>
      {preview ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden group" style={{ background: 'var(--c-overlay)' }}>
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <button type="button" onClick={() => inputRef.current.click()}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ background: 'var(--c-surface)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
            >Ganti</button>
            <button type="button" onClick={() => { setPreview(''); onChange('') }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ background: 'var(--c-danger-muted)', color: 'var(--c-danger-text)', border: '1px solid var(--c-danger-border)' }}
            >Hapus</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current.click()} disabled={uploading}
          className="w-full rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{ border: '2px dashed var(--c-border)', color: 'var(--c-text-3)' }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-brand)'; e.currentTarget.style.color = 'var(--c-brand)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-3)' }}
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          <span className="text-sm">{uploading ? 'Mengupload...' : 'Klik untuk upload foto'}</span>
          <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>PNG, JPG, WEBP · Maks 2MB</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

export default function ProdukPage() {
  const { tenant } = useAuthStore()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const categoryButtonRef = useRef(null)

  useEffect(() => { if (tenant?.id) fetchProducts() }, [tenant])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*, categories(name)')
      .eq('tenant_id', tenant.id).eq('is_active', true).order('created_at', { ascending: false })
    if (data) {
      setProducts(data)
      setCategories([...new Set(data.map(p => p.categories?.name).filter(Boolean))])
    }
    setLoading(false)
  }

  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.categories?.name || '').toLowerCase().includes(search.toLowerCase())) &&
    (activeCategory === 'Semua' || p.categories?.name === activeCategory)
  )

  const openAdd = () => { setEditProduct(null); setForm(emptyForm); setShowModal(true); setIsNewCategory(false) }
  const openEdit = (p) => {
    setEditProduct(p)
    setForm({ name: p.name, price: p.price, category: p.categories?.name || '', stock: p.stock, image_url: p.image_url || '' })
    setShowModal(true)
    setIsNewCategory(!p.categories?.name || !categories.includes(p.categories.name))
  }

  const selectCategory = (cat) => {
    if (cat === '__new__') {
      setIsNewCategory(true)
      setForm(f => ({ ...f, category: '' }))
    } else {
      setIsNewCategory(false)
      setForm(f => ({ ...f, category: cat }))
    }
    setShowCategoryDropdown(false)
  }

  const toggleDropdown = () => {
    if (!showCategoryDropdown && categoryButtonRef.current) {
      const rect = categoryButtonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setShowCategoryDropdown(!showCategoryDropdown)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      let categoryId = null
      if (form.category) {
        const { data: ex } = await supabase.from('categories').select('id').eq('tenant_id', tenant.id).eq('name', form.category).single()
        if (ex) { categoryId = ex.id }
        else {
          const { data: nc } = await supabase.from('categories').insert({ tenant_id: tenant.id, name: form.category }).select('id').single()
          categoryId = nc?.id
        }
      }
      const payload = { name: form.name, price: parseInt(form.price), stock: parseInt(form.stock) || 0, image_url: form.image_url || null, category_id: categoryId }
      if (editProduct) await supabase.from('products').update(payload).eq('id', editProduct.id)
      else await supabase.from('products').insert({ ...payload, tenant_id: tenant.id })
      await fetchProducts()
      setShowModal(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    await supabase.from('products').update({ is_active: false }).eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const allCategories = ['Semua', ...categories]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--c-text)' }}>Produk</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-text-3)' }}>{products.length} produk terdaftar</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: 'var(--c-brand)', color: 'var(--c-brand-text)' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--c-brand-hover)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--c-brand)'}
        >
          <Plus size={14} />Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-text-3)' }} />
          <input type="text" placeholder="Cari produk atau kategori..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            onFocus={inputCss.onFocus} onBlur={inputCss.onBlur}
          />
        </div>
        {allCategories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition"
                style={activeCategory === cat
                  ? { background: 'var(--c-brand)', color: 'var(--c-brand-text)', border: '1px solid var(--c-brand)' }
                  : { background: 'var(--c-surface)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }
                }
                onMouseOver={e => { if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--c-brand)' }}
                onMouseOut={e => { if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--c-border)' }}
              >{cat}</button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: 'var(--c-text-3)' }}>
            <Loader2 size={20} className="animate-spin mr-2" /><span className="text-sm">Memuat produk...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {['Produk', 'Kategori', 'Harga', 'Stok', ''].map((h, i) => (
                    <th key={i} className={`px-5 py-3 text-xs font-medium uppercase tracking-widest ${i >= 2 && i < 4 ? 'text-right' : 'text-left'}`}
                      style={{ color: 'var(--c-text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <Package size={28} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--c-text-2)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--c-text-2)' }}>Belum ada produk</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>Klik "Tambah Produk" untuk memulai</p>
                    </td>
                  </tr>
                ) : filtered.map((product, i) => (
                  <tr key={product.id} className="group transition-colors"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid var(--c-border-subtle)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--c-surface-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProductImage src={product.image_url} name={product.name} size="sm" />
                        <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {product.categories?.name
                        ? <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                            style={{ background: 'var(--c-brand-muted)', color: 'var(--c-brand)', border: '1px solid rgba(62,207,142,0.15)' }}>
                            {product.categories.name}
                          </span>
                        : <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-medium"
                      style={{ color: product.stock < 10 ? 'var(--c-danger-text)' : 'var(--c-text-2)' }}>
                      {product.stock}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(product)}
                          className="p-1.5 rounded-lg transition" style={{ color: 'var(--c-text-3)' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#818cf8' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-3)' }}
                        ><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(product.id)}
                          className="p-1.5 rounded-lg transition" style={{ color: 'var(--c-text-3)' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--c-danger-muted)'; e.currentTarget.style.color = 'var(--c-danger-text)' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-3)' }}
                        ><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-y-auto" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
              <h3 className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>
                {editProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button onClick={() => setShowModal(false)} className="transition"
                style={{ color: 'var(--c-text-3)' }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--c-text-2)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
              ><X size={16} /></button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <ImageUploader value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--c-text-3)' }}>
                  Nama Produk <span style={{ color: 'var(--c-brand)' }}>*</span>
                </label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Masukkan nama produk"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                  style={inputCss.base} onFocus={inputCss.onFocus} onBlur={inputCss.onBlur}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Harga', key: 'price', type: 'number', placeholder: '0', required: true },
                  { label: 'Stok', key: 'stock', type: 'number', placeholder: '0' },
                ].map(({ label, key, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--c-text-3)' }}>
                      {label} {required && <span style={{ color: 'var(--c-brand)' }}>*</span>}
                    </label>
                    <input type={type} value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                      style={inputCss.base} onFocus={inputCss.onFocus} onBlur={inputCss.onBlur}
                    />
                  </div>
                ))}
              </div>

              <div className="relative">
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--c-text-3)' }}>Kategori</label>

                {isNewCategory ? (
                  <div className="space-y-2">
                    <input type="text" value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="Masukkan nama kategori baru"
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition"
                      style={inputCss.base} onFocus={inputCss.onFocus} onBlur={inputCss.onBlur}
                    />
                    {categories.length > 0 && (
                      <button type="button" onClick={() => setIsNewCategory(false)}
                        className="text-xs font-medium transition"
                        style={{ color: 'var(--c-brand)' }}>
                        ← Pilih dari kategori yang ada
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <button type="button"
                      ref={categoryButtonRef}
                      onClick={toggleDropdown}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition text-left flex items-center justify-between"
                      style={inputCss.base}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--c-brand)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
                    >
                      <span style={{ color: form.category ? 'var(--c-text)' : 'var(--c-text-3)' }}>
                        {form.category || 'Pilih kategori'}
                      </span>
                      <ChevronDown size={14} style={{ color: 'var(--c-text-3)' }} />
                    </button>
                  </div>
                )}
              </div>

              {/* Category Dropdown Portal (outside modal) */}
              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowCategoryDropdown(false)} />
                  <div className="fixed rounded-lg overflow-auto shadow-2xl z-[70]"
                    style={{
                      top: `${dropdownPos.top}px`,
                      left: `${dropdownPos.left}px`,
                      width: `${dropdownPos.width}px`,
                      background: 'var(--c-surface)',
                      border: '1px solid var(--c-border)',
                      maxHeight: '200px'
                    }}>
                          {categories.length > 0 ? (
                            <>
                              {categories.map(cat => (
                                <button key={cat} type="button"
                                  onClick={() => selectCategory(cat)}
                                  className="w-full px-3.5 py-2 text-left text-sm transition block"
                                  style={{
                                    color: form.category === cat ? 'var(--c-brand)' : 'var(--c-text-2)',
                                    fontWeight: form.category === cat ? 500 : 400
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = 'var(--c-overlay)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  {cat}
                                </button>
                              ))}
                              <div style={{ borderTop: '1px solid var(--c-border)' }}>
                                <button type="button"
                                  onClick={() => selectCategory('__new__')}
                                  className="w-full px-3.5 py-2 text-left text-sm font-medium transition block"
                                  style={{ color: 'var(--c-brand)' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'var(--c-brand-muted)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  + Buat kategori baru
                                </button>
                              </div>
                            </>
                          ) : (
                            <button type="button"
                              onClick={() => selectCategory('__new__')}
                              className="w-full px-3.5 py-2.5 text-left text-sm font-medium transition"
                              style={{ color: 'var(--c-brand)' }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--c-brand-muted)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              + Buat kategori baru
                            </button>
                          )}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                style={{ background: 'transparent', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--c-text-3)'; e.currentTarget.style.color = 'var(--c-text)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-2)' }}
              >Batal</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.price}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--c-brand)', color: 'var(--c-brand-text)' }}
                onMouseOver={e => { if (!saving) e.currentTarget.style.background = 'var(--c-brand-hover)' }}
                onMouseOut={e => e.currentTarget.style.background = 'var(--c-brand)'}
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {editProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
