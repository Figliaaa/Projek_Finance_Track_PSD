const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
require('dotenv').config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// ===== MIDDLEWARE AUTHENTICATION =====
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token tidak ditemukan' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token tidak valid' });
    }
};

// ===== HELPER: Hitung salary bulanan =====
const getMonthlyIncome = (userId, callback) => {
    db.get(
        `SELECT SUM(amount) as total FROM income WHERE user_id = ? AND is_active = 1`,
        [userId],
        (err, row) => {
            if (err) return callback(err, 0);
            callback(null, row?.total || 0);
        }
    );
};

const getMonthlyTransactionIncome = (userId, month, year, callback) => {
    db.get(
        `SELECT SUM(amount) as total FROM transactions 
         WHERE user_id = ? AND transaction_type = 'income' 
         AND strftime('%m', transaction_date) = ? 
         AND strftime('%Y', transaction_date) = ?`,
        [userId, String(month).padStart(2, '0'), year],
        (err, row) => {
            if (err) return callback(err, 0);
            callback(null, row?.total || 0);
        }
    );
};

const getMonthlyIncomeWithTransactions = (userId, month, year, callback) => {
    getMonthlyIncome(userId, (err, baseIncome) => {
        if (err) return callback(err, 0);
        getMonthlyTransactionIncome(userId, month, year, (err2, transactionIncome) => {
            if (err2) return callback(err2, baseIncome);
            callback(null, baseIncome + transactionIncome);
        });
    });
};

// ===== HELPER: Hitung pengeluaran berulang bulanan =====
const getMonthlyRecurringExpenses = (userId, callback) => {
    db.all(
        `SELECT SUM(amount) as total FROM recurring_expenses 
         WHERE user_id = ? AND is_active = 1 AND frequency = 'monthly'`,
        [userId],
        (err, rows) => {
            if (err) return callback(err, 0);
            callback(null, rows[0]?.total || 0);
        }
    );
};

// ===== HELPER: Ambil budget rules user =====
const getBudgetRules = (userId, callback) => {
    db.get(
        `SELECT * FROM budget_rules WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [userId],
        (err, rules) => {
            // If rules found, return them
            if (rules) return callback(err, rules);
            
            // If no rules found, try to get allocation_strategy from users table and convert it
            db.get(
                `SELECT allocation_strategy FROM users WHERE id = ?`,
                [userId],
                (err2, user) => {
                    if (err2 || !user) return callback(err2, null);
                    
                    let allocation;
                    switch(user.allocation_strategy) {
                        case '40-10-50':
                            allocation = { needs_percent: 0.40, wants_percent: 0.10, savings_percent: 0.50 };
                            break;
                        case '60-20-20':
                            allocation = { needs_percent: 0.60, wants_percent: 0.20, savings_percent: 0.20 };
                            break;
                        case '50-30-20':
                        default:
                            allocation = { needs_percent: 0.50, wants_percent: 0.30, savings_percent: 0.20 };
                    }
                    callback(null, allocation);
                }
            );
        }
    );
};

// ===== HELPER: Hitung alokasi budget optimal =====
const calculateOptimalAllocation = (grossIncome, needsPercent, wantsPercent, savingsPercent) => {
    const needs = grossIncome * needsPercent;
    const wants = grossIncome * wantsPercent;
    const savings = grossIncome * savingsPercent;
    
    return {
        needs: Math.round(needs * 100) / 100,
        wants: Math.round(wants * 100) / 100,
        savings: Math.round(savings * 100) / 100,
        total: Math.round(grossIncome * 100) / 100
    };
};

// ===== ENDPOINT: REGISTER =====
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, salary, location, allocation_strategy } = req.body;

    if (!email || !password || !name || !salary) {
        return res.status(400).json({ error: 'Data wajib diisi' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (name, email, password, location, allocation_strategy) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, location || 'Indonesia', allocation_strategy || '50-30-20'],
            function (err) {
                if (err) return res.status(400).json({ error: 'Email sudah terdaftar' });

                const userId = this.lastID;

                // Buat income entry dengan salary
                db.run(
                    `INSERT INTO income (user_id, source_name, amount, frequency) 
                     VALUES (?, ?, ?, ?)`,
                    [userId, 'Gaji Utama', salary, 'monthly'],
                    (err) => {
                        if (err) console.error(err);
                    }
                );

                // Buat budget rules default
                let allocation;
                switch(allocation_strategy) {
                    case '40-10-50':
                        allocation = { needs: 0.40, wants: 0.10, savings: 0.50 };
                        break;
                    case '60-20-20':
                        allocation = { needs: 0.60, wants: 0.20, savings: 0.20 };
                        break;
                    case '50-30-20':
                    default:
                        allocation = { needs: 0.50, wants: 0.30, savings: 0.20 };
                }

                db.run(
                    `INSERT INTO budget_rules (user_id, needs_percent, wants_percent, savings_percent) 
                     VALUES (?, ?, ?, ?)`,
                    [userId, allocation.needs, allocation.wants, allocation.savings],
                    (err) => {
                        if (err) console.error(err);
                    }
                );

                // Buat kategori default
                const defaultCategories = [
                    { name: 'Makanan & Minuman', icon: 'fork-knife' },
                    { name: 'Transportasi', icon: 'car' },
                    { name: 'Hiburan', icon: 'film' },
                    { name: 'Kesehatan', icon: 'heart' },
                    { name: 'Pendidikan', icon: 'book' },
                    { name: 'Cicilan', icon: 'credit-card' },
                    { name: 'Tagihan Rutin', icon: 'bill' },
                    { name: 'Lainnya', icon: 'tag' }
                ];

                defaultCategories.forEach(cat => {
                    db.run(
                        `INSERT INTO expense_categories (user_id, category_name, icon) 
                         VALUES (?, ?, ?)`,
                        [userId, cat.name, cat.icon],
                        (err) => {
                            if (err) console.error(err);
                        }
                    );
                });

                const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
                res.json({ 
                    message: 'Registrasi berhasil!',
                    token,
                    userId,
                    user: { name, email }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== ENDPOINT: LOGIN =====
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: 'User tidak ditemukan' });

        try {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Password salah' });
            }

            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
            res.json({ 
                message: 'Login berhasil!',
                token,
                userId: user.id,
                user: { id: user.id, name: user.name, email: user.email }
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
});

// ===== ENDPOINT: GET PROFILE =====
app.get('/api/user/profile', authMiddleware, (req, res) => {
    db.get(`SELECT id, name, email, location, allocation_strategy, created_at FROM users WHERE id = ?`, 
        [req.userId], 
        (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
            res.json(user);
        }
    );
});

// ===== ENDPOINT: UPDATE PROFILE =====
app.put('/api/user/profile', authMiddleware, (req, res) => {
    const { name, location, allocation_strategy } = req.body;

    db.run(
        `UPDATE users SET name = ?, location = ?, allocation_strategy = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name || '', location || '', allocation_strategy || '50-30-20', req.userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Profil berhasil diperbarui' });
        }
    );
});

