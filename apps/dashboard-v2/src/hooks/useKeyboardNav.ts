import { useEffect } from 'react'
import { useSelectionStore } from '../stores/selectionStore'

export function useKeyboardNav() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const { detailPanelOpen, closeDetail } = useSelectionStore.getState()
        if (detailPanelOpen) closeDetail()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
