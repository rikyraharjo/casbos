import { create } from 'zustand'

const saved = localStorage.getItem('theme') || 'dark'
document.documentElement.setAttribute('data-theme', saved)

export const useThemeStore = create((set) => ({
  theme: saved,
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    return { theme: next }
  }),
}))
