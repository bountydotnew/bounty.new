import { useCallback, useState } from "react"

export interface StoredDraft {
  id: string
  title: string
  description: string
  amount: string
  createdAt: string
  requirements: string
  deliverables: string
}

const DRAFTS_STORAGE_KEY = "bounty-drafts"
const ACTIVE_DRAFT_KEY = "active-draft-id"

export function useDrafts() {
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(ACTIVE_DRAFT_KEY)
  })
  const getDrafts = useCallback((): StoredDraft[] => {
    if (typeof window === "undefined") return []
    
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }, [])

  const saveDraft = useCallback((title: string, description: string, amount: string, requirements: string, deliverables: string): string => {
    if (typeof window === "undefined") return ""
    
    const draftId = Date.now().toString()
    const newDraft: StoredDraft = {
      id: draftId,
      title,
      description,
      amount,
      createdAt: new Date().toISOString(),
      requirements,
      deliverables,
    }

    const existingDrafts = getDrafts()
    const updatedDrafts = [...existingDrafts, newDraft]
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts))
    
    return draftId
  }, [getDrafts])

  const getDraft = useCallback((id: string): StoredDraft | null => {
    const drafts = getDrafts()
    return drafts.find(draft => draft.id === id) || null
  }, [getDrafts])

  const deleteDraft = useCallback((id: string): void => {
    if (typeof window === "undefined") return
    
    const drafts = getDrafts()
    const filteredDrafts = drafts.filter(draft => draft.id !== id)
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filteredDrafts))
  }, [getDrafts])

  const clearAllDrafts = useCallback((): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(DRAFTS_STORAGE_KEY)
    localStorage.removeItem(ACTIVE_DRAFT_KEY)
    setActiveDraftId(null)
  }, [])

  const setActiveDraft = useCallback((id: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(ACTIVE_DRAFT_KEY, id)
    setActiveDraftId(id)
  }, [])

  const clearActiveDraft = useCallback((): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(ACTIVE_DRAFT_KEY)
    setActiveDraftId(null)
  }, [])

  const deleteActiveDraft = useCallback((): void => {
    if (!activeDraftId) return
    deleteDraft(activeDraftId)
    clearActiveDraft()
  }, [activeDraftId, deleteDraft, clearActiveDraft])

  return {
    getDrafts,
    saveDraft,
    getDraft,
    deleteDraft,
    clearAllDrafts,
    setActiveDraft,
    clearActiveDraft,
    deleteActiveDraft,
    activeDraftId,
  }
} 