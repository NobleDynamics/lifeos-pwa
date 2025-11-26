// TypeScript types generated from LifeOS Database Schema
// Based on 02_Backend_Schema.md

// ============================================================================
// ENUM TYPES
// ============================================================================

export type HealthMetricType = 
  | 'sleep_hours'
  | 'sleep_score'
  | 'water_ml'
  | 'steps'
  | 'active_calories'
  | 'resting_heart_rate'
  | 'unique_contacts_interacted'

export type WorkoutType = 'cardio' | 'strength' | 'mobility'

export type BrainLogCategory = 'learning' | 'social' | 'game'

export type BrainMetricName = 
  | 'reaction_time_ms'
  | 'memory_grid_score'
  | 'pomodoro_minutes'
  | 'messages_sent'
  | 'mood_score'

export type StorageLocation = 'pantry' | 'fridge' | 'freezer'

export type TaskScope = 'personal' | 'household'

export type TaskStatus = 
  | 'pending'
  | 'scheduled'
  | 'running'
  | 'needing-input'
  | 'completed'
  | 'failed'

export type TaskCategory = 'chore' | 'errand' | 'project' | 'work' | 'health'

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export type EventStatus = 'scheduled' | 'completed' | 'skipped'

export type LinkedResourceType = 'recipe' | 'workout' | 'chore' | 'transaction' | 'none'

export type TokenCategory = 'llm_chat' | 'image_gen' | 'storage' | 'purchase'

export type HouseholdRole = 'admin' | 'member'

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'cash'

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Household {
  id: string
  name: string
  created_at: string
}

export interface HouseholdMember {
  id: string
  household_id: string
  user_id: string
  role: HouseholdRole
  created_at: string
}

export interface Dependent {
  id: string
  user_id: string
  name: string
  birth_date: string | null
  profile_photo_r2_key: string | null
  created_at: string
}

export interface DailyHealthLog {
  id: string
  user_id: string
  date: string
  metric_type: HealthMetricType
  value: number
  source: string | null
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  dependent_id: string | null
  name: string
  calories: number | null
  macros_json: {
    protein?: number
    carbs?: number
    fat?: number
  } | null
  micronutrients_json: Record<string, number> | null
  eaten_at: string
  photo_r2_key: string | null
  notes: string | null
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  name: string
  type: WorkoutType
  smart_tags: string[]
  muscle_split_json: Record<string, number> | null
  instructions_text: string | null
  estimated_burn_calories: number | null
  created_at: string
}

export interface CompletedWorkout {
  id: string
  user_id: string
  workout_id: string
  duration_minutes: number
  volume_load: number | null
  completed_at: string
  created_at: string
}

export interface BrainLog {
  id: string
  user_id: string
  category: BrainLogCategory
  metric_name: BrainMetricName
  value: number
  sentiment_score: number | null
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  logo_url: string | null
  default_category: string | null
  created_at: string
}

export interface PantryItem {
  id: string
  household_id: string
  name: string
  qty_in_stock: number
  qty_min: number
  unit: string | null
  expiry_date: string | null
  storage_location: StorageLocation
  created_at: string
  updated_at: string
}

