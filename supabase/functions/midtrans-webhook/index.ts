import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    // Verifikasi signature Midtrans
    const rawString = `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`
    const hashBuffer = await crypto.subtle.digest(
      'SHA-512',
      new TextEncoder().encode(rawString),
    )
    const expectedSignature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (expectedSignature !== signature_key) {
      return new Response('Invalid signature', { status: 403 })
    }

    // Tentukan status subscription
    const isSuccess =
      transaction_status === 'capture' && fraud_status === 'accept' ||
      transaction_status === 'settlement'

    const isPending = transaction_status === 'pending'
    const isFailed = ['deny', 'cancel', 'expire', 'failure'].includes(transaction_status)

    if (!isSuccess && !isPending && !isFailed) {
      return new Response('Ignored', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Ambil subscription berdasarkan order_id
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, plan')
      .eq('midtrans_order_id', order_id)
      .single()

    if (!sub) return new Response('Subscription not found', { status: 404 })

    if (isSuccess) {
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      await supabase.from('subscriptions').update({
        status: 'active',
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      }).eq('id', sub.id)

    } else if (isFailed) {
      await supabase.from('subscriptions').update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('id', sub.id)
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})
