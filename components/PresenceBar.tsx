"use client"

import { useEffect, useState } from "react"
// force TS server refresh
import { usePresence } from "../hooks/usePresence"
import { PresenceUser } from "../types"

interface PresenceBarProps {
    docId: string
    uid: string
    displayName: string
    color: string
    activeCell: string
    onUsersChange: (users: PresenceUser[]) => void
}

export default function PresenceBar({ docId, uid, displayName, color, activeCell, onUsersChange }: PresenceBarProps) {
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
    const { subscribeToPresence } = usePresence({ docId, uid, displayName, color, activeCell })

    useEffect(() => {
        const unsubscribe = subscribeToPresence((users) => {
            setOnlineUsers(users)
            onUsersChange(users)
        })
        return () => unsubscribe()
    }, [docId])

    const maxVisible = 4
    const visibleUsers = onlineUsers.slice(0, maxVisible)
    const overflow = onlineUsers.length - maxVisible

    return (
        <div className="flex items-center gap-1">
            {visibleUsers.map((user) => (
                <div key={user.sessionId} className="relative group">
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-gray-50 cursor-default"
                        style={{ backgroundColor: user.color }}
                    >
                        {user.displayName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {user.displayName}
                        {user.uid === uid && " (you)"}
                    </div>
                </div>
            ))}
            {overflow > 0 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs ring-2 ring-gray-50">
                    +{overflow}
                </div>
            )}
        </div>
    )
}