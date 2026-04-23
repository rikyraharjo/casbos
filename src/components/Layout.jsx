import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, BarChart2, Users, Settings, CreditCard, LogOut, Menu, X, Sun, Moon, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import TrialBanner from './TrialBanner'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/kasir',     icon: ShoppingCart,    label: 'Kasir' },
  { to: '/app/produk',    icon: Package,         label: 'Produk' },
  { to: '/app/laporan',   icon: BarChart2,       label: 'Laporan' },
  { to: '/app/tim',       icon: Users,           label: 'Tim',       ownerOnly: true },
  { to: '/app/settings',  icon: Settings,        label: 'Pengaturan' },
  { to: '/app/billing',   icon: CreditCard,      label: 'Billing',   ownerOnly: true },
]

const s = {
  sidebar:     { background: 'var(--c-surface)', borderColor: 'var(--c-border)' },
  border:      { borderColor: 'var(--c-border)' },
  text2:       { color: 'var(--c-text-2)' },
  text3:       { color: 'var(--c-text-3)' },
  navActive:   { background: 'var(--c-brand-muted)', color: 'var(--c-brand)' },
  navInactive: { color: 'var(--c-text-3)' },
}

function playNotifSound() {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type            = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch {}
}

function SidebarContent({ onClose, pendingCount }) {
  const { signOut, profile, tenant } = useAuthStore()
  const isOwner = profile?.role === 'owner'
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--c-surface)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b" style={s.border}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
            <span className="text-black text-xs font-black">C</span>
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--c-text)' }}>CasBos</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="transition-colors" style={s.text3}
            onMouseOver={e => e.currentTarget.style.color = 'var(--c-text)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Tenant */}
      <div className="px-4 py-2.5 border-b" style={s.border}>
        <p className="text-xs truncate" style={s.text3}>{tenant?.name || 'Toko Saya'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2.5 space-y-0.5 overflow-y-auto">
        {navItems.filter(item => !item.ownerOnly || isOwner).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all relative"
            style={({ isActive }) => isActive ? s.navActive : s.navInactive}
            onMouseOver={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--c-overlay)' }}
            onMouseOut={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'transparent' }}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} style={{ color: isActive ? 'var(--c-brand)' : 'var(--c-text-3)' }} />
                <span className="flex-1" style={{ color: isActive ? 'var(--c-brand)' : 'var(--c-text-2)', fontWeight: isActive ? 500 : 400 }}>
                  {label}
                </span>
                {to === '/app/kasir' && pendingCount > 0 && (
                  <span className="ml-auto text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-black"
                    style={{ background: 'var(--c-brand)' }}>
                    {pendingCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t space-y-1" style={s.border}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full transition-all"
          style={s.text2}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--c-overlay)'; e.currentTarget.style.color = 'var(--c-text)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-2)' }}
        >
          {theme === 'dark'
            ? <><Sun size={14} /><span>Light mode</span></>
            : <><Moon size={14} /><span>Dark mode</span></>
          }
        </button>

        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--c-brand)', color: '#000' }}>
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--c-text)' }}>{profile?.full_name || 'Pengguna'}</p>
            <p className="text-xs capitalize" style={s.text3}>{profile?.role}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm w-full transition-all"
          style={s.text3}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--c-danger-muted)'; e.currentTarget.style.color = 'var(--c-danger-text)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-3)' }}
        >
          <LogOut size={14} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (!tenant?.id) return

    // Fetch initial count
    supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count || 0))

    // Realtime subscription
    const channel = supabase
      .channel('layout-orders-' + tenant.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenant.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
          setPendingCount(n => n + 1)
          playNotifSound()
        } else if (payload.eventType === 'UPDATE') {
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            setPendingCount(n => Math.max(0, n - 1))
          }
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [tenant?.id])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--c-bg)' }}>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-56 fixed h-full z-20 border-r" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
        <SidebarContent pendingCount={pendingCount} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Mobile */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 z-40 border-r transform transition-transform duration-200 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} pendingCount={pendingCount} />
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b sticky top-0 z-10" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
          <button onClick={() => setSidebarOpen(true)} className="transition-colors" style={{ color: 'var(--c-text-3)' }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--c-text)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--c-text-3)'}
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--c-brand)' }}>
              <span className="text-black text-xs font-black">C</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--c-text)' }}>CasBos</span>
          </div>
          {/* Badge mobile topbar */}
          {pendingCount > 0 && (
            <NavLink to="/app/kasir" className="relative">
              <Bell size={18} style={{ color: 'var(--c-text-3)' }} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center text-black"
                style={{ background: 'var(--c-brand)', fontSize: '10px' }}>
                {pendingCount}
              </span>
            </NavLink>
          )}
        </header>

        <TrialBanner />
        <main className="flex-1 p-5 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
