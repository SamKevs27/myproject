import { useEffect, useState } from 'react'
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { app } from './firebase'

// Client-side check is only for a friendly message. Firestore rules are what
// actually enforce who can write (see firestore.rules).
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase()

const auth = app ? getAuth(app) : null

export function isAdminUser(user) {
  if (!user?.email) return false
  return !ADMIN_EMAIL || user.email.toLowerCase() === ADMIN_EMAIL
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export function signOutAdmin() {
  return signOut(auth)
}

export function useAuthUser() {
  const [state, setState] = useState({ user: null, ready: !auth })

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, (user) => setState({ user, ready: true }))
  }, [])

  return state
}