// ===== ENDPOINT: ADD FINANCIAL GOAL =====
app.post('/api/goals', authMiddleware, (req, res) => {
    const { goal_name, target_amount, deadline, category, priority, description } = req.body;

    if (!goal_name || !target_amount || !deadline) {
        return res.status(400).json({ error: 'Nama goal, target, dan deadline wajib diisi' });
    }

    db.run(
        `INSERT INTO financial_goals (user_id, goal_name, target_amount, deadline, category, priority, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.userId, goal_name, target_amount, deadline, category || 'savings', priority || 1, description || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Goal berhasil dibuat',
                goalId: this.lastID
            });
        }
    );
});

// ===== ENDPOINT: GET ALL GOALS =====
app.get('/api/goals', authMiddleware, (req, res) => {
    db.all(
        `SELECT * FROM financial_goals WHERE user_id = ? ORDER BY priority DESC, deadline ASC`,
        [req.userId],
        (err, goals) => {
            if (err) return res.status(500).json({ error: err.message });

            // Add progress calculation based on current_amount
            const goalsWithProgress = goals.map(goal => {
                let progress;
                if (goal.current_amount >= goal.target_amount) {
                    progress = 100;
                } else if (goal.target_amount > 0) {
                    progress = (goal.current_amount / goal.target_amount) * 100;
                } else {
                    progress = 0;
                }
                return { ...goal, progress: Math.round(progress * 100) / 100 };
            });

            res.json(goalsWithProgress);
        }
    );
});

// ===== ENDPOINT: UPDATE GOAL =====
app.put('/api/goals/:goalId', authMiddleware, (req, res) => {
    const { goalId } = req.params;
    const { goal_name, target_amount, deadline, category, priority, status, description } = req.body;

    db.run(
        `UPDATE financial_goals 
         SET goal_name = ?, target_amount = ?, deadline = ?, category = ?, priority = ?, status = ?, description = ?, 
             current_amount = CASE WHEN ? = 'completed' THEN ? ELSE current_amount END, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND user_id = ?`,
        [goal_name, target_amount, deadline, category, priority, status, description, status, target_amount, goalId, req.userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Goal berhasil diperbarui' });
        }
    );
});

// ===== ENDPOINT: HITUNG ALOKASI BUDGET UNTUK GOALS =====
app.post('/api/budget/calculate', authMiddleware, (req, res) => {
    const { use_goals } = req.body;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    getMonthlyIncomeWithTransactions(req.userId, currentMonth, currentYear, (err, monthlyIncome) => {
        if (err) return res.status(500).json({ error: err.message });

        getBudgetRules(req.userId, (err, rules) => {
            if (err) return res.status(500).json({ error: err.message });

            const needsPercent = rules?.needs_percent || 0.50;
            const wantsPercent = rules?.wants_percent || 0.30;
            const savingsPercent = rules?.savings_percent || 0.20;

            let allocation = calculateOptimalAllocation(
                monthlyIncome,
                needsPercent,
                wantsPercent,
                savingsPercent
            );
            allocation.total = Math.round(monthlyIncome * 100) / 100;

            // Jika menggunakan goals, hitung berapa banyak yang perlu dialokasikan
            if (use_goals) {
                db.all(
                    `SELECT * FROM financial_goals WHERE user_id = ? AND status = 'active'`,
                    [req.userId],
                    (err, goals) => {
                        if (err) return res.status(500).json({ error: err.message });

                        let goalAllocation = 0;
                        let goalDetails = [];

                        goals.forEach(goal => {
                            const deadline = new Date(goal.deadline);
                            const now = new Date();
                            const monthsLeft = Math.max(1,
                                (deadline.getFullYear() - now.getFullYear()) * 12 +
                                (deadline.getMonth() - now.getMonth())
                            );

                            const monthlyNeeded = Math.max(0, (goal.target_amount - goal.current_amount) / monthsLeft);
                            goalAllocation += monthlyNeeded;

                            goalDetails.push({
                                goalId: goal.id,
                                goalName: goal.goal_name,
                                targetAmount: goal.target_amount,
                                monthlyNeeded: Math.round(monthlyNeeded * 100) / 100,
                                monthsLeft,
                                deadline: goal.deadline
                            });
                        });

                        // Goals are funded from savings allocation, don't reduce wants
                        allocation.savings_for_goals = Math.round(goalAllocation * 100) / 100;
                        allocation.total = Math.round(monthlyIncome * 100) / 100;

                        res.json({
                            monthlyIncome,
                            allocation,
                            goals: goalDetails,
                            message: 'Alokasi budget berhasil dihitung dengan pertimbangan goals'
                        });
                    }
                );
            } else {
                res.json({
                    monthlyIncome,
                    allocation,
                    message: 'Alokasi budget berhasil dihitung'
                });
            }
        });
    });
});

// ===== ENDPOINT: ADD TRANSACTION =====
app.post('/api/transactions', authMiddleware, (req, res) => {
    const { category_id, amount, description, transaction_type, transaction_date, payment_method, goal_id } = req.body;

    if (!category_id || !amount || !transaction_date) {
        return res.status(400).json({ error: 'Category, amount, dan tanggal wajib diisi' });
    }

    db.run(
        `INSERT INTO transactions (user_id, category_id, amount, description, transaction_type, transaction_date, payment_method, goal_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.userId, category_id, amount, description || '', transaction_type || 'expense', transaction_date, payment_method || 'cash', goal_id || null],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // If this is an expense for a goal, update the goal's current_amount
            if (transaction_type === 'expense' && goal_id) {
                db.run(
                    `UPDATE financial_goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?`,
                    [amount, goal_id, req.userId],
                    (updateErr) => {
                        if (updateErr) console.error('Error updating goal current_amount:', updateErr);
                    }
                );
            }

            res.json({ 
                message: 'Transaksi berhasil dicatat',
                transactionId: this.lastID
            });
        }
    );
});

