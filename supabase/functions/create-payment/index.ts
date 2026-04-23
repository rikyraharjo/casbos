import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')!
const MIDTRANS_IS_PRODUCTION = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

const PLANS: Record<string, { name: string; price: number }> = {
  starter: { name: 'CasBos Starter', price: 99000 },
  pro: { name: 'CasBos Pro', price: 199000 },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Verifikasi user dari JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const { data: { user }, error: authErr } = await createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    ).auth.getUser(authHeader.replace('Bearer ', ''))

    if (authErr || !user) throw new Error('Unauthorized')

    // Ambil profile & tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Profile tidak ditemukan')

    const { plan } = await req.json()
    if (!PLANS[plan]) throw new Error('Plan tidak valid')

    const orderId = `CB-${profile.tenant_id.replace(/-/g, '').slice(0, 16)}-${Date.now()}`
    const planDetail = PLANS[plan]

    // Buat transaksi Midtrans Snap
    const auth = btoa(`${MIDTRANS_SERVER_KEY}:`)
    const snapRes = await fetch(MIDTRANS_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: planDetail.price,
        },
        item_details: [{
          id: plan,
          price: planDetail.price,
          quantity: 1,
          name: planDetail.name,
        }],
        customer_details: {
          first_name: profile.full_name || 'User',
          email: user.email,
        },
        callbacks: {
          finish: `${req.headers.get('origin') || 'https://casbos.com'}/app/billing`,
        },
      }),
    })

    const snapData = await snapRes.json()
    if (!snapData.token) throw new Error(snapData.error_messages?.join(', ') || 'Gagal membuat transaksi')

    // Simpan order_id ke subscription
    await supabase
      .from('subscriptions')
      .update({ midtrans_order_id: orderId, plan })
      .eq('tenant_id', profile.tenant_id)

    return new Response(JSON.stringify({
      token: snapData.token,
      order_id: orderId,
      client_key: Deno.env.get('MIDTRANS_CLIENT_KEY'),
      is_production: MIDTRANS_IS_PRODUCTION,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
