import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('financeapp.db')

// Modül ilk import edildiğinde otomatik çalışır — useEffect'i beklemeye gerek yok
initDatabase()

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'TRY',
      color TEXT DEFAULT '#3a81f2',
      icon TEXT DEFAULT 'wallet',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'tag',
      color TEXT DEFAULT '#3a81f2',
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      merchant TEXT,
      receipt_image TEXT,
      date INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      period TEXT DEFAULT 'monthly',
      month INTEGER,
      year INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'stock',
      quantity REAL NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'TRY',
      note TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `)

  seedCategories()
}

function seedCategories() {
  const existing = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories')
  if (existing && existing.count > 0) return

  const categories = [
    { name: 'Market', icon: 'shopping-cart', color: '#2ae600', type: 'expense' },
    { name: 'Yemek', icon: 'utensils', color: '#f59e0b', type: 'expense' },
    { name: 'Ulaşım', icon: 'car', color: '#3a81f2', type: 'expense' },
    { name: 'Faturalar', icon: 'file-text', color: '#8b5cf6', type: 'expense' },
    { name: 'Eğlence', icon: 'film', color: '#ec4899', type: 'expense' },
    { name: 'Sağlık', icon: 'heart', color: '#ef4444', type: 'expense' },
    { name: 'Giyim', icon: 'shirt', color: '#06b6d4', type: 'expense' },
    { name: 'Diğer', icon: 'more-horizontal', color: '#6b7280', type: 'expense' },
    { name: 'Maaş', icon: 'banknote', color: '#2ae600', type: 'income' },
    { name: 'Ek Gelir', icon: 'plus-circle', color: '#3a81f2', type: 'income' },
    { name: 'Yatırım Geliri', icon: 'trending-up', color: '#f59e0b', type: 'income' },
  ]

  for (const cat of categories) {
    db.runSync(
      'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?)',
      [cat.name, cat.icon, cat.color, cat.type]
    )
  }
}

export function getMonthlyStats(month: number, year: number) {
  const start = new Date(year, month - 1, 1).getTime() / 1000
  const end = new Date(year, month, 0, 23, 59, 59).getTime() / 1000

  const income = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
    ['income', start, end]
  )
  const expense = db.getFirstSync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date >= ? AND date <= ?',
    ['expense', start, end]
  )

  return {
    income: income?.total ?? 0,
    expense: expense?.total ?? 0,
  }
}

export function getCategorySpending(month: number, year: number) {
  const start = new Date(year, month - 1, 1).getTime() / 1000
  const end = new Date(year, month, 0, 23, 59, 59).getTime() / 1000

  return db.getAllSync<{ category_id: number; total: number }>(
    `SELECT category_id, SUM(amount) as total
     FROM transactions
     WHERE type = 'expense' AND date >= ? AND date <= ? AND category_id IS NOT NULL
     GROUP BY category_id`,
    [start, end]
  )
}

export default db
