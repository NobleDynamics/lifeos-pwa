import { Wallet, Banknote, PiggyBank, TrendingUp, CreditCard, Building2 } from 'lucide-react'
import CategoryPane from '@/components/CategoryPane'

const tabs = [
  { id: 'budget', label: 'Budget', icon: Banknote },
  { id: 'accounts', label: 'Accounts', icon: PiggyBank },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
]

// Mock data
const mockBudgetCategories = [
  { name: 'Groceries', spent: 420, budget: 600 },
  { name: 'Dining Out', spent: 180, budget: 200 },
  { name: 'Transportation', spent: 95, budget: 150 },
  { name: 'Entertainment', spent: 65, budget: 100 },
  { name: 'Utilities', spent: 210, budget: 250 },
]

const mockAccounts = [
  { id: 1, name: 'Main Checking', type: 'checking', balance: 4250.32, institution: 'Chase' },
  { id: 2, name: 'Savings', type: 'savings', balance: 12500.00, institution: 'Ally' },
  { id: 3, name: 'Credit Card', type: 'credit', balance: -1234.56, institution: 'Amex' },
]

const mockTransactions = [
  { id: 1, description: 'Costco', amount: -156.78, category: 'Groceries', date: 'Today' },
  { id: 2, description: 'Salary Deposit', amount: 3500.00, category: 'Income', date: 'Nov 1' },
  { id: 3, description: 'Netflix', amount: -15.99, category: 'Entertainment', date: 'Nov 1' },
  { id: 4, description: 'Shell Gas', amount: -45.20, category: 'Transportation', date: 'Oct 30' },
]

function BudgetTab() {
  const totalSpent = mockBudgetCategories.reduce((sum, c) => sum + c.spent, 0)
  const totalBudget = mockBudgetCategories.reduce((sum, c) => sum + c.budget, 0)
  const percentUsed = Math.round((totalSpent / totalBudget) * 100)
  
  return (
    <div className="p-4 space-y-4">
      {/* Overall Progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Monthly Budget</span>
          <span className="text-lg font-bold">${totalSpent.toFixed(0)} / ${totalBudget.toFixed(0)}</span>
        </div>
        <div className="h-3 bg-dark-300 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              percentUsed > 90 ? 'bg-accent-red' : percentUsed > 75 ? 'bg-accent-yellow' : 'bg-accent-green'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        <p className="text-xs text-dark-500 mt-1">{percentUsed}% used • ${totalBudget - totalSpent} remaining</p>
      </div>
      
      {/* Category Breakdown */}
      <div className="space-y-3">
        {mockBudgetCategories.map((cat) => {
          const percent = Math.round((cat.spent / cat.budget) * 100)
          return (
            <div key={cat.name} className="glass-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{cat.name}</span>
                <span className="text-xs text-dark-500">${cat.spent} / ${cat.budget}</span>
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    percent > 90 ? 'bg-accent-red' : percent > 75 ? 'bg-accent-yellow' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AccountsTab() {
  const netWorth = mockAccounts.reduce((sum, a) => sum + a.balance, 0)
  
  return (
    <div className="p-4 space-y-4">
      {/* Net Worth Card */}
      <div className="glass-card p-4 text-center">
        <p className="text-xs text-dark-500 mb-1">Net Worth</p>
        <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
          ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-accent-green">
          <TrendingUp size={12} />
          <span>+2.3% this month</span>
        </div>
      </div>
      
      {/* Account Cards */}
      <div className="space-y-2">
        {mockAccounts.map((account) => {
          const Icon = account.type === 'credit' ? CreditCard : account.type === 'checking' ? Building2 : PiggyBank
          return (
            <div key={account.id} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                account.type === 'credit' ? 'bg-accent-red/20' : 
                account.type === 'savings' ? 'bg-accent-green/20' : 
                'bg-primary/20'
              }`}>
                <Icon size={20} className={
                  account.type === 'credit' ? 'text-accent-red' : 
                  account.type === 'savings' ? 'text-accent-green' : 
                  'text-primary'
                } />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-xs text-dark-500">{account.institution}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${account.balance >= 0 ? '' : 'text-accent-red'}`}>
                  ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                {account.type === 'credit' && <p className="text-xs text-dark-500">owed</p>}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Recent Transactions */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {mockTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm">{tx.description}</p>
                <p className="text-xs text-dark-500">{tx.category} • {tx.date}</p>
              </div>
              <span className={`font-medium ${tx.amount >= 0 ? 'text-accent-green' : ''}`}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Email Integration */}
      <div className="glass-card p-3 text-center">
        <p className="text-xs text-dark-500 mb-1">Import transactions via email:</p>
        <p className="text-sm font-mono text-primary">import@lifeos.app</p>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Chart Builder */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Spending Over Time</h3>
        <div className="h-32 flex items-end gap-1">
          {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 70].map((h, i) => (
            <div 
              key={i}
              className="flex-1 bg-primary/30 rounded-t hover:bg-primary/50 transition-colors"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-dark-500">
          <span>Jan</span>
          <span>Jun</span>
          <span>Dec</span>
        </div>
      </div>
      
      {/* Category breakdown */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">By Category</h3>
        <div className="space-y-2">
          {['Groceries', 'Dining', 'Transport', 'Other'].map((cat, i) => {
            const widths = [35, 25, 20, 20]
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-xs w-20">{cat}</span>
                <div className="flex-1 h-4 bg-dark-300 rounded overflow-hidden">
                  <div 
                    className="h-full bg-primary"
                    style={{ width: `${widths[i]}%` }}
                  />
                </div>
                <span className="text-xs text-dark-500">{widths[i]}%</span>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button className="flex-1 glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
          🤖 Generate Summary
        </button>
        <button className="flex-1 glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
          💾 Save View
        </button>
      </div>
    </div>
  )
}

export default function FinancePane() {
  return (
    <CategoryPane
      title="Finance"
      icon={Wallet}
      tabs={tabs}
      tabKey="finance"
    >
      {(activeTab) => (
        <>
          {activeTab === 'budget' && <BudgetTab />}
          {activeTab === 'accounts' && <AccountsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </>
      )}
    </CategoryPane>
  )
}