// ===== ENDPOINT: GET TRANSACTIONS (DENGAN FILTER) =====
app.get('/api/transactions', authMiddleware, (req, res) => {
    const { month, year, category_id } = req.query;
    
    let query = `SELECT t.*, c.category_name 
                 FROM transactions t
                 LEFT JOIN expense_categories c ON t.category_id = c.id
                 WHERE t.user_id = ?`;
    let params = [req.userId];

    if (month && year) {
        query += ` AND strftime('%m', t.transaction_date) = ? AND strftime('%Y', t.transaction_date) = ?`;
        params.push(String(month).padStart(2, '0'), year);
    }

    if (category_id) {
        query += ` AND t.category_id = ?`;
        params.push(category_id);
    }

    query += ` ORDER BY t.transaction_date DESC`;

    db.all(query, params, (err, transactions) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(transactions || []);
    });
});

// ===== ENDPOINT: GET EXPENSE CATEGORIES =====
app.get('/api/categories', authMiddleware, (req, res) => {
    db.all(
        `SELECT * FROM expense_categories WHERE user_id = ? ORDER BY category_name`,
        [req.userId],
        (err, categories) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(categories || []);
        }
    );
});

// ===== ENDPOINT: ADD EXPENSE CATEGORY =====
app.post('/api/categories', authMiddleware, (req, res) => {
    const { category_name, description, icon, color } = req.body;

    if (!category_name) {
        return res.status(400).json({ error: 'Nama kategori wajib diisi' });
    }

    db.run(
        `INSERT INTO expense_categories (user_id, category_name, description, icon, color) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.userId, category_name, description || '', icon || 'tag', color || '#FF6B6B'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Kategori berhasil dibuat',
                categoryId: this.lastID
            });
        }
    );
});

// ===== ENDPOINT: MONTHLY BUDGET SUMMARY =====
app.get('/api/budget/summary', authMiddleware, (req, res) => {
    const { month, year } = req.query;
    const now = new Date();
    const currentMonth = month || (now.getMonth() + 1);
    const currentYear  = year  || now.getFullYear();
    const mm = String(currentMonth).padStart(2, '0');
    const yy = String(currentYear);

    Promise.all([

        // [0] Total expense bulan ini
        new Promise((resolve) => {
            db.get(
                `SELECT COALESCE(SUM(amount), 0) as total_spent
                 FROM transactions
                 WHERE user_id = ? AND transaction_type = 'expense'
                 AND strftime('%m', transaction_date) = ?
                 AND strftime('%Y', transaction_date) = ?`,
                [req.userId, mm, yy],
                (err, row) => resolve(row?.total_spent || 0)
            );
        }),

        // [1] Pengeluaran hari ini saja (reset otomatis tiap hari)
        new Promise((resolve) => {
            db.get(
                `SELECT COALESCE(SUM(amount), 0) as spent_today
                 FROM transactions
                 WHERE user_id = ? AND transaction_type = 'expense'
                 AND transaction_date = date('now', 'localtime')`,
                [req.userId],
                (err, row) => resolve(row?.spent_today || 0)
            );
        }),

        // [2] Base income dari tabel income (gaji tetap, tidak berubah tiap bulan)
        new Promise((resolve) => {
            db.get(
                `SELECT COALESCE(SUM(amount), 0) as total
                 FROM income
                 WHERE user_id = ? AND is_active = 1`,
                [req.userId],
                (err, row) => resolve(row?.total || 0)
            );
        }),

        // [3] Income tambahan dari transaksi tipe 'income' bulan ini
        new Promise((resolve) => {
            db.get(
                `SELECT COALESCE(SUM(amount), 0) as total
                 FROM transactions
                 WHERE user_id = ? AND transaction_type = 'income'
                 AND strftime('%m', transaction_date) = ?
                 AND strftime('%Y', transaction_date) = ?`,
                [req.userId, mm, yy],
                (err, row) => resolve(row?.total || 0)
            );
        }),

        // [4] Budget rules
        new Promise((resolve) => {
            getBudgetRules(req.userId, (err, rules) => resolve(rules || {}));
        }),

        // [5] Active goals
        new Promise((resolve) => {
            db.all(
                `SELECT target_amount, current_amount, deadline
                 FROM financial_goals
                 WHERE user_id = ? AND status = 'active'`,
                [req.userId],
                (err, goals) => resolve(goals || [])
            );
        })

    ]).then(([totalSpentThisMonth, spentToday, baseIncome, transactionIncome, rules, activeGoals]) => {

        // income bulan ini = gaji tetap + transaksi income bulan ini
        const income = baseIncome + transactionIncome;

        const allocation = calculateOptimalAllocation(
            income,
            rules.needs_percent || 0.50,
            rules.wants_percent || 0.30,
            rules.savings_percent || 0.20
        );

        // Hitung total kebutuhan monthly untuk goals aktif
        let goalSavings = 0;
        activeGoals.forEach(goal => {
            const deadline   = new Date(goal.deadline);
            const monthsLeft = Math.max(1,
                (deadline.getFullYear() - now.getFullYear()) * 12 +
                (deadline.getMonth()    - now.getMonth())
            );
            goalSavings += Math.max(0, goal.target_amount - goal.current_amount) / monthsLeft;
        });
        goalSavings = Math.round(goalSavings * 100) / 100;

        // totalRemaining = income dikurangi semua expense bulan ini
        // Otomatis reset di bulan baru karena query pakai filter bulan & tahun
        const totalRemaining = income - totalSpentThisMonth;

        res.json({
            month: currentMonth,
            year:  currentYear,
            income,
            baseIncome,
            allocation: {
                needs:             allocation.needs,
                wants:             allocation.wants,
                savings:           Math.max(0, allocation.savings - goalSavings),
                savings_for_goals: goalSavings,
                total:             allocation.total
            },
            summary: {
                totalSpent:    totalSpentThisMonth,
                spentToday,
                totalRemaining,
            }
        });

    }).catch(err => res.status(500).json({ error: err.message }));
});

// ===== ENDPOINT: ANALYTICS & INSIGHTS =====
app.get('/api/analytics', authMiddleware, (req, res) => {
    db.all(
        `SELECT 
            strftime('%m-%Y', transaction_date) as month,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense,
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
            COUNT(*) as transaction_count
         FROM transactions
         WHERE user_id = ?
         GROUP BY strftime('%m-%Y', transaction_date)
         ORDER BY month DESC
         LIMIT 12`,
        [req.userId],
        (err, analytics) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.all(
                `SELECT c.category_name, SUM(t.amount) as total
                 FROM transactions t
                 LEFT JOIN expense_categories c ON t.category_id = c.id
                 WHERE t.user_id = ? AND t.transaction_type = 'expense'
                 AND strftime('%Y-%m', t.transaction_date) >= date('now', '-3 months')
                 GROUP BY t.category_id
                 ORDER BY total DESC`,
                [req.userId],
                (err, categorySpending) => {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    res.json({
                        monthlyTrends: analytics || [],
                        topCategories: categorySpending || []
                    });
                }
            );
        }
    );
});

// ===== ENDPOINT: ADD RECURRING EXPENSE =====
app.post('/api/recurring-expenses', authMiddleware, (req, res) => {
    const { expense_name, amount, frequency, category_id, start_date, end_date, next_due_date } = req.body;

    if (!expense_name || !amount || !frequency || !start_date) {
        return res.status(400).json({ error: 'Nama, jumlah, frekuensi, dan tanggal mulai wajib diisi' });
    }

    db.run(
        `INSERT INTO recurring_expenses (user_id, expense_name, amount, frequency, category_id, start_date, end_date, is_active, next_due_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.userId, expense_name, amount, frequency, category_id || null, start_date, end_date || null, 1, next_due_date || start_date],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
                message: 'Recurring expense berhasil dibuat',
                recurringId: this.lastID
            });
        }
    );
});

