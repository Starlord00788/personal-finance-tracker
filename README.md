# 💰 Personal Finance Tracker

> A full-stack financial management REST API built with Node.js, Express.js, and PostgreSQL — featuring AI-powered insights, bank statement import, anomaly detection, and multi-currency support.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://personal-finance-tracker-w443.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![Tests](https://img.shields.io/badge/Tests-71%20passed-success?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)]()

---

## 🚀 Live Deployment

**🌐 [https://personal-finance-tracker-w443.onrender.com](https://personal-finance-tracker-w443.onrender.com)**

- Health check: [`/health`](https://personal-finance-tracker-w443.onrender.com/health)
- Interactive Dashboard: [`/`](https://personal-finance-tracker-w443.onrender.com)

> ⚠️ Free-tier Render instances spin down after inactivity. First request may take ~30s to cold-start.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure signup/login with bcrypt hashing + Google OAuth 2.0 |
| 💳 **Transaction Management** | Full CRUD for income/expenses with filtering, pagination, and sorting |
| 📁 **Category System** | Custom categories with type-based organization |
| 💰 **Budget Management** | Create budgets, track utilization, threshold alerts, AI recommendations |
| 📊 **Financial Reports** | Monthly, yearly, and custom date-range reports with chart-ready data |
| 🏦 **Bank Statement Import** | CSV upload → auto-categorization → duplicate detection → bulk import |
| 🔍 **Anomaly Detection** | Z-score statistical analysis, velocity checks, and trend detection |
| 🤖 **AI Insights** | OpenAI GPT-3.5 powered spending analysis, goal planning, and recommendations |
| 💱 **Multi-Currency** | 11 currencies with real-time conversion |
| 📎 **Receipt Upload** | Attach receipt images/PDFs to transactions |
| 📧 **Email Notifications** | Welcome emails, budget alerts, monthly reports via Gmail SMTP |
| 🖥️ **Interactive Dashboard** | Single-page frontend to test all API endpoints |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4.x |
| **Database** | PostgreSQL (Neon serverless) with SQLite fallback |
| **Authentication** | JWT + bcrypt + Passport.js (Google OAuth) |
| **AI Engine** | OpenAI GPT-3.5-turbo |
| **Email** | Nodemailer (Gmail SMTP) |
| **Validation** | express-validator |
| **Security** | Helmet, CORS, rate limiting |
| **Testing** | Jest (71 tests, 6 suites) |
| **Deployment** | Render |

---

## 📦 Quick Start

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database (or use SQLite fallback)

### 1. Clone & Install

```bash
git clone https://github.com/Starlord00788/personal-finance-tracker.git
cd personal-finance-tracker
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)
```

### 3. Database Migration

```bash
npm run migrate       # Run all migrations
npm run seed          # Optional: seed sample data
```

### 4. Start Server

```bash
npm run dev           # Development (hot reload with nodemon)
npm start             # Production
```

Server starts at `http://localhost:3000`

---

## 📡 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | Register new user |
| `POST` | `/api/users/login` | Login (returns JWT) |
| `GET` | `/api/users/profile` | Get user profile |
| `PUT` | `/api/users/profile` | Update profile |
| `PUT` | `/api/users/change-password` | Change password |
| `DELETE` | `/api/users/account` | Delete account |

### 💳 Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/transactions` | Create transaction |
| `GET` | `/api/transactions` | List (filter, sort, paginate) |
| `GET` | `/api/transactions/:id` | Get by ID |
| `PUT` | `/api/transactions/:id` | Update |
| `DELETE` | `/api/transactions/:id` | Delete |
| `GET` | `/api/transactions/dashboard` | Dashboard summary |

### 📁 Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/categories` | Create category |
| `GET` | `/api/categories` | List categories |
| `PUT` | `/api/categories/:id` | Update |
| `DELETE` | `/api/categories/:id` | Delete |

### 💰 Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/budgets` | Create budget |
| `GET` | `/api/budgets` | List budgets |
| `GET` | `/api/budgets/utilization` | Budget utilization |
| `GET` | `/api/budgets/alerts` | Threshold alerts |
| `GET` | `/api/budgets/summary` | Full summary |
| `GET` | `/api/budgets/recommendations` | AI recommendations |
| `GET` | `/api/budgets/period/generate` | Generate period |

### 📊 Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/monthly/:year/:month` | Monthly report |
| `GET` | `/api/reports/yearly/:year` | Yearly report |
| `GET` | `/api/reports/custom?startDate&endDate` | Custom range |

### 🏦 Bank Statements & Anomaly Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/statements/preview` | Preview CSV before import |
| `POST` | `/api/statements/import` | Import CSV transactions |
| `GET` | `/api/statements/anomalies` | Detect spending anomalies |

### 🤖 AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/status` | AI service status |
| `GET` | `/api/ai/insights` | Spending analysis |
| `GET` | `/api/ai/budget-recommendations` | AI budget advice |
| `POST` | `/api/ai/goal-insights` | Financial goal analysis |
| `GET` | `/api/ai/summary` | Full financial summary |

### 🔧 Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/currencies/supported` | 11 supported currencies |
| `POST` | `/api/currencies/convert` | Convert amount |
| `POST` | `/api/receipts/upload` | Upload receipt |
| `GET` | `/api/receipts/user` | Get user receipts |
| `GET` | `/api/auth/google` | Google OAuth login |
| `GET` | `/health` | Health check |

---

## 🧪 Testing

```bash
npm test
```

**71 tests across 6 suites:**
- Auth & User Management
- Transaction CRUD & Filtering
- Category Management
- Budget Management & Alerts
- Reports (Monthly, Yearly, Custom)
- Advanced (Bank Statements, Anomaly Detection, AI)

---

## ⚙️ Environment Variables

See [.env.example](.env.example) for the full template.

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ | Secret for JWT token signing |
| `DB_HOST` | ✅ | PostgreSQL host |
| `DB_USER` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `DB_NAME` | ✅ | Database name |
| `DB_PORT` | ✅ | Database port (default: 5432) |
| `OPENAI_API_KEY` | ❌ | For AI insights (fallback mode without it) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth |
| `SMTP_HOST` | ❌ | Email service host |
| `SMTP_USER` | ❌ | Email username |
| `SMTP_PASS` | ❌ | Email app password |

---

## 📂 Project Structure

```
├── app.js                    # Express app config (middleware, routes, security)
├── src/
│   ├── server.js             # Server entry point
│   ├── config/               # Database & app configuration
│   ├── controllers/          # Request handlers (10 controllers)
│   ├── services/             # Business logic layer
│   ├── repositories/         # Data access layer
│   ├── routes/               # API route definitions
│   ├── middlewares/           # Auth, error handling
│   ├── validations/          # Input validation schemas
│   ├── utils/                # JWT & bcrypt helpers
│   └── db/
│       ├── migrations/       # 10 SQL migration files
│       ├── migrate.js        # Migration runner
│       └── seed.js           # Sample data seeder
├── tests/                    # Jest test suites (71 tests)
├── public/
│   └── index.html            # Interactive dashboard
├── Dockerfile                # Docker support
├── render.yaml               # Render deployment config
└── uploads/                  # Receipt file storage
```

---

## 🚀 Deployment

Deployed on **[Render](https://render.com)** with **[Neon](https://neon.tech)** serverless PostgreSQL.

```bash
# Build
npm ci

# Start
node src/server.js
```

Also supports: Docker, Railway, Fly.io, AWS, Heroku.

---

## 📄 Anti-Plagiarism Declaration

This project was developed independently as part of the **Fischer Jordan Backend Developer Assessment**. All code, architecture decisions, API design, database schema, and test suites are original work authored by **Palash Singhal**. No code was copied from existing solutions, repositories, or third-party submissions. AI tools were used as a development aid for code generation assistance, similar to using documentation or Stack Overflow references.

---

## 👤 Author

**Palash Singhal**  
📧 palashsinghal000@gmail.com  
🔗 [GitHub](https://github.com/Starlord00788)