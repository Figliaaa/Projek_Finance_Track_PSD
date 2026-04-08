const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use absolute path so the database is always created in the backend folder
const dbFilePath = path.join(__dirname, 'budget.sqlite');

const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) console.error(err.message);
    else console.log(`Terkoneksi ke database SQLite: ${dbFilePath}`);
});

db.serialize(() => {
    // ===== TABEL USER & AUTHENTIKASI =====
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        location TEXT,
        currency TEXT DEFAULT 'IDR',
        allocation_strategy TEXT DEFAULT '50-30-20',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ===== TABEL PENDAPATAN (INCOME SOURCES) =====
    db.run(`CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source_name TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT DEFAULT 'monthly',
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // ===== TABEL GOALS (TUJUAN KEUANGAN) =====
    db.run(`CREATE TABLE IF NOT EXISTS financial_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        goal_name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0,
        deadline DATE NOT NULL,
        category TEXT DEFAULT 'savings',
        priority INTEGER DEFAULT 1,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // ===== TABEL ALOKASI BUDGET =====
    db.run(`CREATE TABLE IF NOT EXISTS budget_allocation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        allocated_amount REAL NOT NULL,
        spent_amount REAL DEFAULT 0,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category, month, year),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // ===== TABEL KATEGORI PENGELUARAN =====
    db.run(`CREATE TABLE IF NOT EXISTS expense_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#FF6B6B',
        icon TEXT DEFAULT 'tag',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_name),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // ===== TABEL TRANSAKSI/PENGELUARAN =====
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        transaction_type TEXT CHECK(transaction_type IN ('expense', 'income')) DEFAULT 'expense',
        transaction_date DATE NOT NULL,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT,
        payment_method TEXT DEFAULT 'cash',
        notes TEXT,
        goal_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
        FOREIGN KEY(goal_id) REFERENCES financial_goals(id) ON DELETE SET NULL
    )`);

    // Add goal_id column if it doesn't exist (for migration)
    db.run(`ALTER TABLE transactions ADD COLUMN goal_id INTEGER REFERENCES financial_goals(id) ON DELETE SET NULL`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding goal_id column:', err);
        }
    });

    // ===== TABEL BUDGET RULES (ATURAN ALOKASI DINAMIS) =====
    db.run(`CREATE TABLE IF NOT EXISTS budget_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        rule_name TEXT NOT NULL,
        needs_percent REAL DEFAULT 0.50,
        wants_percent REAL DEFAULT 0.30,
        savings_percent REAL DEFAULT 0.20,
        strategy_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // ===== TABEL PENGELUARAN BERULANG =====
    db.run(`CREATE TABLE IF NOT EXISTS recurring_expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        expense_name TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT DEFAULT 'monthly',
        category_id INTEGER,
        start_date DATE NOT NULL,
        end_date DATE,
        is_active INTEGER DEFAULT 1,
        next_due_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
    )`);
});

module.exports = db;