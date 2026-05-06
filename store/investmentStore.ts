import { create } from 'zustand'
import db from '@/lib/database'

export interface Investment {
  id: number
  symbol: string
  name: string
  type: 'stock' | 'etf' | 'fund' | 'crypto'
  quantity: number
  avg_cost: number
  currency: string
  note: string | null
  created_at: number
}

interface InvestmentState {
  investments: Investment[]
  loadInvestments: () => void
  addInvestment: (inv: Omit<Investment, 'id' | 'created_at'>) => void
  updateInvestment: (id: number, quantity: number, avg_cost: number) => void
  deleteInvestment: (id: number) => void
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  investments: [],

  loadInvestments: () => {
    const investments = db.getAllSync<Investment>(
      'SELECT * FROM investments ORDER BY created_at DESC'
    )
    set({ investments })
  },

  addInvestment: (inv) => {
    db.runSync(
      'INSERT INTO investments (symbol, name, type, quantity, avg_cost, currency, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [inv.symbol, inv.name, inv.type, inv.quantity, inv.avg_cost, inv.currency, inv.note ?? null]
    )
    get().loadInvestments()
  },

  updateInvestment: (id, quantity, avg_cost) => {
    db.runSync('UPDATE investments SET quantity = ?, avg_cost = ? WHERE id = ?', [quantity, avg_cost, id])
    get().loadInvestments()
  },

  deleteInvestment: (id) => {
    db.runSync('DELETE FROM investments WHERE id = ?', [id])
    get().loadInvestments()
  },
}))
