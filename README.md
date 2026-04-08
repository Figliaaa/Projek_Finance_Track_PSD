# 💰 Personal Financial Tracker - Full Stack Application

A comprehensive personal financial management platform built with **Node.js**, **SQLite3**, and **React** that helps users track expenses, set financial goals, and optimize spending allocation using intelligent budgeting strategies.

## 🎯 Features

### 🔐 Authentication & User Management
- Secure user registration and login with password hashing (bcryptjs)
- JWT token-based authentication
- User profile management
- Personalized budget strategies

### 💳 Budget Management
- **Multiple Budget Allocation Strategies**:
  - 50/30/20 Rule (Standard)
  - Aggressive Saving Strategy
  - Comfort Living Strategy
  - Location-based dynamic allocation
- Real-time budget vs actual tracking
- Monthly budget summary with remaining balance

### 🎯 Financial Goals
- Create and manage multiple financial goals
- Set target amounts and deadlines
- Priority-based goal allocation
- Smart calculation of required monthly savings for each goal
- Goal progress tracking
- Goal status management (active, completed, postponed)

### 💸 Expense Tracking
- Record and categorize all transactions
- Customizable expense categories with icons
- Transaction history with filtering (by month, year, category)
- Multiple payment methods support
- Recurring expense management
- Budget limit alerts

### 💵 Income Management
- Multiple income sources support
- Monthly income calculation
- Income frequency options (daily, weekly, monthly, annual)
- Active/inactive income source management

### 📊 Analytics & Insights
- Monthly spending trends
- Top expense categories analysis
- Budget vs actual comparison
- Expense pattern analysis
- Automated financial recommendations
- 12-month financial history

### 🧮 Advanced Calculations
- **Goal-Based Spending**: Automatically calculates how much to spend on goals
- **Emergency Fund Calculator**: Determines required emergency fund (3-6 months)
- **Debt Payoff Strategies**: Snowball vs Avalanche methods
- **Wealth Projection**: Long-term savings growth with compound interest
- **Expense Analysis**: Detect spending outliers and trends
- **Smart Recommendations**: Personalized financial advice

## 🏗️ Project Structure

```
PSD2-Final/
├── backend/
│   ├── server.js                 # Main Express server with all API endpoints
│   ├── database.js               # SQLite3 database initialization & schemas
│   ├── calculations.js           # Advanced financial calculation algorithms
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Environment variables
│   ├── API_DOCUMENTATION.md      # Detailed API endpoints documentation
│   └── budget.sqlite             # SQLite database file (auto-created)
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main React component
    │   ├── main.jsx             # React entry point
    │   ├── index.css            # Global styles
    │   ├── App.css              # App component styles
    │   └── assets/              # Static assets
    ├── public/                   # Public static files
    ├── vite.config.js           # Vite configuration
    ├── eslint.config.js         # ESLint configuration
    └── package.json             # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14+)
- **npm** or **yarn**
- **SQLite3** (usually included with Node.js)

### Installation

1. **Clone or extract the project**
   ```bash
   cd PSD2-Final
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Setup

Create `.env` file in the `backend` folder (already included):
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
PORT=3000
DATABASE_PATH=./budget.sqlite
```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   # or
   node server.js
   ```
   Server will run at `http://localhost:3000`

2. **Start Frontend Development Server** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run at `http://localhost:5173`

## 📚 API Documentation

Complete API documentation is available in `backend/API_DOCUMENTATION.md`

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Budget & Allocation
- `POST /api/budget/calculate` - Calculate optimal budget allocation
- `GET /api/budget/summary` - Get monthly budget summary

#### Goals
- `POST /api/goals` - Create new financial goal
- `GET /api/goals` - Get all user goals
- `PUT /api/goals/:goalId` - Update goal

#### Transactions
- `POST /api/transactions` - Record new transaction
- `GET /api/transactions` - Get transactions with filters

#### Categories
- `GET /api/categories` - Get all expense categories
- `POST /api/categories` - Create custom category

#### Income
- `POST /api/income` - Add income source
- `GET /api/income` - Get all income sources

#### Analytics
- `GET /api/analytics` - Get financial analytics

## 💾 Database Schema

### Users Table
Stores user account information and preferences.
```sql
users (id, name, email, password, location, currency, allocation_strategy, created_at, updated_at)
```

### Financial Goals Table
Manages user's financial targets and objectives.
```sql
financial_goals (id, user_id, goal_name, target_amount, current_amount, deadline, category, priority, status, created_at)
```

### Transactions Table
Records all income and expense transactions.
```sql
transactions (id, user_id, category_id, amount, description, transaction_type, transaction_date, payment_method, created_at)
```

### Budget Allocation Table
Tracks monthly budget allocations and spending.
```sql
budget_allocation (id, user_id, category, allocated_amount, spent_amount, month, year)
```

### Income Table
Manages multiple income sources.
```sql
income (id, user_id, source_name, amount, frequency, description, is_active, created_at)
```

### Expense Categories Table
Stores user's custom expense categories.
```sql
expense_categories (id, user_id, category_name, description, color, icon, created_at)
```

### Budget Rules Table
Stores budget allocation strategies.
```sql
budget_rules (id, user_id, rule_name, needs_percent, wants_percent, savings_percent, created_at)
```