export interface ShoppingList {
  id: string
  household_id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShoppingItem {
  id: string
  household_id: string
  shopping_list_id: string | null
  pantry_item_id: string | null
  vendor_id: string | null
  name: string
  quantity: number | null
  is_purchased: boolean
  need_by_date: string | null
  created_at: string
}

export interface Recipe {
  id: string
  owner_id: string
  household_id: string | null
  name: string
  instructions_text: string | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  image_r2_key: string | null
  ingredients_json: Array<{
    item: string
    qty: number
    unit: string
  }> | null
  meal_type: string | null
  cuisine: string | null
  dietary_tags: string[]
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  household_id: string | null
  scope: TaskScope
  parent_task_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  category: TaskCategory
  priority: TaskPriority
  due_date: string | null
  location_geo: { x: number; y: number } | null
  location_name: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  is_blocking: boolean
  status: EventStatus
  linked_resource_type: LinkedResourceType
  linked_resource_id: string | null
  linked_recipe_id: string | null
  linked_workout_id: string | null
  linked_task_id: string | null
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  cron_expression: string
  activities_json: Array<{
    type: string
    name?: string
    title?: string
  }> | null
  is_active: boolean
  conflict_policy: string | null
  created_at: string
  updated_at: string
}

export interface File {
  id: string
  user_id: string
  folder_path: string
  file_name: string
  r2_key: string
  mime_type: string
  file_size_bytes: number | null
  ai_tags: string[]
  ai_description: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  content_text: string | null
  summary_short: string | null
  tags: string[]
  is_ai_generated: boolean
  key_entities: string[]
  created_at: string
  updated_at: string
}

export interface InboundEmail {
  id: string
  user_id: string
  sender: string
  subject: string | null
  body_text: string | null
  raw_payload: Record<string, unknown> | null
  is_processed: boolean
  processed_at: string | null
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  institution: string | null
  account_type: AccountType
  balance_cents: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountBalanceHistory {
  id: string
  account_id: string
  date: string
  balance_cents: number
  created_at: string
}

export interface BudgetCategory {
  id: string
  user_id: string
  name: string
  monthly_limit_cents: number | null
  color_hex: string | null
  icon_name: string | null
  created_at: string
}

export interface Transaction {
  id: string
  account_id: string
  user_id: string
  date: string
  merchant_name: string | null
  description: string | null
  amount_cents: number
  receipt_file_id: string | null
  source_email_id: string | null
  is_recurring: boolean | null
  created_at: string
}

export interface TransactionSplit {
  id: string
  transaction_id: string
  category_id: string
  amount_cents: number
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  name: string
  matrix_id: string | null
  mastodon_handle: string | null
  email: string | null
  phone: string | null
  details_json: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  accent_color_hex: string | null
  current_token_balance: number
  matrix_access_token: string | null
  matrix_device_id: string | null
  matrix_homeserver_url: string | null
  agent_preferences_json: Record<string, unknown> | null
  pane_order_json: string[] | null
  drawer_order_json: string[] | null
  created_at: string
  updated_at: string
}

export interface TokenLedger {
  id: string
  user_id: string
  amount: number
  category: TokenCategory
  description: string | null
  created_at: string
}

// ============================================================================
// DATABASE TYPE (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id'>>
      }
      households: {
        Row: Household
        Insert: Omit<Household, 'id' | 'created_at'>
        Update: Partial<Omit<Household, 'id'>>
      }
      household_members: {
        Row: HouseholdMember
        Insert: Omit<HouseholdMember, 'id' | 'created_at'>
        Update: Partial<Omit<HouseholdMember, 'id'>>
      }
      dependents: {
        Row: Dependent
        Insert: Omit<Dependent, 'id' | 'created_at'>
        Update: Partial<Omit<Dependent, 'id'>>
      }
      daily_health_logs: {
        Row: DailyHealthLog
        Insert: Omit<DailyHealthLog, 'id' | 'created_at'>
        Update: Partial<Omit<DailyHealthLog, 'id'>>
      }
      meals: {
        Row: Meal
        Insert: Omit<Meal, 'id' | 'created_at'>
        Update: Partial<Omit<Meal, 'id'>>
      }
      workouts: {
        Row: Workout
        Insert: Omit<Workout, 'id' | 'created_at'>
        Update: Partial<Omit<Workout, 'id'>>
      }
      completed_workouts: {
        Row: CompletedWorkout
        Insert: Omit<CompletedWorkout, 'id' | 'created_at'>
        Update: Partial<Omit<CompletedWorkout, 'id'>>
      }
      brain_logs: {
        Row: BrainLog
        Insert: Omit<BrainLog, 'id' | 'created_at'>
        Update: Partial<Omit<BrainLog, 'id'>>
      }
      vendors: {
        Row: Vendor
        Insert: Omit<Vendor, 'id' | 'created_at'>
        Update: Partial<Omit<Vendor, 'id'>>
      }
      pantry_items: {
        Row: PantryItem
        Insert: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PantryItem, 'id'>>
      }
      shopping_lists: {
        Row: ShoppingList
        Insert: Omit<ShoppingList, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ShoppingList, 'id'>>
      }
      shopping_items: {
        Row: ShoppingItem
        Insert: Omit<ShoppingItem, 'id' | 'created_at'>
        Update: Partial<Omit<ShoppingItem, 'id'>>
      }
      recipes: {
        Row: Recipe
        Insert: Omit<Recipe, 'id' | 'created_at'>
        Update: Partial<Omit<Recipe, 'id'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id'>>
      }
      calendar_events: {
        Row: CalendarEvent
        Insert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CalendarEvent, 'id'>>
      }
      routines: {
        Row: Routine
        Insert: Omit<Routine, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Routine, 'id'>>
      }
      files: {
        Row: File
        Insert: Omit<File, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<File, 'id'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id'>>
      }
      inbound_emails: {
        Row: InboundEmail
        Insert: Omit<InboundEmail, 'id' | 'created_at'>
        Update: Partial<Omit<InboundEmail, 'id'>>
      }
      accounts: {
        Row: Account
        Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Account, 'id'>>
      }
      account_balance_history: {
        Row: AccountBalanceHistory
        Insert: Omit<AccountBalanceHistory, 'id' | 'created_at'>
        Update: Partial<Omit<AccountBalanceHistory, 'id'>>
      }
      budget_categories: {
        Row: BudgetCategory
        Insert: Omit<BudgetCategory, 'id' | 'created_at'>
        Update: Partial<Omit<BudgetCategory, 'id'>>
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id'>>
      }
      transaction_splits: {
        Row: TransactionSplit
        Insert: Omit<TransactionSplit, 'id' | 'created_at'>
        Update: Partial<Omit<TransactionSplit, 'id'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id'>>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'created_at' | 'updated_at'>
        Update: Partial<UserSettings>
      }
      token_ledger: {
        Row: TokenLedger
        Insert: Omit<TokenLedger, 'id' | 'created_at'>
        Update: Partial<Omit<TokenLedger, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      health_metric_type: HealthMetricType
      workout_type: WorkoutType
      brain_log_category: BrainLogCategory
      brain_metric_name: BrainMetricName
      storage_location: StorageLocation
      task_scope: TaskScope
      task_status: TaskStatus
      task_category: TaskCategory
      task_priority: TaskPriority
      event_status: EventStatus
      linked_resource_type: LinkedResourceType
      token_category: TokenCategory
      household_role: HouseholdRole
      account_type: AccountType
    }
  }
}
