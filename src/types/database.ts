// Database types for LifeOS
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
