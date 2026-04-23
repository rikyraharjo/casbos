import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Rentang waktu kemarin (WIB = UTC+7)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    // Ambil semua tenant yang punya nomor WhatsApp
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, name, whatsapp_number')
      .not('whatsapp_number', 'is', null)
      .neq('whatsapp_number', '')

    if (tenantErr) throw tenantErr
    if (!tenants?.length) return new Response('No tenants configured', { status: 200 })

    for (const tenant of tenants) {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('total, transaction_items(product_name, qty, subtotal)')
        .eq('tenant_id', tenant.id)
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())

      const omzet = (transactions || []).reduce((s, t) => s + t.total, 0)
      const count = transactions?.length ?? 0

      // Hitung produk terlaku
      const productMap: Record<string, { qty: number }> = {}
      ;(transactions || []).forEach(t => {
        ;(t.transaction_items as any[] || []).forEach(item => {
          if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0 }
          productMap[item.product_name].qty += item.qty
        })
      })

      const topProducts = Object.entries(productMap)
        .map(([name, v]) => ({ name, qty: v.qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3)

      const message = buildMessage(tenant.name, omzet, count, topProducts)
      await sendWA(tenant.whatsapp_number, message)
    }

    return new Response('Laporan terkirim', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

function buildMessage(
  tokoName: string,
  omzet: number,
  count: number,
  topProducts: { name: string; qty: number }[],
) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  let msg = `*Laporan Harian — ${tokoName}*\n`
  msg += `${dateStr}\n`
  msg += `${'─'.repeat(28)}\n\n`

  if (count === 0) {
    msg += `Tidak ada transaksi kemarin.\n`
  } else {
    msg += `Omzet        : *${formatRupiah(omzet)}*\n`
    msg += `Transaksi    : *${count} transaksi*\n`

    if (topProducts.length) {
      msg += `\n*Produk Terlaku:*\n`
      topProducts.forEach((p, i) => {
        msg += `${i + 1}. ${p.name} — ${p.qty}x terjual\n`
      })
    }
  }

  msg += `\n_Dikirim otomatis oleh CasBos_`
  return msg
}

async function sendWA(target: string, message: string) {
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': FONNTE_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target, message, countryCode: '62' }),
  })
  const json = await res.json()
  console.log('Fonnte response:', json)
}