### Recurring Expenses Table
Manages recurring expense tracking.
```sql
recurring_expenses (id, user_id, expense_name, amount, frequency, category_id, start_date, end_date, is_active, next_due_date, created_at)
```

## 🧮 Budget Allocation Strategies

### 1. **50/30/20 Rule (Default)**
- 50% Needs (essentials)
- 30% Wants (lifestyle)
- 20% Savings & Debt

### 2. **Aggressive Saving Strategy**
- 40% Needs
- 20% Wants
- 40% Savings (for reaching goals faster)

### 3. **Comfort Living Strategy**
- 50% Needs
- 40% Wants
- 10% Savings (more flexible lifestyle)

### 4. **Location-Based Adjustment**
Automatically adjusts based on city cost of living:
- **Jakarta**: 60% Needs, 20% Wants, 20% Savings
- **Surabaya**: 55% Needs, 25% Wants, 20% Savings
- **Other Cities**: Standard 50/30/20

## 🎯 Goal-Based Spending Calculation

The system intelligently calculates monthly spending needed to reach financial goals:

1. **Identifies all active goals** and their deadlines
2. **Calculates months remaining** until each goal deadline
3. **Determines required monthly allocation** for each goal
4. **Prioritizes goals** based on user-defined priority
5. **Adjusts spending allocation** to accommodate goal achievement
6. **Provides warnings** if goals might be unreachable

### Example:
If a goal is to save Rp 10,000,000 for a vacation in 20 months, the system will:
- Calculate monthly needed: 10,000,000 ÷ 20 = Rp 500,000/month
- Automatically allocate from savings category
- Track progress toward goal
- Adjust other spending if necessary

## 📊 Key Calculations

### Emergency Fund
- **Minimum**: 3 months of monthly expenses
- **Recommended**: 6 months of monthly expenses

### Wealth Growth Projection
Projects future balance with compound interest based on:
- Current savings
- Monthly contributions
- Annual interest rate (default 6%)
- Investment horizon

### Debt Payoff Strategy
Two methods:
- **Snowball**: Pay smallest debt first (psychological wins)
- **Avalanche**: Pay highest interest first (mathematical optimization)

### Expense Analysis
- Detects spending patterns and trends
- Identifies outliers
- Calculates average spending per category
- Shows spending trajectory (increasing/decreasing/stable)

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **SQL Injection Prevention**: Parameterized queries
- **CORS Protection**: Cross-origin resource sharing configured
- **Environment Variables**: Sensitive data in .env file

## 🎨 Frontend Features (To Be Implemented)

- Dashboard with spending overview
- Goal visualization with progress bars
- Transaction chart and analytics
- Budget vs Actual comparison charts
- Category breakdown pie charts
- Monthly trend line graphs
- Responsive mobile design
- Dark mode support

## 📱 Responsive Design

- Desktop: Full-featured experience
- Tablet: Optimized layout
- Mobile: Touch-friendly interface

## 🛠️ Technologies Used

### Backend
- **Express.js** - Web framework
- **SQLite3** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - CORS middleware
- **dotenv** - Environment configuration

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Axios** (to add) - HTTP client
- **Chart.js** (to add) - Data visualization
- **Tailwind CSS** (to add) - Styling

## 📋 Usage Examples

### 1. Register & Create Budget
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "salary": 5000000,
    "location": "Jakarta"
  }'
```

### 2. Create Financial Goal
```bash
curl -X POST http://localhost:3000/api/goals \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "goal_name": "Liburan Bali",
    "target_amount": 15000000,
    "deadline": "2025-06-30",
    "priority": 1
  }'
```

### 3. Calculate Optimal Budget with Goals
```bash
curl -X POST http://localhost:3000/api/budget/calculate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"use_goals": true}'
```

### 4. Record Expense
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "amount": 250000,
    "description": "Groceries",
    "transaction_type": "expense",
    "transaction_date": "2024-01-20"
  }'
```

## 🚀 Deployment

### Heroku Deployment

1. Install Heroku CLI
2. Create `Procfile` in backend folder:
   ```
   web: node server.js
   ```
3. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set JWT_SECRET=your-production-secret
   git push heroku main
   ```

### Vercel Deployment (Frontend)

```bash
npm install -g vercel
vercel
```

## 📈 Future Enhancements

- [ ] Multi-currency support with real-time conversion
- [ ] Recurring transactions automation
- [ ] Budget sharing with family members
- [ ] Mobile app (React Native)
- [ ] Email notifications and reports
- [ ] Integration with banking APIs
- [ ] AI-powered spending recommendations
- [ ] Invoice and receipt management
- [ ] Tax report generation
- [ ] Investment portfolio tracking

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Try npm start again
npm start
```

### Database errors
```bash
# Delete the old database
rm budget.sqlite

# Server will recreate it on startup
node server.js
```

### CORS errors
Check that frontend and backend URLs are correctly configured in headers.

## 📄 License

MIT License - Feel free to use for personal and commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please create an issue in the repository.

## 🙏 Acknowledgments

- Budget allocation strategies inspired by financial best practices
- Database design based on personal finance application patterns

---

**Happy budgeting! 💰📊**
