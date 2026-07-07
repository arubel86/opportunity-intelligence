export const theme = {
  colors: {
    bgBase: '#0a0e14',
    bgSurface: '#111824',
    bgElevated: '#1a2230',
    bgHover: '#1e2a3a',
    border: '#2a3441',
    borderSubtle: '#1e2530',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    accent: '#1f6feb',
    textLink: '#1f6feb',
    semanticBuy: '#238636',
    semanticNegotiate: '#d29922',
    semanticWatch: '#d96c1a',
    semanticWatchHigh: '#1f6feb',
    semanticAvoid: '#f85149',
    semanticNeutral: '#64748b',
    gradeA: '#238636',
    gradeB: '#1f6feb',
    gradeC: '#d29922',
    gradeD: '#f85149',
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sizes: {
    headerHeight: '60px',
    filterSidebarWidth: '240px',
    detailPanelWidth: '360px',
  },
} as const

export type Theme = typeof theme
