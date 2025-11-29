import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/supabase'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Type assertion helper for tables not in auto-generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ============================================================================
// TYPES
// ============================================================================

export type HouseholdRole = 'owner' | 'member' | 'dependent'
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  is_shadow: boolean
  managed_by_household_id: string | null
  created_at: string
  updated_at: string
}

export interface Household {
  id: string
  name: string
  owner_id: string | null
  description: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: HouseholdRole
  is_primary: boolean
  invited_by: string | null
  joined_at: string
  created_at: string
  updated_at: string
}

export interface HouseholdMemberWithProfile extends HouseholdMember {
  profile: Profile
}

export interface HouseholdWithMembership extends Household {
  membership: HouseholdMember
}

export interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  status: ConnectionStatus
  message: string | null
  created_at: string
  updated_at: string
  accepted_at: string | null
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const identityKeys = {
  all: ['identity'] as const,
  profiles: () => [...identityKeys.all, 'profiles'] as const,
  profile: (id: string) => [...identityKeys.profiles(), id] as const,
  currentProfile: (userId: string) => [...identityKeys.profiles(), 'current', userId] as const,
  households: () => [...identityKeys.all, 'households'] as const,
  userHouseholds: (userId: string) => [...identityKeys.households(), 'user', userId] as const,
  primaryHousehold: (userId: string) => [...identityKeys.households(), 'primary', userId] as const,
  householdMembers: (householdId: string) => [...identityKeys.households(), householdId, 'members'] as const,
  householdProfiles: (householdId: string) => [...identityKeys.households(), householdId, 'profiles'] as const,
  connections: () => [...identityKeys.all, 'connections'] as const,
  userConnections: (userId: string) => [...identityKeys.connections(), 'user', userId] as const,
}

// ============================================================================
// ZUSTAND STORE - Active Household Context
// ============================================================================

interface HouseholdContextStore {
  /** Currently active household ID (local state for instant UI updates) */
  activeHouseholdId: string | null
  /** Set the active household (local state) */
  setActiveHousehold: (householdId: string | null) => void
}

export const useHouseholdContextStore = create<HouseholdContextStore>()(
  persist(
    (set) => ({
      activeHouseholdId: null,
      setActiveHousehold: (householdId) => set({ activeHouseholdId: householdId }),
    }),
    {
      name: 'lifeos-household-context',
    }
  )
)

// ============================================================================
// PROFILE HOOKS
// ============================================================================

/**
 * Get the current user's profile
 */
