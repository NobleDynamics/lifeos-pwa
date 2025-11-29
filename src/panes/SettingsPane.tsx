import { useState } from 'react'
import { 
  Settings, 
  GripHorizontal, 
  GripVertical, 
  User, 
  Palette, 
  Bell, 
  Wallet, 
  Shield, 
  ChevronRight, 
  Users, 
  ChevronDown,
  Home,
  Plus,
  Edit2,
  Baby,
  Crown,
  UserCheck
} from 'lucide-react'
import { useAppStore, type PaneType } from '@/store/useAppStore'
import { testUsers, useDevUserStore, useAuth } from '@/lib/supabase'
import { FormSheet, Avatar, AvatarPicker } from '@/components/shared'
import { 
  useCurrentProfile, 
  useUpdateProfile,
  useHouseholds,
  usePrimaryHousehold,
  useSwitchHousehold,
  useHouseholdMembers,
  useCreateShadowUser,
  Profile,
  HouseholdRole
} from '@/hooks/useIdentity'

// ============================================================================
// CONSTANTS
// ============================================================================

// Pane labels for display
const paneLabels: Record<PaneType, string> = {
  household: 'Household',
  health: 'Health',
  agenda: 'Agenda',
  chat: 'Chat',
  dashboard: 'Dashboard',
  feed: 'Feed',
  cloud: 'Cloud',
  finance: 'Finance',
  settings: 'Settings',
  sandbox: 'Sandbox',
}

const settingsSections = [
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme, accent color, layout' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Agent nags, reminders' },
  { id: 'billing', label: 'Billing', icon: Wallet, description: 'Token balance, usage' },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Data, permissions' },
]

// ============================================================================
// TYPES
// ============================================================================

type SheetMode = 'editProfile' | 'addDependent' | null

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Member row with avatar and role badge
 */
