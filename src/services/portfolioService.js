import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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

  // Single fetch, sorted client-side. Avoids a second network round-trip
  // if a server-side orderBy() would fail due to a missing 'order' field
  // or an unbuilt composite index.
  const snap = await getDocs(collection(db, collectionName))
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return sortByOrder(items)
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