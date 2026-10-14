import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

let app = null
let db = null

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig)

  db = initializeFirestore(app, {
    useFetchStreams: false, // disables the persistent long-polling channel
  })

  // Analytics is loaded lazily so it stays out of the main bundle.
  if (firebaseConfig.measurementId) {
    import('firebase/analytics')
      .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => ok && getAnalytics(app)))
      .catch(() => {})
  }
}

export { app, db }
