import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  orderBy,
} from 'firebase/firestore'
import { db, hasFirebaseConfig } from '../firebase/firebase'


const CONTENT_COLLECTION = 'content'

function ensureFirebaseConfigured() {
  if (!hasFirebaseConfig || !db) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_* env variables to connect Firestore.')
  }
}

function sortByOrder(items) {
  return [...items].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
}

export async function fetchContentDoc(id) {
  ensureFirebaseConfigured()
  const snap = await getDoc(doc(db, CONTENT_COLLECTION, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function upsertContentDoc(id, payload) {
  ensureFirebaseConfigured()
  await setDoc(doc(db, CONTENT_COLLECTION, id), payload, { merge: true })
}

export async function fetchCollectionItems(collectionName) {
  ensureFirebaseConfigured()

  try {
    const q = query(collection(db, collectionName), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch {
    const snap = await getDocs(collection(db, collectionName))
    return sortByOrder(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }
}

export async function createCollectionItem(collectionName, payload) {
  ensureFirebaseConfigured()
  return addDoc(collection(db, collectionName), payload)
}

export async function updateCollectionItem(collectionName, id, payload) {
  ensureFirebaseConfigured()
  await updateDoc(doc(db, collectionName, id), payload)
}

export async function deleteCollectionItem(collectionName, id) {
  ensureFirebaseConfigured()
  await deleteDoc(doc(db, collectionName, id))
}

