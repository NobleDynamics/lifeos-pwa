import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development Test User ID - matches user in public.user_profiles
// Set to true to bypass authentication and use test user
const USE_DEV_TEST_USER = true
const DEV_TEST_USER_ID = 'ed6c2930-c87a-4f3b-9e25-429cdbc06ac3'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Mock user object for development testing
const mockDevUser: User = {
  id: DEV_TEST_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'testuser@lifeos.dev',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: 'Test User' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Custom hook for auth - returns mock user in development mode
export function useAuth() {
  const [user, setUser] = useState<User | null>(USE_DEV_TEST_USER ? mockDevUser : null)
  const [loading, setLoading] = useState(!USE_DEV_TEST_USER)

  useEffect(() => {
    // In development mode with test user, skip real auth
    if (USE_DEV_TEST_USER) {
      console.log('🔧 DEV MODE: Using test user ID:', DEV_TEST_USER_ID)
      setUser(mockDevUser)
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
  }, [])

  return { user, loading }
}

// Export the test user ID for use in other parts of the app
export const testUserId = DEV_TEST_USER_ID
