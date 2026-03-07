"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const { user, loading, isNewUser, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (isNewUser) {
        router.push("/onboarding")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, loading, isNewUser, router])

  const formatError = (code: string): string => {
    switch (code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password."
      case "auth/user-not-found":
        return "No account found with this email."
      case "auth/email-already-in-use":
        return "An account with this email already exists."
      case "auth/weak-password":
        return "Password must be at least 6 characters."
      case "auth/invalid-email":
        return "Please enter a valid email address."
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed. Please try again."
      default:
        return "Something went wrong. Please try again."
    }
  }

  const handleEmailSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    setError("")
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      setError(formatError(code))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError("")
    setSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      setError(formatError(code))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-slate-900 rounded-sm flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" fill="#ffffff" />
                <rect x="9" y="1" width="6" height="6" fill="#ffffff" />
                <rect x="1" y="9" width="6" height="6" fill="#ffffff" />
                <rect x="9" y="9" width="6" height="6" fill="#ffffff" opacity="0.3" />
              </svg>
            </div>
            <span className="text-slate-900 text-xl font-semibold tracking-tight">Sheetly</span>
          </div>
          <p className="text-slate-500 text-sm">
            {isSignUp ? "Create an account to get started" : "Sign in to your workspace"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 backdrop-blur-sm">

          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.51-1.39 2.4-3.44 2.4-5.88z" fill="#4285F4"/>
              <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.58-2a4.8 4.8 0 0 1-2.72.76 4.8 4.8 0 0 1-4.52-3.32H.82v2.06A8 8 0 0 0 8 16z" fill="#34A853"/>
              <path d="M3.48 9.5A4.86 4.86 0 0 1 3.23 8c0-.52.09-1.02.25-1.5V4.44H.82A8.02 8.02 0 0 0 0 8c0 1.29.31 2.51.82 3.56L3.48 9.5z" fill="#FBBC05"/>
              <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A7.93 7.93 0 0 0 8 0 8 8 0 0 0 .82 4.44L3.48 6.5A4.8 4.8 0 0 1 8 3.18z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError("") }}
              className={`flex-1 py-1.5 text-sm rounded-md transition-all duration-200 ${
                !isSignUp
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-500 hover:text-slate-900/80"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError("") }}
              className={`flex-1 py-1.5 text-sm rounded-md transition-all duration-200 ${
                isSignUp
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-500 hover:text-slate-900/80"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mb-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:bg-slate-100 transition-all"
            />
          </div>

          {/* Password input */}
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 focus:bg-slate-200 transition-all"
            />
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleEmailSubmit}
            disabled={submitting}
            className="w-full bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-900 text-sm font-medium py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </span>
            ) : (
              isSignUp ? "Create account" : "Sign in"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
