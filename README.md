# LifeOS PWA - Personal Operating System

A cyberpunk-themed Progressive Web App for managing your life - health, finances, household, and schedule all in one beautiful mobile-first interface.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account (for backend)

### Installation

```bash
# Navigate to the PWA directory
cd Adhoc-App/lifeos-pwa

# Install dependencies
npm install

# Copy environment file and add your Supabase credentials
cp .env.example .env

# Start development server
npm run dev
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the scripts in order:
   - `../00_init_schema.sql` - Creates all tables, enums, indexes, and RLS policies
   - `../01_seed_dummy_data.sql` - Seeds with realistic test data
3. Copy your project URL and anon key to `.env`

## 🏗 Project Structure

```
lifeos-pwa/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Layout.tsx    # Main layout with Dock & App Drawer
│   ├── lib/
│   │   ├── supabase.ts   # Supabase client
│   │   └── utils.ts      # Utility functions
│   ├── panes/            # Main app views (swipeable)
│   │   ├── DashboardPane.tsx
│   │   ├── HealthPane.tsx
│   │   ├── FinancePane.tsx
│   │   ├── HouseholdPane.tsx
│   │   └── AgendaPane.tsx
│   ├── store/
│   │   └── useAppStore.ts # Zustand global state
│   ├── types/
│   │   └── database.ts    # TypeScript types from schema
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css          # Tailwind + custom styles
├── index.html
├── tailwind.config.js     # Cyberpunk theme colors
├── vite.config.ts
└── package.json
```

## 🎨 Design System

### Cyberpunk Theme Colors
- **Primary (Cyan):** `#06b6d4` - Main accent color
- **Background:** `#0a0a0f` - Deep dark base
- **Accent Colors:**
  - Green: `#22c55e` (success, health)
  - Red: `#ef4444` (errors, blocking events)
  - Yellow: `#eab308` (warnings, low stock)
  - Blue: `#3b82f6` (info, water, sleep)
  - Pink: `#ec4899` (special highlights)
  - Purple: `#a855f7` (household)

### UI Components
- **Glass Cards:** Semi-transparent with backdrop blur
- **Hexagon Dock Icons:** Unique geometric navigation
- **Progress Rings:** Circular progress indicators
- **Glow Effects:** Subtle cyan glows on interactive elements

## 📱 Features

### Dashboard
- Daily progress ring
- Quick stats grid (Sleep, Water, Steps, Calories)
- Today's agenda preview
- Quick action buttons

### Health
- Daily metric cards with progress bars
- 7-day trend charts
- Meal logging with photo support
- Workout tracking

### Finance
- Net worth overview
- Account cards (checking, savings, credit)
- Monthly spending tracker
- Recent transactions list

### Household
- Pantry inventory with stock levels
- Shopping list with checkboxes
- Low stock alerts
- Recipe planning (coming soon)

### Agenda
- Events grouped by day
- Blocking vs non-blocking events
- Polymorphic links (recipes, workouts)
- Event type color coding

## 🛠 Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS + tailwindcss-animate
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)

## 📝 Development Notes

### Current Status
The app is scaffolded with mock data. To connect to live Supabase data:

1. Replace mock data arrays with Supabase queries using `@tanstack/react-query`
2. Example:
```tsx
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function useDailyHealthLogs(date: string) {
  return useQuery({
    queryKey: ['health-logs', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_health_logs')
        .select('*')
        .eq('date', date)
      if (error) throw error
      return data
    }
  })
}
```

### Adding New Panes
1. Create component in `src/panes/`
2. Add to `paneComponents` in `App.tsx`
3. Add to `dockItems` in `Layout.tsx`
4. Add icon to dock configuration

## 📄 License

MIT License - Feel free to use this for your personal projects!
