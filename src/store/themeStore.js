import { create } from 'zustand'

// Auto theme berdasarkan waktu (06:00-18:00 = light, selainnya = dark)
const getAutoTheme = () => {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

// Cek apakah user pernah toggle manual
const hasManualPreference = () => localStorage.getItem('theme-manual') === 'true'

const getInitialTheme = () => {
  // Kalau user pernah set manual, pakai pilihan user
  if (hasManualPreference()) {
    return localStorage.getItem('theme') || getAutoTheme()
  }
  // Kalau belum pernah set manual, pakai auto berdasarkan jam
  return getAutoTheme()
}

const initialTheme = getInitialTheme()
document.documentElement.setAttribute('data-theme', initialTheme)

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  isAuto: !hasManualPreference(),

  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    localStorage.setItem('theme-manual', 'true') // Tandai sudah manual
    return { theme: next, isAuto: false }
  }),

  // Reset ke auto mode
  setAutoTheme: () => {
    localStorage.removeItem('theme-manual')
    const auto = getAutoTheme()
    document.documentElement.setAttribute('data-theme', auto)
    set({ theme: auto, isAuto: true })
  },

  // Check & update theme berdasarkan waktu (dipanggil periodic)
  updateAutoTheme: () => set((state) => {
    if (!state.isAuto) return state // Skip kalau user sudah set manual
    const auto = getAutoTheme()
    if (auto !== state.theme) {
      document.documentElement.setAttribute('data-theme', auto)
      return { theme: auto }
    }
    return state
  }),
}))

// Auto-update theme setiap 1 menit (cek perubahan jam)
setInterval(() => {
  const store = useThemeStore.getState()
  store.updateAutoTheme()
}, 60000)
