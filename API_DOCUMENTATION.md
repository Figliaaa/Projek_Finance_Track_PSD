# 📊 Personal Financial Tracker API Documentation

## 🔐 Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Create new user account with initial budget setup.

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure_password",
    "salary": 5000000,
    "location": "Jakarta",
    "allocation_strategy": "50-30-20"
}
```

**Response:**
```json
{
    "message": "Registrasi berhasil!",
    "token": "eyJhbGc...",
    "userId": 1,
    "user": {
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

---

### Login User
**POST** `/api/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "secure_password"
}
```

**Response:**
```json
{
    "message": "Login berhasil!",
    "token": "eyJhbGc...",
    "userId": 1,
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    }
}
```

---

## 👤 User Profile Endpoints

### Get Profile
**GET** `/api/user/profile`

Retrieve current user profile. Requires authentication token.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "location": "Jakarta",
    "allocation_strategy": "50-30-20",
    "created_at": "2024-01-15T10:30:00.000Z"
}
```

---

### Update Profile
**PUT** `/api/user/profile`

Update user profile information.

**Request Body:**
```json
{
    "name": "John Doe",
    "location": "Surabaya",
    "allocation_strategy": "aggressive-saving"
}
```

---

## 💰 Budget Calculation Endpoints

### Calculate Budget Allocation
**POST** `/api/budget/calculate`

Calculate optimal budget allocation based on income and goals.

**Request Body:**
```json
{
    "use_goals": true
}
```

**Response:**
```json
{
    "monthlyIncome": 5000000,
    "allocation": {
        "needs": 2500000,
        "wants": 1500000,
        "savings": 1000000,
        "savings_for_goals": 300000,
        "total": 5000000
    },
    "goals": [
        {
            "goalId": 1,
            "goalName": "Liburan ke Bali",
            "targetAmount": 10000000,
            "monthlyNeeded": 500000,
            "monthsLeft": 20,
            "deadline": "2025-12-31"
        }
    ],
    "message": "Alokasi budget berhasil dihitung dengan pertimbangan goals"
}
```

---

### Monthly Budget Summary
**GET** `/api/budget/summary?month=1&year=2024`

Get detailed budget vs actual spending for specific month.

**Response:**
```json
{
    "month": 1,
    "year": 2024,
    "income": 5000000,
    "allocation": {
        "needs": 2500000,
        "wants": 1500000,
        "savings": 1000000
    },
    "spent": {
        "Makanan & Minuman": 750000,
        "Transportasi": 200000,
        "Hiburan": 300000
    },
    "summary": {
        "totalSpent": 1250000,
        "spentToday": 150000,
        "totalRemaining": 3750000,
        "remaining": {
            "needs": 1750000,
            "wants": 1200000,
            "savings": 1000000
        }
    }
}
```

---

## 🎯 Financial Goals Endpoints

### Create Goal
**POST** `/api/goals`

Create new financial goal.

**Request Body:**
```json
{
    "goal_name": "Liburan ke Bali",
    "target_amount": 10000000,
    "deadline": "2025-12-31",
    "category": "vacation",
    "priority": 1,
    "description": "Liburan keluarga 2 minggu"
}
```

**Response:**
```json
{
    "message": "Goal berhasil dibuat",
    "goalId": 1
}
```

---

### Get All Goals
**GET** `/api/goals`

Retrieve all active goals for user.

**Response:**
```json
[
    {
        "id": 1,
        "user_id": 1,
        "goal_name": "Liburan ke Bali",
        "target_amount": 10000000,
        "current_amount": 2000000,
        "deadline": "2025-12-31",
        "category": "vacation",
        "priority": 1,
        "description": "Liburan keluarga 2 minggu",
        "status": "active",
        "created_at": "2024-01-15T10:30:00.000Z"
    }
]
```

---

### Update Goal
**PUT** `/api/goals/{goalId}`

Update existing goal.

**Request Body:**
```json
{
    "goal_name": "Liburan ke Bali",
    "target_amount": 15000000,
    "deadline": "2025-12-31",
    "priority": 1,
    "status": "active"
}
```

---

## 💳 Expense Categories Endpoints

### Get Categories
**GET** `/api/categories`

Retrieve all expense categories.

**Response:**
```json
[
    {
        "id": 1,
        "user_id": 1,
        "category_name": "Makanan & Minuman",
        "description": "",
        "color": "#FF6B6B",
        "icon": "fork-knife",
        "created_at": "2024-01-15T10:30:00.000Z"
    }
]
```

---

### Add Category
**POST** `/api/categories`

Create custom expense category.

**Request Body:**
```json
{
    "category_name": "Streaming Services",
    "description": "Netflix, Spotify, dll",
    "icon": "play",
    "color": "#4ECDC4"
}
```

---

## 💸 Transaction Endpoints

### Record Transaction
**POST** `/api/transactions`

Record new expense or income transaction.

**Request Body:**
```json
{
    "category_id": 1,
    "amount": 150000,
    "description": "Makan malam di resto",
    "transaction_type": "expense",
    "transaction_date": "2024-01-15",
    "payment_method": "debit-card"
}
```

**Response:**
```json
{
    "message": "Transaksi berhasil dicatat",
    "transactionId": 42
}
```

---

### Get Transactions
**GET** `/api/transactions?month=1&year=2024&category_id=1`

Retrieve transactions with optional filters.

**Query Parameters:**
- `month`: Filter by month (1-12)
- `year`: Filter by year
- `category_id`: Filter by category

**Response:**
```json
[
    {
        "id": 42,
        "user_id": 1,
        "category_id": 1,
        "amount": 150000,
        "description": "Makan malam di resto",
        "transaction_type": "expense",
        "transaction_date": "2024-01-15",
        "payment_method": "debit-card",
        "category_name": "Makanan & Minuman",
        "created_at": "2024-01-15T19:30:00.000Z"
    }
]
```

---

## 💵 Income Endpoints

### Add Income Source
**POST** `/api/income`

Add new income source.

**Request Body:**
```json
{
    "source_name": "Freelance Project",
    "amount": 2000000,
    "frequency": "monthly",
    "description": "Web development project"
}
```

---

### Get Income Sources
**GET** `/api/income`

Retrieve all active income sources.

**Response:**
```json
[
    {
        "id": 1,
        "user_id": 1,
        "source_name": "Gaji Utama",
        "amount": 5000000,
        "frequency": "monthly",
        "is_active": 1,
        "created_at": "2024-01-15T10:30:00.000Z"
    }
]
```

---

## 📊 Analytics & Reporting Endpoints

### Get Analytics
**GET** `/api/analytics`

Get financial analytics and insights.

**Response:**
```json
{
    "monthlyTrends": [
        {
            "month": "01-2024",
            "total_expense": 2500000,
            "total_income": 5000000,
            "transaction_count": 45
        }
    ],
    "topCategories": [
        {
            "category_name": "Makanan & Minuman",
            "total": 1200000
        },
        {
            "category_name": "Transportasi",
            "total": 600000
        }
    ]
}
```

---

## 🔑 How to Use Token

All endpoints (except `/api/auth/register` and `/api/auth/login`) require authentication.

Include token in request header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📌 Error Responses

### 401 Unauthorized
```json
{
    "error": "Token tidak ditemukan"
}
```

### 400 Bad Request
```json
{
    "error": "Data wajib diisi"
}
```

### 404 Not Found
```json
{
    "error": "User tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
    "error": "Error message details"
}
```

---

## 🚀 Quick Start Guide

1. **Register**
   ```bash
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

2. **Login**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "password123"
     }'
   ```

3. **Calculate Budget**
   ```bash
   curl -X POST http://localhost:3000/api/budget/calculate \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"use_goals": true}'
   ```

4. **Create Goal**
   ```bash
   curl -X POST http://localhost:3000/api/goals \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{
       "goal_name": "Liburan",
       "target_amount": 10000000,
       "deadline": "2025-12-31",
       "priority": 1
     }'
   ```

5. **Record Transaction**
   ```bash
   curl -X POST http://localhost:3000/api/transactions \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{
       "category_id": 1,
       "amount": 150000,
       "description": "Makan siang",
       "transaction_type": "expense",
       "transaction_date": "2024-01-15"
     }'
   ```

---

## 🎯 Smart Features

### Budget Allocation Strategies
- **50-30-20 Rule**: Standard allocation (50% needs, 30% wants, 20% savings)
- **Aggressive Saving**: Higher savings focus (40% needs, 20% wants, 40% savings)
- **Comfort Living**: More flexibility (50% needs, 40% wants, 10% savings)
- **Location-Based**: Adjustment based on city cost of living

### Goal-Based Calculations
System automatically calculates monthly allocation needed for each goal based on:
- Target amount
- Current progress
- Remaining timeframe
- Goal priority

### Analytics
- Monthly spending trends
- Top expense categories
- Budget vs actual comparison
- Financial recommendations
