import { X, Printer, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function Receipt({ data, tenant, kasirName, onClose }) {
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)

  if (!data) return null

  const handlePrint = () => {
    // Check if print size is set
    if (!tenant?.print_size) {
      setShowSetupPrompt(true)
      return
    }

    const width = tenant.print_size === '58mm' ? '58mm' : '80mm'
    const printContent = document.getElementById('receipt-content').innerHTML

    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Struk - ${tenant?.name}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none; }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Consolas, monospace;
            font-size: ${width === '58mm' ? '10px' : '12px'};
            line-height: 1.4;
            padding: ${width === '58mm' ? '8px' : '12px'};
            color: #000;
            background: #fff;
            width: ${width};
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider {
            border-top: 1px dashed #000;
            margin: ${width === '58mm' ? '6px 0' : '8px 0'};
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .total-row {
            font-weight: bold;
            font-size: ${width === '58mm' ? '12px' : '14px'};
            margin-top: 4px;
          }
          h1 {
            font-size: ${width === '58mm' ? '14px' : '16px'};
            font-weight: bold;
            margin-bottom: 2px;
          }
          .info-text {
            font-size: ${width === '58mm' ? '9px' : '10px'};
            margin: 1px 0;
          }
          .item-name {
            font-weight: bold;
            margin-bottom: 1px;
          }
          .item-detail {
            font-size: ${width === '58mm' ? '9px' : '10px'};
          }
          .footer-text {
            font-size: ${width === '58mm' ? '8px' : '9px'};
            margin-top: 2px;
          }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `)
    win.document.close()
    win.onload = () => {
      win.focus()
      setTimeout(() => {
        win.print()
        win.close()
      }, 250)
    }
  }

  const paymentLabel = { cash: 'Tunai', transfer: 'Transfer Bank', qris: 'QRIS' }
  const now = new Date(data.created_at || Date.now())
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (showSetupPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--c-brand-muted)' }}>
            <Settings size={24} style={{ color: 'var(--c-brand)' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--c-text)' }}>
            Atur Ukuran Struk Dulu
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--c-text-2)' }}>
            Sebelum print, atur ukuran kertas thermal (58mm/80mm) di halaman Pengaturan.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowSetupPrompt(false)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
              style={{ background: 'var(--c-overlay)', border: '1px solid var(--c-border)', color: 'var(--c-text-2)' }}
            >
              Batal
            </button>
            <Link to="/app/settings" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition text-center"
              style={{ background: 'var(--c-brand)', color: '#000' }}
            >
              Buka Pengaturan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <h3 className="font-medium text-sm" style={{ color: 'var(--c-text)' }}>Struk Transaksi</h3>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{ background: 'var(--c-brand)', color: '#000' }}
            >
              <Printer size={12} /> Print
            </button>
            <button onClick={onClose} style={{ color: 'var(--c-text-3)' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--c-text)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
            ><X size={16} /></button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: '70vh', background: '#fff' }}>
          <div id="receipt-content" style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: '#000', lineHeight: '1.4' }}>
            {/* Toko Info */}
            <div className="center text-center mb-3">
              <h1 className="bold font-bold text-base">{tenant?.name || 'Toko Saya'}</h1>
              {tenant?.address && <p className="info-text text-xs mt-0.5" style={{ color: '#333' }}>{tenant.address}</p>}
              {tenant?.phone && <p className="info-text text-xs" style={{ color: '#333' }}>{tenant.phone}</p>}
            </div>

            <div className="divider my-3" style={{ borderTop: '1px dashed #000' }} />

            {/* Meta */}
            <div className="space-y-1 text-xs" style={{ color: '#000' }}>
              <div className="row flex justify-between">
                <span>Tanggal</span><span>{dateStr}</span>
              </div>
              <div className="row flex justify-between">
                <span>Jam</span><span>{timeStr}</span>
              </div>
              <div className="row flex justify-between">
                <span>Kasir</span><span>{kasirName}</span>
              </div>
              <div className="row flex justify-between">
                <span>Pembayaran</span><span>{paymentLabel[data.payment_method]}</span>
              </div>
            </div>

            <div className="divider my-3" style={{ borderTop: '1px dashed #000' }} />

            {/* Items */}
            <div className="space-y-2">
              {(data.items || []).map((item, i) => (
                <div key={i}>
                  <p className="item-name text-sm font-medium" style={{ color: '#000' }}>{item.product_name}</p>
                  <div className="row item-detail flex justify-between text-xs" style={{ color: '#000' }}>
                    <span>{item.qty} x {formatRupiah(item.price)}</span>
                    <span className="bold font-medium">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="divider my-3" style={{ borderTop: '1px dashed #000' }} />

            {/* Total */}
            <div className="space-y-1.5">
              <div className="row total-row flex justify-between font-bold" style={{ color: '#000', fontSize: '14px' }}>
                <span>TOTAL</span>
                <span>{formatRupiah(data.total)}</span>
              </div>
              {data.payment_method === 'cash' && (
                <>
                  <div className="row flex justify-between text-xs" style={{ color: '#000' }}>
                    <span>Tunai</span><span>{formatRupiah(data.cash_received)}</span>
                  </div>
                  <div className="row flex justify-between text-xs" style={{ color: '#000' }}>
                    <span>Kembalian</span><span className="bold font-medium">{formatRupiah(data.change)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="divider my-3" style={{ borderTop: '1px dashed #000' }} />

            <p className="footer-text text-center text-xs" style={{ color: '#666' }}>Terima kasih sudah berbelanja!</p>
            <p className="footer-text text-center text-xs mt-0.5" style={{ color: '#666' }}>Powered by CasBos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
