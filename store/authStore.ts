import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  isSetup: boolean
  setAuthenticated: (v: boolean) => void
  setSetup: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isSetup: false,
  setAuthenticated: (v) => set({ isAuthenticated: v }),
  setSetup: (v) => set({ isSetup: v }),
}))
