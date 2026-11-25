import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Palette = 'pink' | 'neon'
export type ModePref = 'system' | 'light' | 'dark'
const KEY = 'keuanganku.theme'

function read(): { palette: Palette; mode: ModePref } {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return {
      palette: v.palette === 'neon' ? 'neon' : 'pink',
      mode: v.mode === 'light' || v.mode === 'dark' ? v.mode : 'system',
    }
  } catch {
    return { palette: 'pink', mode: 'system' }
  }
}

function apply(palette: Palette, mode: ModePref) {
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const el = document.documentElement
  el.dataset.theme = palette
  el.dataset.mode = dark ? 'dark' : 'light'
  const bg = getComputedStyle(el).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

interface ThemeCtx {
  palette: Palette
  mode: ModePref
  setPalette: (p: Palette) => void
  setMode: (m: ModePref) => void
}
const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(read)

  useEffect(() => {
    apply(state.palette, state.mode)
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* penyimpanan tidak tersedia */
    }
    if (state.mode !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply(state.palette, state.mode)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [state])

  const value = useMemo<ThemeCtx>(
    () => ({
      ...state,
      setPalette: (palette) => setState((s) => ({ ...s, palette })),
      setMode: (mode) => setState((s) => ({ ...s, mode })),
    }),
    [state],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme harus di dalam ThemeProvider')
  return v
}