export function useCurrentProfile() {
  const { user } = useAuth()

  return useQuery<Profile | null, Error>({
    queryKey: identityKeys.currentProfile(user?.id || 'anonymous'),
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null

      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Profile might not exist yet
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data as Profile
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get a specific profile by ID
 */
export function useProfile(profileId: string | null) {
  return useQuery<Profile | null, Error>({
    queryKey: identityKeys.profile(profileId || 'null'),
    queryFn: async (): Promise<Profile | null> => {
      if (!profileId) return null

      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single()

      if (error) throw error
      return data as Profile
    },
    enabled: !!profileId,
  })
}

/**
 * Update the current user's profile
 */
export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, Partial<Profile>>({
    mutationFn: async (updates): Promise<Profile> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await db
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => {
      queryClient.setQueryData(identityKeys.currentProfile(user!.id), data)
      queryClient.invalidateQueries({ queryKey: identityKeys.profiles() })
    },
  })
}

// ============================================================================
// HOUSEHOLD HOOKS
// ============================================================================

/**
 * Get all households the current user belongs to
 */
export function useHouseholds() {
  const { user } = useAuth()

  return useQuery<HouseholdWithMembership[], Error>({
    queryKey: identityKeys.userHouseholds(user?.id || 'anonymous'),
    queryFn: async (): Promise<HouseholdWithMembership[]> => {
      if (!user) return []

      // Get memberships with household data
      const { data: memberships, error } = await db
        .from('household_members')
        .select(`
          *,
          household:households(*)
        `)
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })

      if (error) throw error

      return (memberships || []).map((m: any) => ({
        ...m.household,
        membership: {
          id: m.id,
          household_id: m.household_id,
          user_id: m.user_id,
          role: m.role,
          is_primary: m.is_primary,
          invited_by: m.invited_by,
          joined_at: m.joined_at,
          created_at: m.created_at,
          updated_at: m.updated_at,
        },
      })) as HouseholdWithMembership[]
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get the user's primary (active) household
 */
export function usePrimaryHousehold() {
  const { user } = useAuth()
  const { activeHouseholdId, setActiveHousehold } = useHouseholdContextStore()

  const query = useQuery<HouseholdWithMembership | null, Error>({
    queryKey: identityKeys.primaryHousehold(user?.id || 'anonymous'),
    queryFn: async (): Promise<HouseholdWithMembership | null> => {
      if (!user) return null

      const { data, error } = await db
        .from('household_members')
        .select(`
          *,
          household:households(*)
        `)
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (error) {
        // No primary household set - might need initialization
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        ...data.household,
        membership: {
          id: data.id,
          household_id: data.household_id,
          user_id: data.user_id,
          role: data.role,
          is_primary: data.is_primary,
          invited_by: data.invited_by,
          joined_at: data.joined_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      } as HouseholdWithMembership
    },
    enabled: !!user,
  })

  // Sync local store with DB on initial load
  if (query.data && !activeHouseholdId) {
    setActiveHousehold(query.data.id)
  }

  return {
    ...query,
    // Return local active ID for instant UI updates
    activeHouseholdId: activeHouseholdId || query.data?.id || null,
  }
}

/**
 * Switch the active/primary household
 * Updates local state immediately for snappy UI, then syncs to DB
 */
export function useSwitchHousehold() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { setActiveHousehold } = useHouseholdContextStore()

  return useMutation<boolean, Error, string>({
    mutationFn: async (householdId): Promise<boolean> => {
      if (!user) throw new Error('Not authenticated')

      // Call the DB function to switch primary
      const { data, error } = await db.rpc('switch_primary_household', {
        p_user_id: user.id,
        p_new_household_id: householdId,
      })

      if (error) throw error
      return data as boolean
    },
    onMutate: async (householdId) => {
      // Optimistically update local state for instant UI response
      setActiveHousehold(householdId)
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: identityKeys.households() })
    },
    onError: (_error, _householdId, _context) => {
      // Revert local state on error
      queryClient.invalidateQueries({ queryKey: identityKeys.primaryHousehold(user!.id) })
    },
  })
}

/**
 * Get all members of a specific household (including shadow users)
 */
export function useHouseholdMembers(householdId: string | null) {
  return useQuery<HouseholdMemberWithProfile[], Error>({
    queryKey: identityKeys.householdMembers(householdId || 'null'),
    queryFn: async (): Promise<HouseholdMemberWithProfile[]> => {
      if (!householdId) return []

      const { data, error } = await db
        .from('household_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('household_id', householdId)
        .order('role', { ascending: true })

      if (error) throw error

      return (data || []).map((m: any) => ({
        ...m,
        profile: m.profile,
      })) as HouseholdMemberWithProfile[]
    },
    enabled: !!householdId,
  })
}

/**
 * Get all profiles visible in a household (members + shadow users)
 * This is useful for "assignee" dropdowns in task forms
 */
export function useHouseholdProfiles(householdId: string | null) {
  return useQuery<Profile[], Error>({
    queryKey: identityKeys.householdProfiles(householdId || 'null'),
    queryFn: async (): Promise<Profile[]> => {
      if (!householdId) return []

      // Get all member profiles
      const { data: members, error: membersError } = await db
        .from('household_members')
        .select(`
          profile:profiles(*)
        `)
        .eq('household_id', householdId)

      if (membersError) throw membersError

      // Get all shadow profiles managed by this household
      const { data: shadows, error: shadowsError } = await db
        .from('profiles')
        .select('*')
        .eq('is_shadow', true)
        .eq('managed_by_household_id', householdId)

      if (shadowsError) throw shadowsError

      // Combine and dedupe
      const memberProfiles = (members || []).map((m: any) => m.profile) as Profile[]
      const shadowProfiles = (shadows || []) as Profile[]
      
      // Use Map to dedupe by ID
      const profileMap = new Map<string, Profile>()
      ;[...memberProfiles, ...shadowProfiles].forEach(p => {
        if (p) profileMap.set(p.id, p)
      })

      return Array.from(profileMap.values())
    },
    enabled: !!householdId,
  })
}

// ============================================================================
// SHADOW USER HOOKS
// ============================================================================

/**
 * Create a shadow user (kid/dependent) in a household
 */
export function useCreateShadowUser() {
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, { householdId: string; fullName: string; avatarUrl?: string }>({
    mutationFn: async ({ householdId, fullName, avatarUrl }): Promise<Profile> => {
      // Create the shadow profile
      const { data: profile, error: profileError } = await db
        .from('profiles')
        .insert({
          full_name: fullName,
          avatar_url: avatarUrl || null,
          is_shadow: true,
          managed_by_household_id: householdId,
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Add to household_members as dependent
      const { error: memberError } = await db
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: profile.id,
          role: 'dependent',
          is_primary: false,
        })

      if (memberError) {
        // Rollback profile creation
        await db.from('profiles').delete().eq('id', profile.id)
        throw memberError
      }

      return profile as Profile
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: identityKeys.householdMembers(data.managed_by_household_id!) 
      })
      queryClient.invalidateQueries({ 
        queryKey: identityKeys.householdProfiles(data.managed_by_household_id!) 
      })
    },
  })
}

/**
 * Update a shadow user profile
 */
export function useUpdateShadowUser() {
  const queryClient = useQueryClient()

  return useMutation<Profile, Error, { profileId: string; updates: Partial<Profile> }>({
    mutationFn: async ({ profileId, updates }): Promise<Profile> => {
      const { data, error } = await db
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .eq('is_shadow', true) // Safety: only update shadows
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: identityKeys.profile(data.id) })
      if (data.managed_by_household_id) {
        queryClient.invalidateQueries({ 
          queryKey: identityKeys.householdMembers(data.managed_by_household_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: identityKeys.householdProfiles(data.managed_by_household_id) 
        })
      }
    },
  })
}

