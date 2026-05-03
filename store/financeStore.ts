import { create } from 'zustand'
import db from '@/lib/database'

export interface Account {
  id: number
  name: string
  type: string
  balance: number
  currency: string
  color: string
  icon: string
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  type: string
}

export interface Transaction {
  id: number
  account_id: number | null
  category_id: number | null
  amount: number
  type: 'income' | 'expense' | 'transfer'
  description: string | null
  merchant: string | null
  receipt_image: string | null
  date: number
  created_at: number
}

export interface Budget {
  id: number
  category_id: number
  amount: number
  period: string
  month: number | null
  year: number | null
}

interface FinanceState {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  loadAll: () => void
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => void
  deleteTransaction: (id: number) => void
  addAccount: (a: Omit<Account, 'id'>) => void
  deleteAccount: (id: number) => void
  addBudget: (b: Omit<Budget, 'id'>) => void
  deleteBudget: (id: number) => void
  updateAccountBalance: (id: number, amount: number, type: 'income' | 'expense') => void
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],

  loadAll: () => {
    const accounts = db.getAllSync<Account>('SELECT * FROM accounts ORDER BY created_at DESC')
    const categories = db.getAllSync<Category>('SELECT * FROM categories ORDER BY type, name')
    const transactions = db.getAllSync<Transaction>(
      'SELECT * FROM transactions ORDER BY date DESC LIMIT 200'
    )
    const budgets = db.getAllSync<Budget>('SELECT * FROM budgets')
    set({ accounts, categories, transactions, budgets })
  },

  addTransaction: (t) => {
    db.runSync(
      'INSERT INTO transactions (account_id, category_id, amount, type, description, merchant, receipt_image, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [t.account_id, t.category_id, t.amount, t.type, t.description ?? null, t.merchant ?? null, t.receipt_image ?? null, t.date]
    )
    if (t.account_id) {
      get().updateAccountBalance(t.account_id, t.amount, t.type as 'income' | 'expense')
    }
    get().loadAll()
  },

  deleteTransaction: (id) => {
    db.runSync('DELETE FROM transactions WHERE id = ?', [id])
    get().loadAll()
  },

  updateAccountBalance: (id, amount, type) => {
    const delta = type === 'income' ? amount : -amount
    db.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, id])
  },

  addAccount: (a) => {
    db.runSync(
      'INSERT INTO accounts (name, type, balance, currency, color, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [a.name, a.type, a.balance, a.currency, a.color, a.icon]
    )
    get().loadAll()
  },

  deleteAccount: (id) => {
    db.runSync('DELETE FROM accounts WHERE id = ?', [id])
    get().loadAll()
  },

  addBudget: (b) => {
    db.runSync(
      'INSERT INTO budgets (category_id, amount, period, month, year) VALUES (?, ?, ?, ?, ?)',
      [b.category_id, b.amount, b.period, b.month, b.year]
    )
    get().loadAll()
  },

  deleteBudget: (id) => {
    db.runSync('DELETE FROM budgets WHERE id = ?', [id])
    get().loadAll()
  },
}))
