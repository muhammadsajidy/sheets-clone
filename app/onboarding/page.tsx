"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
]

export default function OnboardingPage() {
  const { user, loading, isNewUser, updateUser, logout } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
    if (!loading && user && !isNewUser) {
      router.push("/dashboard")
    }
  }, [user, loading, isNewUser, router])

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError("Please enter a display name.")
      return
    }
    if (!selectedColor) {
      setError("Please pick a color.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      await updateUser(displayName.trim(), selectedColor)
      router.push("/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !isNewUser) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">

      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-white rounded-sm flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" fill="#0a0a0a" />
                <rect x="9" y="1" width="6" height="6" fill="#0a0a0a" />
                <rect x="1" y="9" width="6" height="6" fill="#0a0a0a" />
                <rect x="9" y="9" width="6" height="6" fill="#0a0a0a" opacity="0.3" />
              </svg>
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">Sheetly</span>
          </div>
          <p className="text-white/40 text-sm">One last step before you get started</p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-xl p-6 backdrop-blur-sm">

          <h2 className="text-white font-medium mb-1">Set up your profile</h2>
          <p className="text-white/40 text-sm mb-6">
            Your name and color will be visible to collaborators in real time.
          </p>

          <div className="mb-5">
            <label className="block text-white/60 text-xs mb-2 uppercase tracking-wider">
              Display name
            </label>
            <input
              type="text"
              placeholder="e.g. Arjun"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              maxLength={32}
              className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div className="mb-6">
            <label className="block text-white/60 text-xs mb-3 uppercase tracking-wider">
              Your presence color
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 ${
                    selectedColor === color
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {displayName.trim() && selectedColor && (
            <div className="mb-5 px-3 py-2.5 bg-white/3 border border-white/6 rounded-lg flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ backgroundColor: selectedColor }}
              >
                {displayName.trim()[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{displayName.trim()}</p>
                <p className="text-white/30 text-xs">This is how others will see you</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-white text-black text-sm font-medium py-2.5 rounded-lg hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Setting up...
              </span>
            ) : (
              "Continue to dashboard →"
            )}
          </button>

          <button
            onClick={async () => {
              await logout()
            }}
            disabled={submitting}
            className="w-full mt-4 text-white/40 text-xs font-medium hover:text-white transition-colors"
          >
            Sign out and start over
          </button>
        </div>
      </div>
    </div>
  )
}