/**
 * Delete a shadow user
 */
export function useDeleteShadowUser() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { profileId: string; householdId: string }>({
    mutationFn: async ({ profileId }): Promise<void> => {
      const { error } = await db
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .eq('is_shadow', true) // Safety: only delete shadows

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: identityKeys.householdMembers(variables.householdId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: identityKeys.householdProfiles(variables.householdId) 
      })
    },
  })
}

// ============================================================================
// HOUSEHOLD MANAGEMENT HOOKS
// ============================================================================

/**
 * Create a new household
 */
export function useCreateHousehold() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<Household, Error, { name: string; description?: string }>({
    mutationFn: async ({ name, description }): Promise<Household> => {
      if (!user) throw new Error('Not authenticated')

      // Create household
      const { data: household, error: householdError } = await db
        .from('households')
        .insert({
          name,
          description: description || null,
          owner_id: user.id,
        })
        .select()
        .single()

      if (householdError) throw householdError

      // Add creator as owner member
      const { error: memberError } = await db
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'owner',
          is_primary: false, // Don't auto-switch
        })

      if (memberError) {
        // Rollback
        await db.from('households').delete().eq('id', household.id)
        throw memberError
      }

      return household as Household
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.households() })
    },
  })
}

/**
 * Update a household
 */
export function useUpdateHousehold() {
  const queryClient = useQueryClient()

  return useMutation<Household, Error, { householdId: string; updates: Partial<Household> }>({
    mutationFn: async ({ householdId, updates }): Promise<Household> => {
      const { data, error } = await db
        .from('households')
        .update(updates)
        .eq('id', householdId)
        .select()
        .single()

      if (error) throw error
      return data as Household
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.households() })
    },
  })
}

/**
 * Invite a member to a household
 */
