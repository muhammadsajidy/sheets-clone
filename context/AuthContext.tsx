"use client"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { User } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  isNewUser: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (displayName: string, color: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  const fetchOrCreateUser = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, "users", firebaseUser.uid)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      setUser(userSnap.data() as User)
    } else {
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        color: "", // Will be set during onboarding
      })
      setIsNewUser(true)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser === null) {
        setUser(null)
        setIsNewUser(false)
      } else {
        await fetchOrCreateUser(firebaseUser)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isNewUser,
        signInWithGoogle: async () => {
          const provider = new GoogleAuthProvider()
          await signInWithPopup(auth, provider)
        },
        signInWithEmail: async (email, password) => {
          await signInWithEmailAndPassword(auth, email, password)
        },
        signUpWithEmail: async (email, password) => {
          await createUserWithEmailAndPassword(auth, email, password)
        },
        logout: async () => {
          await firebaseSignOut(auth)
          setUser(null)
        },
        updateUser: async (displayName, color) => {
          if (!user) return
          const updatedUser = { ...user, displayName, color }
          await setDoc(doc(db, "users", user.uid), updatedUser)
          setUser(updatedUser)
          setIsNewUser(false)
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}