function MemberRow({ 
  profile, 
  role,
  isYou = false,
  onEdit
}: { 
  profile: Profile
  role: HouseholdRole
  isYou?: boolean
  onEdit?: () => void
}) {
  const getRoleBadge = () => {
    switch (role) {
      case 'owner':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        )
      case 'member':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
            <UserCheck className="w-3 h-3" />
            Member
          </span>
        )
      case 'dependent':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
            <Baby className="w-3 h-3" />
            Dependent
          </span>
        )
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-dark-100/50 rounded-lg">
      <Avatar 
        src={profile.avatar_url} 
        name={profile.full_name} 
        size="md" 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {profile.full_name || 'Unnamed'}
          </p>
          {isYou && (
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
              You
            </span>
          )}
        </div>
        {getRoleBadge()}
      </div>
      {profile.is_shadow && onEdit && (
        <button 
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
        >
          <Edit2 className="w-4 h-4 text-dark-400" />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// EDIT PROFILE SHEET
// ============================================================================

function EditProfileSheet({ 
  profile,
  onClose 
}: { 
  profile: Profile | null
  onClose: () => void 
}) {
  const updateProfile = useUpdateProfile()
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return

    setIsSubmitting(true)
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        avatar_url: avatarUrl || null,
      })
      onClose()
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormSheet title="Edit Profile" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-6">
        {/* Avatar Picker */}
        <AvatarPicker
          value={avatarUrl}
          onChange={setAvatarUrl}
          name={fullName}
          label="Avatar"
        />

        {/* Name Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400">
            Display Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-medium bg-dark-300 text-white hover:bg-dark-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim()}
            className="flex-1 py-3 rounded-lg font-medium bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </FormSheet>
  )
}

// ============================================================================
// ADD DEPENDENT SHEET
// ============================================================================

function AddDependentSheet({ 
  householdId,
  onClose 
}: { 
  householdId: string | null
  onClose: () => void 
}) {
  const createShadowUser = useCreateShadowUser()
  const [avatarUrl, setAvatarUrl] = useState('icon:Baby:#00EAFF')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!fullName.trim()) {
      setError('Name is required')
      return
    }
    if (!householdId) {
      setError('No household selected')
      return
    }

    setIsSubmitting(true)
    try {
      await createShadowUser.mutateAsync({
        householdId,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || undefined,
      })
      onClose()
    } catch (err) {
      console.error('Failed to create dependent:', err)
      setError('Failed to create dependent. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormSheet title="Add Dependent" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Avatar Picker */}
        <AvatarPicker
          value={avatarUrl}
          onChange={setAvatarUrl}
          name={fullName || 'New Dependent'}
          label="Avatar"
        />

        {/* Name Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400">
            Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Timmy, Max (dog)"
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <p className="text-xs text-dark-500">
            Dependents are kids, pets, or anyone without their own account
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-medium bg-dark-300 text-white hover:bg-dark-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim()}
            className="flex-1 py-3 rounded-lg font-medium bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Creating...' : 'Add Dependent'}
          </button>
        </div>
      </form>
    </FormSheet>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsPane() {
  // Original settings state
  const { paneOrder, updatePaneOrder, openDrawer } = useAppStore()
  const { currentUserId, setCurrentUserId } = useDevUserStore()
  const { user } = useAuth()
  const [showPaneEditor, setShowPaneEditor] = useState(false)
  const [showAccountSection, setShowAccountSection] = useState(true)
  const [showHouseholdSection, setShowHouseholdSection] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  // New household state
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const { data: currentProfile } = useCurrentProfile()
  const { data: households = [] } = useHouseholds()
  const { activeHouseholdId } = usePrimaryHousehold()
  const switchHousehold = useSwitchHousehold()
  const { data: householdMembers = [] } = useHouseholdMembers(activeHouseholdId)
  
  // Find active household
  const activeHousehold = households.find(h => h.id === activeHouseholdId)

  // Separate real users from shadow users (dependents)
  const realMembers = householdMembers.filter(m => !m.profile.is_shadow)
  const shadowMembers = householdMembers.filter(m => m.profile.is_shadow)

  // Original drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newOrder = [...paneOrder]
    const [dragged] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(index, 0, dragged)
    updatePaneOrder(newOrder)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId)
    // Force reload to refresh all data with new user
    window.location.reload()
  }

  // Handle household switch
  const handleHouseholdSwitch = (householdId: string) => {
    switchHousehold.mutate(householdId)
  }

  const currentUser = testUsers.find(u => u.id === currentUserId)

  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-primary" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Account Section with User Switcher */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowAccountSection(!showAccountSection)}
            className="w-full p-4 flex items-center gap-3 hover:bg-dark-100/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-medium">Account</h3>
              <p className="text-xs text-dark-500">Profile, sync, and login</p>
            </div>
            <ChevronDown size={18} className={`text-dark-500 transition-transform ${showAccountSection ? 'rotate-180' : ''}`} />
          </button>

          {showAccountSection && (
            <div className="px-4 pb-4 space-y-3">
              {/* Current User Display with Avatar */}
              <div className="bg-dark-200/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={currentProfile?.avatar_url}
                    name={currentProfile?.full_name || currentUser?.name}
                    size="lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{currentProfile?.full_name || currentUser?.name || 'Unknown User'}</p>
                    <p className="text-xs text-dark-500">{currentProfile?.email || currentUser?.email || user?.email}</p>
                    <p className="text-[10px] text-dark-600 font-mono mt-1">{currentUserId.substring(0, 8)}...</p>
                  </div>
                  <button
                    onClick={() => setSheetMode('editProfile')}
                    className="p-2 rounded-lg hover:bg-dark-300 transition-colors"
                  >
                    <Edit2 size={16} className="text-dark-400" />
                  </button>
                </div>
              </div>

              {/* User Switcher (Development Only) */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-yellow-500" />
                  <span className="text-xs font-medium text-yellow-500">DEV MODE: Switch Test User</span>
                </div>
                <select
                  value={currentUserId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {testUsers.map((testUser) => (
                    <option key={testUser.id} value={testUser.id}>
                      {testUser.name} ({testUser.id.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-dark-500 mt-2">
                  Switching users will reload the app to fetch that user's data
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Household Section (NEW) */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowHouseholdSection(!showHouseholdSection)}
            className="w-full p-4 flex items-center gap-3 hover:bg-dark-100/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
              <Home size={20} className="text-primary" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-medium">Household</h3>
              <p className="text-xs text-dark-500">
                {activeHousehold?.name || 'No household'} • {householdMembers.length} members
              </p>
            </div>
            <ChevronDown size={18} className={`text-dark-500 transition-transform ${showHouseholdSection ? 'rotate-180' : ''}`} />
          </button>

          {showHouseholdSection && (
            <div className="px-4 pb-4 space-y-4">
              {/* Household Switcher */}
              {households.length > 1 && (
                <div>
                  <label className="block text-xs text-dark-500 mb-2">Active Household</label>
                  <select
                    value={activeHouseholdId || ''}
                    onChange={(e) => handleHouseholdSwitch(e.target.value)}
                    className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {households.map((household) => (
                      <option key={household.id} value={household.id}>
                        {household.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Members */}
              {realMembers.length > 0 && (
                <div>
                  <h4 className="text-xs text-dark-500 mb-2">Members</h4>
                  <div className="space-y-2">
                    {realMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        profile={member.profile}
                        role={member.role}
                        isYou={member.profile.id === currentProfile?.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Dependents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs text-dark-500">Dependents (Kids, Pets)</h4>
                  <button
                    onClick={() => setSheetMode('addDependent')}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
                {shadowMembers.length > 0 ? (
                  <div className="space-y-2">
                    {shadowMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        profile={member.profile}
                        role={member.role}
                        onEdit={() => {/* TODO: Edit shadow user */}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-dark-100/50 rounded-lg">
                    <p className="text-xs text-dark-500">No dependents yet</p>
                    <p className="text-[10px] text-dark-600 mt-1">Add kids or pets to assign them tasks</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pane Order Editor Toggle */}
        <button
          onClick={() => setShowPaneEditor(!showPaneEditor)}
          className="w-full glass-card p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <GripVertical size={20} className="text-primary" />
            <div className="text-left">
              <h3 className="font-medium">Pane Order</h3>
              <p className="text-xs text-dark-500">Customize swipe deck order</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-dark-500 transition-transform ${showPaneEditor ? 'rotate-90' : ''}`} />
        </button>

        {/* Pane Order List */}
        {showPaneEditor && (
          <div className="glass-card p-3 space-y-1">
            {paneOrder.map((pane, index) => (
              <div
                key={pane}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                  draggedIndex === index ? 'bg-primary/20' : 'bg-dark-100/50 hover:bg-dark-200'
                }`}
              >
                <GripVertical size={16} className="text-dark-500" />
                <span className="text-sm">{paneLabels[pane]}</span>
                <span className="ml-auto text-xs text-dark-500">{index + 1}</span>
              </div>
            ))}
            <p className="text-xs text-dark-500 text-center pt-2">
              Drag to reorder. Changes save automatically.
            </p>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-2">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              className="w-full glass-card p-4 flex items-center gap-3 hover:bg-dark-100/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
                <section.icon size={20} className="text-primary" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-medium">{section.label}</h3>
                <p className="text-xs text-dark-500">{section.description}</p>
              </div>
              <ChevronRight size={18} className="text-dark-500" />
            </button>
          ))}
        </div>

        {/* Version */}
        <div className="text-center py-4">
          <p className="text-xs text-dark-500">LifeOS v0.1.0</p>
        </div>
      </div>

      {/* Drawer Handle */}
      <div
        className="py-3 flex justify-center cursor-pointer hover:bg-dark-100 transition-colors"
        onClick={openDrawer}
      >
        <div className="flex flex-col items-center gap-1">
          <GripHorizontal size={20} className="text-dark-400" />
          <div className="w-10 h-1 rounded-full bg-dark-400" />
        </div>
      </div>

      {/* SHEETS - Rendered at the end to ensure proper z-index */}
      {sheetMode === 'editProfile' && (
        <EditProfileSheet 
          profile={currentProfile || null}
          onClose={() => setSheetMode(null)} 
        />
      )}
      {sheetMode === 'addDependent' && (
        <AddDependentSheet 
          householdId={activeHouseholdId}
          onClose={() => setSheetMode(null)} 
        />
      )}
    </div>
  )
}
