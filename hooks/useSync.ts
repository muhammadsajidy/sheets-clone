"use client"

import { useEffect, useRef, useCallback } from "react"
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { CellMap } from "@/types"

interface UseSyncProps {
  docId: string
  cells: CellMap
  loadCells: (initialCells: CellMap | ((prev: CellMap) => CellMap)) => void
  setSaveStatus: (status: "saved" | "saving" | "error") => void
}

export function useSync({ docId, cells, loadCells, setSaveStatus }: UseSyncProps) {
  // Tracks debounce timers per cell — each cell has its own timer
  // so editing one cell doesn't cancel the pending save for another
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Tracks which cells were written by a particular client
  const pendingWrites = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!docId) return

    const cellsRef = collection(db, "documents", docId, "cells")

    // First load — get all existing cells at once
    getDocs(cellsRef).then((snapshot) => {
      const initialCells: CellMap = {}
      snapshot.forEach((doc) => {
        initialCells[doc.id] = doc.data() as { raw: string; computed: string }
      })
      loadCells(initialCells)
    })

    // Real-time listener that fires whenever any cell changes
    const unsubscribe = onSnapshot(cellsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const cellId = change.doc.id

        // Skip changes that came from this particular client
        // no need to re-render since we already applied the changes
        if (pendingWrites.current.has(cellId)) {
          pendingWrites.current.delete(cellId)
          return
        }

        if (change.type === "added" || change.type === "modified") {
          // If another user edited this cell, we change our local state
          loadCells((prev) => ({
            ...prev,
            [cellId]: change.doc.data() as { raw: string; computed: string },
          }))
        }

        if (change.type === "removed") {
          // Another user cleared this cell
          loadCells((prev) => {
            const next = { ...prev }
            delete next[cellId]
            return next
          })
        }
      })
    })

    return () => unsubscribe()
  }, [docId, loadCells])

  // Debounce is per-cell — 1000ms after the user stops typing in that cell
  const saveCell = useCallback(
    (cellId: string, raw: string, computed: string) => {
      setSaveStatus("saving")

      // Clear any existing timer for this specific cell
      if (debounceTimers.current[cellId]) {
        clearTimeout(debounceTimers.current[cellId])
      }

      // Start a new timer — only saves after 1000ms of no typing in this cell
      debounceTimers.current[cellId] = setTimeout(async () => {
        try {
          const cellRef = doc(db, "documents", docId, "cells", cellId)

          // Mark this write as ours so onSnapshot skips it
          pendingWrites.current.add(cellId)

          if (raw === "") {
            await deleteDoc(cellRef)
          } else {
            await setDoc(cellRef, { raw, computed })
          }

          setSaveStatus("saved")
        } catch (err) {
          console.error("Failed to save cell:", err)
          setSaveStatus("error")
          // Remove from pending so next sync can recover this cell
          pendingWrites.current.delete(cellId)
        }
      }, 1000)
    },
    [docId, setSaveStatus]
  )

  return { saveCell }
}