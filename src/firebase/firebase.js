import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

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

console.log('Do we have the map?', hasFirebaseConfig)

let db = null
let analytics = null

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  if (firebaseConfig.measurementId) {
    analytics = getAnalytics(app)
  }
}

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  if (firebaseConfig.measurementId) {
    analytics = getAnalytics(app)
  }

  // 👇 add this part
  import('firebase/firestore').then(async ({ collection, getDocs }) => {
    try {
      const snap = await getDocs(collection(db, 'your-collection-name'))
      console.log('✅ Connected to Firestore! Number of toys found:', snap.size)
    } catch (err) {
      console.error('❌ Uh oh, something went wrong:', err.code, err.message)
    }
  })
}

export { analytics, db }
