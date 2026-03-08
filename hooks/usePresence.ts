"use client"

import { useEffect, useRef } from "react"
import { ref, set, remove, onValue, onDisconnect } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { PresenceUser } from "@/types"

interface UsePresenceProps {
    docId: string
    uid: string
    displayName: string
    color: string
    activeCell: string
}

export function usePresence({ docId, uid, displayName, color, activeCell }: UsePresenceProps) {
    // Random session ID per tab — handles same user in multiple tabs
    const sessionId = useRef(`${uid}_${Math.random().toString(36).slice(2)}`)
    const presenceRef = useRef(ref(rtdb, `presence/${docId}/${sessionId.current}`))

    // Join presence on mount, leave on unmount
    useEffect(() => {
        const data: PresenceUser = {
            uid,
            displayName,
            color,
            activeCell,
            sessionId: sessionId.current,
        }

        // Write our presence to RTDB
        set(presenceRef.current, data)

        // Tell Firebase to remove our entry if connection drops
        // Must be called immediately — not in cleanup
        onDisconnect(presenceRef.current).remove()

        // Remove presence when user navigates away
        return () => {
            remove(presenceRef.current)
        }
    }, [uid, displayName, color])

    // Update active cell whenever user moves to a different cell
    useEffect(() => {
        if (!uid) return
        set(presenceRef.current, {
            uid,
            displayName,
            color,
            activeCell,
            sessionId: sessionId.current,
        })
    }, [activeCell, uid, displayName, color])

    // Subscribe to all users currently in this document
    const subscribeToPresence = (callback: (users: PresenceUser[]) => void) => {
        const docPresenceRef = ref(rtdb, `presence/${docId}`)
        const unsubscribe = onValue(docPresenceRef, (snapshot) => {
            const data = snapshot.val() as Record<string, PresenceUser> | null
            if (!data) {
                callback([])
                return
            }

            // Deduplicate by uid — same user in multiple tabs shows once in avatar stack
            // but their active cell cursor still shows for each tab independently
            const seen = new Set<string>()
            const users = Object.values(data).filter((user) => {
                if (seen.has(user.uid)) return false
                seen.add(user.uid)
                return true
            })

            callback(users)
        })

        return unsubscribe
    }

    return { subscribeToPresence, sessionId: sessionId.current }
}