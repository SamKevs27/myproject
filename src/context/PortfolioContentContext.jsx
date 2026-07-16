/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

import { hasFirebaseConfig } from '../firebase/firebase'
import {
  createCollectionItem,
  deleteCollectionItem,
  fetchCollectionItems,
  fetchContentDoc,
  updateCollectionItem,
  upsertContentDoc,
} from '../services/portfolioService'

const PortfolioContentContext = createContext(null)

function buildInitialState() {
  return {
    home: {},
    about: {},
    contact: {},
    skillsPage: {},
    skills: [],
    projects: [],
    experience: [],
  }
}

function updateListItemInState(items, id, payload) {
  return items.map((item) => (item.id === id ? { ...item, ...payload } : item))
}

function deleteListItemFromState(items, id) {
  return items.filter((item) => item.id !== id)
}

export function PortfolioContentProvider({ children }) {
  const [state, setState] = useState(() => ({
    ...buildInitialState(),
    loading: true,
    saving: false,
    error: '',
  }))

  const refreshContent = async ({ showLoading = false } = {}) => {
    if (!hasFirebaseConfig) {
      setState((prev) => ({
        ...prev,
        ...buildInitialState(),
        loading: false,
        error: 'Firebase env vars are missing.',
      }))
      return
    }

    try {
      setState((prev) => ({ ...prev, loading: showLoading, error: '' }))

      const [homeDoc, aboutDoc, contactDoc, skills, projects, experience] = await Promise.all([
        fetchContentDoc('home'),
        fetchContentDoc('about'),
        fetchContentDoc('contact'),
        fetchCollectionItems('skills'),
        fetchCollectionItems('projects'),
        fetchCollectionItems('experience'),
      ])

      const skillsPageDoc = await fetchContentDoc('skillsPage')

      setState((prev) => ({
        ...prev,
        home: homeDoc || {},
        about: aboutDoc || {},
        contact: contactDoc || {},
        skillsPage: skillsPageDoc || {},
        skills: skills || [],
        projects: projects || [],
        experience: experience || [],
        loading: false,
        error: '',
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        ...buildInitialState(),
        loading: false,
        error: err?.message || 'Failed to load content from Firestore.',
      }))
    }
  }

  useEffect(() => {
    refreshContent({ showLoading: true })
  }, [])

  const updateSingleton = async (docId, payload) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: '' }))
      await upsertContentDoc(docId, payload)
      setState((prev) => ({
        ...prev,
        [docId]: { ...(prev[docId] || {}), ...payload },
      }))
      return true
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err?.message || 'Failed to save content.',
      }))
      return false
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const createListItem = async (collectionName, payload) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: '' }))
      const docRef = await createCollectionItem(collectionName, payload)
      setState((prev) => ({
        ...prev,
        [collectionName]: [
          ...(prev[collectionName] || []),
          { id: docRef.id, ...payload },
        ],
      }))
      return true
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err?.message || `Failed to create item in ${collectionName}.`,
      }))
      return false
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const updateListItem = async (collectionName, id, payload) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: '' }))
      await updateCollectionItem(collectionName, id, payload)
      setState((prev) => ({
        ...prev,
        [collectionName]: updateListItemInState(prev[collectionName] || [], id, payload),
      }))
      return true
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err?.message || `Failed to update item in ${collectionName}.`,
      }))
      return false
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const deleteListItem = async (collectionName, id, currentItem) => {
    try {
      setState((prev) => ({ ...prev, saving: true, error: '' }))
      await deleteCollectionItem(collectionName, id)

      if (collectionName === 'projects') {
        const remainingProjects = await fetchCollectionItems('projects')
        const lingeringLegacyProject = remainingProjects.find((project) => {
          return (
            project.num === currentItem?.num &&
            project.title === currentItem?.title &&
            project.desc === currentItem?.desc
          )
        })
        if (lingeringLegacyProject) {
          await deleteCollectionItem('projects', lingeringLegacyProject.id)
        }
      }

      setState((prev) => ({
        ...prev,
        [collectionName]: deleteListItemFromState(prev[collectionName] || [], id),
      }))
      return true
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err?.message || `Failed to delete item from ${collectionName}.`,
      }))
      return false
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const value = {
    ...state,
    hasFirebaseConfig,
    refreshContent,
    updateSingleton,
    createListItem,
    updateListItem,
    deleteListItem,
  }

  return <PortfolioContentContext.Provider value={value}>{children}</PortfolioContentContext.Provider>
}

export function usePortfolioContent() {
  const ctx = useContext(PortfolioContentContext)
  if (!ctx) {
    throw new Error('usePortfolioContent must be used within PortfolioContentProvider')
  }
  return ctx
}
