import { useCallback } from "react"

export interface StoredDraft {
  id: string
  title: string
  description: string
  amount: string
  createdAt: string
}

const DRAFTS_STORAGE_KEY = "bounty-drafts"

export function useDrafts() {
  const getDrafts = useCallback((): StoredDraft[] => {
    if (typeof window === "undefined") return []
    
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }, [])

  const saveDraft = useCallback((title: string, description: string, amount: string): string => {
    if (typeof window === "undefined") return ""
    
    const draftId = Date.now().toString()
    const newDraft: StoredDraft = {
      id: draftId,
      title,
      description,
      amount,
      createdAt: new Date().toISOString(),
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
  }, [])

  return {
    getDrafts,
    saveDraft,
    getDraft,
    deleteDraft,
    clearAllDrafts,
  }
} 