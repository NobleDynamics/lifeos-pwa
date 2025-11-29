// Database types for LifeOS

// ============================================================================
// IDENTITY & HOUSEHOLD TYPES
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

export interface ProfileInsert {
  id?: string
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
  is_shadow?: boolean
  managed_by_household_id?: string | null
}

export interface ProfileUpdate {
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
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

export interface HouseholdMemberInsert {
  id?: string
  household_id: string
  user_id: string
  role?: HouseholdRole
  is_primary?: boolean
  invited_by?: string | null
}

export interface HouseholdMemberUpdate {
  role?: HouseholdRole
  is_primary?: boolean
}

export interface HouseholdMemberWithProfile extends HouseholdMember {
  profile: Profile
}

export interface HouseholdWithMembership {
  id: string
  name: string
  owner_id: string | null
  description: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
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

export interface ConnectionInsert {
  id?: string
  requester_id: string
  receiver_id: string
  status?: ConnectionStatus
  message?: string | null
}

export interface ConnectionUpdate {
  status?: ConnectionStatus
  message?: string | null
}

// ============================================================================
// RESOURCE GRAPH TYPES (Universal Resource Graph)
// ============================================================================

export type ResourceType = 
  | 'folder' 
  | 'project' 
  | 'task' 
  | 'recipe' 
  | 'ingredient' 
  | 'stock_item'
  | 'workout'
  | 'exercise'
  | 'document'
  | 'event'

export type ResourceStatus = 'active' | 'completed' | 'archived'

export type LinkType = 
  | 'ingredient_of' 
  | 'related_to' 
  | 'blocks' 
  | 'dependency_of' 
  | 'duplicate_of'
  | 'child_of'
  | 'references'

export interface Resource {
  id: string
  user_id: string
  household_id: string | null
  parent_id: string | null
  path: string // ltree stored as string
  type: ResourceType
  title: string
  description: string | null
  status: ResourceStatus
  meta_data: Record<string, unknown>
  is_schedulable: boolean
  scheduled_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  created_by: string | null
}

export interface ResourceInsert {
  id?: string
  user_id: string
  household_id?: string | null
  parent_id?: string | null
  path?: string // Auto-calculated by trigger if not provided
  type: ResourceType
  title: string
  description?: string | null
  status?: ResourceStatus
  meta_data?: Record<string, unknown>
  is_schedulable?: boolean
  scheduled_at?: string | null
  created_by?: string | null
}

export interface ResourceUpdate {
  parent_id?: string | null
  type?: ResourceType
  title?: string
  description?: string | null
  status?: ResourceStatus
  meta_data?: Record<string, unknown>
  is_schedulable?: boolean
  scheduled_at?: string | null
  deleted_at?: string | null
}

export interface ResourceLink {
  id: string
  source_id: string
  target_id: string
  link_type: LinkType
  meta_data: Record<string, unknown>
  created_at: string
}

export interface ResourceLinkInsert {
  id?: string
  source_id: string
  target_id: string
  link_type: LinkType
  meta_data?: Record<string, unknown>
}

export interface HealthLog {
  id: string
  resource_id: string | null
  user_id: string
  date: string
  value: number
  metric_unit: string | null
  notes: string | null
  created_at: string
}

export interface InventoryLog {
  id: string
  resource_id: string | null
  household_id: string
  date: string
  qty_change: number
  reason: string | null
  meta_data: Record<string, unknown>
  created_at: string
}

// Resource with computed fields (for UI)
export interface ResourceWithDepth extends Resource {
  depth: number // Calculated from path: nlevel(path) - 1
  children_count?: number
}

// Resource tree node for hierarchical display
export interface ResourceTreeNode extends Resource {
  children: ResourceTreeNode[]
}

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      todo_categories: {
        Row: {
          id: string
          user_id: string
          household_id: string | null
          name: string
          description: string | null
          color: string
          is_shared: boolean
          created_at: string
          updated_at: string
          created_by: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          household_id?: string | null
          name: string
          description?: string | null
          color?: string
          is_shared?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string | null
          name?: string
          description?: string | null
          color?: string
          is_shared?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          deleted_at?: string | null
        }
      }
      todo_lists: {
        Row: {
          id: string
          user_id: string
          household_id: string | null
          category_id: string
          name: string
          description: string | null
          due_date: string | null
          location_coordinates: { lat: number; lng: number } | null
          location_name: string | null
          is_shared: boolean
          created_at: string
          updated_at: string
          created_by: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          household_id?: string | null
          category_id: string
          name: string
          description?: string | null
          due_date?: string | null
          location_coordinates?: { lat: number; lng: number } | null
          location_name?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string | null
          category_id?: string
          name?: string
          description?: string | null
          due_date?: string | null
          location_coordinates?: { lat: number; lng: number } | null
          location_name?: string | null
          is_shared?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          deleted_at?: string | null
        }
      }
      todo_items: {
        Row: {
          id: string
          user_id: string
          household_id: string | null
          list_id: string
          name: string
          description: string | null
          status: 'not_started' | 'started' | 'in_progress' | 'completed'
          due_date: string | null
          location_coordinates: { lat: number; lng: number } | null
          location_name: string | null
          use_parent_location: boolean
          is_shared: boolean
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
          created_by: string
          completed_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          household_id?: string | null
          list_id: string
          name: string
          description?: string | null
          status?: 'not_started' | 'started' | 'in_progress' | 'completed'
          due_date?: string | null
          location_coordinates?: { lat: number; lng: number } | null
          location_name?: string | null
          use_parent_location?: boolean
          is_shared?: boolean
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
          created_by: string
          completed_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string | null
          list_id?: string
          name?: string
          description?: string | null
          status?: 'not_started' | 'started' | 'in_progress' | 'completed'
          due_date?: string | null
          location_coordinates?: { lat: number; lng: number } | null
          location_name?: string | null
          use_parent_location?: boolean
          is_shared?: boolean
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
          created_by?: string
          completed_by?: string | null
          deleted_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          accent_color: string
          chart_colors: string[]
          dark_mode: boolean
          analytics_collapsed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          accent_color?: string
          chart_colors?: string[]
          dark_mode?: boolean
          analytics_collapsed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          accent_color?: string
          chart_colors?: string[]
          dark_mode?: boolean
          analytics_collapsed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profile: {
        Row: {
          id: string
          user_id: string
          household_id: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      get_todo_analytics: {
        Args: {
          p_user_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          date: string
          lists_created: number
          lists_completed: number
          items_created: number
          items_completed: number
          items_started: number
          items_in_progress: number
          scheduled_items: number
          pending_items: number
        }[]
      }
      get_category_pie_data: {
        Args: {
          p_user_id: string
        }
        Returns: {
          category_name: string
          category_color: string
          scheduled_count: number
          pending_count: number
          total_count: number
        }[]
      }
    }
  }
}

// Type aliases for easier use
export type TodoCategory = Database['public']['Tables']['todo_categories']['Row']
export type TodoList = Database['public']['Tables']['todo_lists']['Row']
export type TodoItem = Database['public']['Tables']['todo_items']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type Household = Database['public']['Tables']['households']['Row']
export type UserProfile = Database['public']['Tables']['user_profile']['Row']

export type TodoStatus = 'not_started' | 'started' | 'in_progress' | 'completed'

export interface TodoAnalyticsData {
  date: string
  lists_created: number
  lists_completed: number
  items_created: number
  items_completed: number
  items_started: number
  items_in_progress: number
  scheduled_items: number
  pending_items: number
}

export interface CategoryPieData {
  category_name: string
  category_color: string
  scheduled_count: number
  pending_count: number
  total_count: number
}

export interface TodoFilters {
  search: string
  sortBy: 'name' | 'created_at' | 'updated_at' | 'due_date' | 'status'
  sortOrder: 'asc' | 'desc'
  statusFilter: TodoStatus | 'all'
  dateRange: 'today' | 'week' | 'month' | 'custom' | 'all'
  startDate?: string
  endDate?: string
  dueSoonFilter?: '1day' | '1week' | '1month' | 'all'

}
