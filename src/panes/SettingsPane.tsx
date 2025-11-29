import { useState } from 'react'
import { 
  Settings, 
  User, 
  Users, 
  Home, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Baby,
  Crown,
  UserCheck
} from 'lucide-react'
import { ViewShell, FormSheet, Avatar, AvatarPicker } from '@/components/shared'
import { DRAWER_HANDLE_HEIGHT } from '@/components/Layout'
import { 
  useCurrentProfile, 
  useUpdateProfile,
  useHouseholds,
  usePrimaryHousehold,
  useSwitchHousehold,
  useHouseholdMembers,
  useCreateShadowUser,
  useDeleteShadowUser,
  Profile,
  HouseholdRole
} from '@/hooks/useIdentity'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

type SheetMode = 'editProfile' | 'addDependent' | null

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Section wrapper for consistent styling
 */
function SettingsSection({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-dark-500 uppercase tracking-wider px-1">
        {title}
      </h3>
      <div className="bg-dark-100 rounded-xl overflow-hidden border border-dark-300/50">
        {children}
      </div>
    </div>
  )
}

/**
 * Row item with icon and chevron
 */
function SettingsRow({ 
  icon: Icon,
  label, 
  value, 
  onClick, 
  children,
  className
}: { 
  icon?: React.ElementType
  label: string
  value?: string
  onClick?: () => void
  children?: React.ReactNode
  className?: string
}) {
  const content = (
    <div className={cn(
      "flex items-center gap-3 p-4",
      onClick && "cursor-pointer hover:bg-dark-200/50 transition-colors",
      className
    )}>
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {value && <p className="text-xs text-dark-500 truncate">{value}</p>}
      </div>
      {children}
      {onClick && !children && (
        <ChevronRight className="w-4 h-4 text-dark-400 flex-shrink-0" />
      )}
    </div>
  )

  if (onClick) {
    return <button className="w-full text-left" onClick={onClick}>{content}</button>
  }
  return content
}

/**
 * Member row with avatar and role badge
 */
function MemberRow({ 
  profile, 
  role,
  isYou = false,
  onEdit,
  onDelete
}: { 
  profile: Profile
  role: HouseholdRole
  isYou?: boolean
  onEdit?: () => void
  onDelete?: () => void
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
    <div className="flex items-center gap-3 p-4 border-b border-dark-300/30 last:border-b-0">
      <Avatar 
        src={profile.avatar_url} 
        name={profile.full_name} 
        size="md" 
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">
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
      {profile.is_shadow && (onEdit || onDelete) && (
        <div className="flex items-center gap-1">
          {onEdit && (
            <button 
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-dark-400" />
            </button>
          )}
        </div>
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
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  
  // Data hooks
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

  // Handle household switch
  const handleHouseholdSwitch = (householdId: string) => {
    switchHousehold.mutate(householdId)
  }

  return (
    <ViewShell
      title="Settings"
      icon={Settings}
      bottomPadding={DRAWER_HANDLE_HEIGHT}
    >
      <div className="p-4 space-y-6">
        {/* ME SECTION */}
        <SettingsSection title="Me">
          <SettingsRow
            icon={User}
            label={currentProfile?.full_name || 'Your Profile'}
            value={currentProfile?.email || 'Set up your profile'}
            onClick={() => setSheetMode('editProfile')}
          >
            <Avatar 
              src={currentProfile?.avatar_url} 
              name={currentProfile?.full_name}
              size="sm"
            />
          </SettingsRow>
        </SettingsSection>

        {/* HOUSEHOLD SECTION */}
        <SettingsSection title="Household">
          {/* Household Switcher */}
          <div className="p-4 border-b border-dark-300/30">
            <label className="block text-xs text-dark-500 mb-2">Active Household</label>
            <select
              value={activeHouseholdId || ''}
              onChange={(e) => handleHouseholdSwitch(e.target.value)}
              className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {households.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.name}
                </option>
              ))}
            </select>
          </div>

          {/* Household Members */}
          {activeHousehold && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-white">
                    {activeHousehold.name}
                  </span>
                </div>
                <span className="text-xs text-dark-500">
                  {householdMembers.length} members
                </span>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* MEMBERS SECTION */}
        {realMembers.length > 0 && (
          <SettingsSection title="Members">
            {realMembers.map((member) => (
              <MemberRow
                key={member.id}
                profile={member.profile}
                role={member.role}
                isYou={member.profile.id === currentProfile?.id}
              />
            ))}
          </SettingsSection>
        )}

        {/* DEPENDENTS SECTION */}
        <SettingsSection title="Dependents (Kids, Pets)">
          {shadowMembers.map((member) => (
            <MemberRow
              key={member.id}
              profile={member.profile}
              role={member.role}
              onEdit={() => {/* TODO: Edit shadow user */}}
            />
          ))}
          {shadowMembers.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-dark-500 mb-2">No dependents yet</p>
              <p className="text-xs text-dark-600">
                Add kids or pets to assign them tasks
              </p>
            </div>
          )}
          <button
            onClick={() => setSheetMode('addDependent')}
            className="w-full flex items-center justify-center gap-2 p-4 text-sm font-medium text-primary hover:bg-primary/5 transition-colors border-t border-dark-300/30"
          >
            <Plus className="w-4 h-4" />
            Add Dependent
          </button>
        </SettingsSection>
      </div>

      {/* SHEETS */}
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
    </ViewShell>
  )
}
