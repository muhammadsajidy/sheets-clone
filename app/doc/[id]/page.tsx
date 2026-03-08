"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { SheetDocument, PresenceUser } from "@/types"
import FormulaBar from "@/components/FormulaBar"
import Grid from "@/components/Grid"
import PresenceBar from "@/components/PresenceBar"

export default function DocPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [docTitle, setDocTitle] = useState("Untitled Sheet")
    const [docLoading, setDocLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved")
    const [activeCell, setActiveCell] = useState("A1")
    const [activeCellRaw, setActiveCellRaw] = useState("")
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

    const handleTitleBlur = async () => {
        if (!id) return
        try {
            await updateDoc(doc(db, "documents", id), {
                title: docTitle,
                updatedAt: Date.now()
            })
        } catch {
            console.error("Failed to save title")
        }
    }

    useEffect(() => {
        if (!loading && !user) router.push("/")
    }, [loading, user, router])

    useEffect(() => {
        if (!user || !id) return

        const fetchDoc = async () => {
            const docRef = doc(db, "documents", id)
            const docSnap = await getDoc(docRef)

            if (!docSnap.exists()) {
                router.push("/dashboard")
                return
            }

            const data = docSnap.data() as SheetDocument
            setDocTitle(data.title)

            if (!data.collaborators.includes(user.uid)) {
                await updateDoc(docRef, {
                    collaborators: arrayUnion(user.uid)
                })
            }

            setDocLoading(false)
        }

        fetchDoc()
    }, [user, id, router])

    if (loading || docLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden text-gray-900">

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">

                {/* Left — back button */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="text-gray-500 hover:text-gray-900 text-sm transition-colors mr-4"
                >
                    ← Back
                </button>

                {/* Center — editable title */}
                <input
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="bg-transparent text-gray-900 text-sm font-medium text-center outline-none border-b border-transparent hover:border-gray-300 focus:border-gray-400 transition-colors w-48"
                />

                {/* Right — presence avatars + save status */}
                <div className="flex items-center gap-4 ml-4">

                    {/* Online users avatar stack */}
                    {user && (
                        <PresenceBar
                            docId={id}
                            uid={user.uid}
                            displayName={user.displayName}
                            color={user.color}
                            activeCell={activeCell}
                            onUsersChange={setOnlineUsers}
                        />
                    )}

                    {/* Save status indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${saveStatus === "saved" ? "bg-green-500" :
                                saveStatus === "saving" ? "bg-yellow-500" :
                                    "bg-red-500"
                            }`} />
                        <span className="text-gray-500 text-xs">
                            {saveStatus === "saved" ? "Saved" :
                                saveStatus === "saving" ? "Saving..." :
                                    "Error"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Formula bar */}
            <FormulaBar
                activeCellId={activeCell}
                rawValue={activeCellRaw}
                onChange={setActiveCellRaw}
                onCommit={() => { }}
            />

            {/* Grid */}
            <div className="flex-1 overflow-hidden">
                <Grid
                    docId={id}
                    setSaveStatus={setSaveStatus}
                    activeCell={activeCell}
                    setActiveCell={setActiveCell}
                    setActiveCellRaw={setActiveCellRaw}
                    onlineUsers={onlineUsers}
                    currentUid={user?.uid ?? ""}
                />
            </div>
        </div>
    )
}