export function useInviteToHousehold() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<
    HouseholdMember, 
    Error, 
    { householdId: string; profileId: string; role?: HouseholdRole }
  >({
    mutationFn: async ({ householdId, profileId, role = 'member' }): Promise<HouseholdMember> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await db
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: profileId,
          role,
          is_primary: false,
          invited_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as HouseholdMember
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: identityKeys.householdMembers(variables.householdId) 
      })
    },
  })
}

/**
 * Remove a member from a household
 */
export function useRemoveFromHousehold() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { householdId: string; memberId: string }>({
    mutationFn: async ({ memberId }): Promise<void> => {
      const { error } = await db
        .from('household_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: identityKeys.householdMembers(variables.householdId) 
      })
    },
  })
}

// ============================================================================
// CONNECTION HOOKS (Social/Friends)
// ============================================================================

/**
 * Get all friends (accepted connections)
 */
export function useFriends() {
  const { user } = useAuth()

  return useQuery<Profile[], Error>({
    queryKey: [...identityKeys.userConnections(user?.id || 'anonymous'), 'friends'],
    queryFn: async (): Promise<Profile[]> => {
      if (!user) return []

      const { data, error } = await db.rpc('get_friends', {
        p_user_id: user.id,
      })

      if (error) throw error

      return (data || []).map((f: any) => ({
        id: f.friend_id,
        full_name: f.full_name,
        avatar_url: f.avatar_url,
        email: f.email,
        is_shadow: false,
        managed_by_household_id: null,
        created_at: f.connected_since,
        updated_at: f.connected_since,
      })) as Profile[]
    },
    enabled: !!user,
  })
}

/**
 * Get pending friend requests (incoming)
 */
export function usePendingRequests() {
  const { user } = useAuth()

  return useQuery<Array<{ connection: Connection; profile: Profile }>, Error>({
    queryKey: [...identityKeys.userConnections(user?.id || 'anonymous'), 'pending'],
    queryFn: async (): Promise<Array<{ connection: Connection; profile: Profile }>> => {
      if (!user) return []

      const { data, error } = await db.rpc('get_pending_requests', {
        p_user_id: user.id,
      })

      if (error) throw error

      return (data || []).map((r: any) => ({
        connection: {
          id: r.connection_id,
          requester_id: r.requester_id,
          receiver_id: user.id,
          status: 'pending' as ConnectionStatus,
          message: r.message,
          created_at: r.requested_at,
          updated_at: r.requested_at,
          accepted_at: null,
        },
        profile: {
          id: r.requester_id,
          full_name: r.full_name,
          avatar_url: r.avatar_url,
          email: null,
          is_shadow: false,
          managed_by_household_id: null,
          created_at: r.requested_at,
          updated_at: r.requested_at,
        },
      }))
    },
    enabled: !!user,
  })
}

/**
 * Send a friend request
 */
export function useSendConnectionRequest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<string, Error, { toUserId: string; message?: string }>({
    mutationFn: async ({ toUserId, message }): Promise<string> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await db.rpc('send_connection_request', {
        p_from_user_id: user.id,
        p_to_user_id: toUserId,
        p_message: message || null,
      })

      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.connections() })
    },
  })
}

/**
 * Respond to a friend request (accept/decline)
 */
export function useRespondToRequest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<boolean, Error, { connectionId: string; accept: boolean }>({
    mutationFn: async ({ connectionId, accept }): Promise<boolean> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await db.rpc('respond_to_connection_request', {
        p_connection_id: connectionId,
        p_user_id: user.id,
        p_accept: accept,
      })

      if (error) throw error
      return data as boolean
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: identityKeys.connections() })
    },
  })
}

/**
 * Check if two users are connected (friends)
 */
export function useAreConnected(otherUserId: string | null) {
  const { user } = useAuth()

  return useQuery<boolean, Error>({
    queryKey: ['are-connected', user?.id, otherUserId],
    queryFn: async (): Promise<boolean> => {
      if (!user || !otherUserId) return false

      const { data, error } = await db.rpc('are_connected', {
        user_a: user.id,
        user_b: otherUserId,
      })

      if (error) throw error
      return data as boolean
    },
    enabled: !!user && !!otherUserId,
  })
}
