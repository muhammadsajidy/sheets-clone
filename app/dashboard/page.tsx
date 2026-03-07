"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { addDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SheetDocument } from "@/types"

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [documents, setDocuments] = useState<SheetDocument[]>([])
  const [fetching, setFetching] = useState(true)
  const [creating, setCreating] = useState(false)

  const createDocument = async () => {
    if (!user) return
    setCreating(true)
    try {
      const newDoc = await addDoc(collection(db, "documents"), {
        title: "Untitled Sheet",
        ownerId: user.uid,
        collaborators: [user.uid],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      router.push(`/doc/${newDoc.id}`)
    } catch (err) {
      console.error("Failed to create document:", err)
      setCreating(false)
    }
  }
  
  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return

    const fetchDocuments = async () => {
      const q = query(
        collection(db, "documents"),
        where("collaborators", "array-contains", user.uid),
        orderBy("updatedAt", "desc")
      )
      const snapshot = await getDocs(q)
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SheetDocument[]
      setDocuments(docs)
      setFetching(false)
    }
    fetchDocuments()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 font-semibold tracking-tight">Sheetly</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: user?.color }}
          />
          <span className="text-slate-600 text-sm">{user?.displayName}</span>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-slate-900 font-semibold text-lg">My Sheets</h1>
          <button
            onClick={createDocument}
            disabled={creating}
            className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {creating ? "Creating..." : "+ New Sheet"}
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-slate-500 text-sm">No sheets yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/doc/${doc.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-slate-200 transition-all"
              >
                <p className="text-slate-900 font-medium text-sm mb-2 truncate">{doc.title}</p>
                <p className="text-slate-400 text-xs">
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
                {doc.ownerId === user?.uid && (
                  <span className="mt-3 inline-block text-xs text-slate-400 border border-slate-300 px-2 py-0.5 rounded-full">
                    Owner
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
