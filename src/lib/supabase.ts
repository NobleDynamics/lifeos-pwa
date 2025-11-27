import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development Test Users
const DEV_TEST_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Test User 1 (Husband)', email: 'user1@lifeos.dev' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Test User 2 (Wife)', email: 'user2@lifeos.dev' },
]

// Set to true to bypass authentication and use test user
const USE_DEV_TEST_USER = true

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Zustand store for dev user management
interface DevUserStore {
  currentUserId: string
  setCurrentUserId: (id: string) => void
}

export const useDevUserStore = create<DevUserStore>()(
  persist(
    (set) => ({
      currentUserId: DEV_TEST_USERS[0].id,
      setCurrentUserId: (id: string) => set({ currentUserId: id }),
    }),
    {
      name: 'lifeos-dev-user',
    }
  )
)

// Get mock user object
function getMockUser(userId: string): User {
  const testUser = DEV_TEST_USERS.find(u => u.id === userId) || DEV_TEST_USERS[0]
  return {
    id: testUser.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: testUser.email,
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: testUser.name },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Custom hook for auth - returns mock user in development mode
export function useAuth() {
  const { currentUserId } = useDevUserStore()
  const [user, setUser] = useState<User | null>(USE_DEV_TEST_USER ? getMockUser(currentUserId) : null)
  const [loading, setLoading] = useState(!USE_DEV_TEST_USER)

  useEffect(() => {
    // In development mode with test user, use mock user
    if (USE_DEV_TEST_USER) {
      console.log('🔧 DEV MODE: Using test user ID:', currentUserId)
      setUser(getMockUser(currentUserId))
      setLoading(false)
      return
    }

    // Get initial session (production mode)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [currentUserId])

  return { user, loading }
}

// Export test users for use in settings
export const testUsers = DEV_TEST_USERS
