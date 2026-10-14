import { createContext, useContext } from 'react'

// 'fun' (neon, animated) or 'formal' (same layout, quiet styling, no motion).
export const ViewModeContext = createContext('fun')

export const useViewMode = () => useContext(ViewModeContext)
export const useIsFormal = () => useContext(ViewModeContext) === 'formal'