// ===== ENDPOINT: GET RECURRING EXPENSES =====
app.get('/api/recurring-expenses', authMiddleware, (req, res) => {
    db.all(
        `SELECT r.*, c.category_name FROM recurring_expenses r
         LEFT JOIN expense_categories c ON r.category_id = c.id
         WHERE r.user_id = ? ORDER BY r.start_date DESC`,
        [req.userId],
        (err, expenses) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(expenses || []);
        }
    );
});

// ===== ENDPOINT: UPDATE RECURRING EXPENSE =====
app.put('/api/recurring-expenses/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { expense_name, amount, frequency, category_id, start_date, end_date, next_due_date, is_active } = req.body;

    db.run(
        `UPDATE recurring_expenses SET expense_name = ?, amount = ?, frequency = ?, category_id = ?, start_date = ?, end_date = ?, next_due_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [expense_name, amount, frequency, category_id || null, start_date, end_date || null, next_due_date || null, is_active ? 1 : 0, id, req.userId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Recurring expense berhasil diperbarui' });
        }
    );
});

// ===== ENDPOINT: ADD INCOME SOURCE =====
app.post('/api/income', authMiddleware, (req, res) => {
    const { source_name, amount, frequency, description } = req.body;

    if (!source_name || !amount) {
        return res.status(400).json({ error: 'Nama sumber dan jumlah wajib diisi' });
    }

    db.run(
        `INSERT INTO income (user_id, source_name, amount, frequency, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.userId, source_name, amount, frequency || 'monthly', description || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                message: 'Sumber pendapatan berhasil ditambahkan',
                incomeId: this.lastID
            });
        }
    );
});

// ===== ENDPOINT: GET INCOME SOURCES =====
app.get('/api/income', authMiddleware, (req, res) => {
    db.all(
        `SELECT * FROM income WHERE user_id = ? AND is_active = 1 ORDER BY source_name`,
        [req.userId],
        (err, income) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(income || []);
        }
    );
});

app.listen(3000, () => {
    console.log('🚀 Server berjalan di http://localhost:3000');
});