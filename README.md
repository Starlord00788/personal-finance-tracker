# Personal Finance Tracker

A full-stack financial management application built with Node.js, Express.js, and PostgreSQL (Neon).

## Features

- **JWT Authentication** with Google OAuth support
- **Transaction Management** — income/expense tracking with categories
- **Budget Management** — create budgets, track utilization, get alerts
- **Multi-Currency Support** — exchange rates and currency conversion
- **Receipt Upload** — attach receipts to transactions
- **AI Financial Insights** — powered by OpenAI GPT-3.5
- **Financial Reports** — monthly, yearly, and custom date range reports with chart-ready data
- **Bank Statement Import** — CSV upload with auto-categorization and duplicate detection
- **Anomaly Detection** — statistical analysis of spending patterns (z-score, velocity, trends)
- **Email Notifications** — budget alerts, welcome emails, monthly reports
- **Interactive Dashboard** — single-page frontend with real-time data

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Neon) with SQLite fallback
- **Authentication**: JWT + bcrypt + Passport (Google OAuth)
- **AI**: OpenAI GPT-3.5-turbo
- **Email**: Nodemailer (Gmail SMTP) / Resend / SendGrid
- **Security**: Helmet, CORS, rate limiting, express-validator

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd Fischer-Jordan
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Database Setup

```bash
npm run migrate
npm run seed        # Optional: seed sample data
```

### 4. Start Server

```bash
npm run dev         # Development (with nodemon)
npm start           # Production
```

Server runs at `http://localhost:3000`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login |
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/change-password` | Change password |
| DELETE | `/api/users/account` | Delete account |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create transaction |
| GET | `/api/transactions` | List transactions (with filters) |
| GET | `/api/transactions/:id` | Get transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/dashboard` | Dashboard data |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/categories` | Create category |
| GET | `/api/categories` | List categories |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/budgets` | Create budget |
| GET | `/api/budgets` | List budgets |
| GET | `/api/budgets/utilization` | Budget utilization |
| GET | `/api/budgets/alerts` | Budget alerts |
| GET | `/api/budgets/summary` | Budget summary |
| GET | `/api/budgets/recommendations` | AI recommendations |

### AI Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | Spending insights |
| GET | `/api/ai/budget-recommendations` | Budget recommendations |
| POST | `/api/ai/goal-insights` | Financial goal analysis |
| GET | `/api/ai/summary` | Financial summary |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/monthly/:year/:month` | Monthly report |
| GET | `/api/reports/yearly/:year` | Yearly report |
| GET | `/api/reports/custom?startDate&endDate` | Custom date range report |

### Bank Statements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/statements/preview` | Preview CSV before import |
| POST | `/api/statements/import` | Import bank statement CSV |
| GET | `/api/statements/anomalies` | Detect spending anomalies |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/currencies/supported` | Supported currencies |
| POST | `/api/currencies/convert` | Convert amount |
| POST | `/api/receipts/upload` | Upload receipt |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/health` | Health check |

## Environment Variables

See [.env.example](.env.example) for the full template.

**Required:**
- `JWT_SECRET` — Strong secret for JWT signing
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL credentials

**Optional:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `OPENAI_API_KEY` — AI insights (fallback mode without it)
- `SMTP_USER`, `SMTP_PASS` — Email notifications

## Project Structure

```
├── app.js                 # Express app configuration
├── src/
│   ├── server.js          # Server startup
│   ├── config/            # Database and app config
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   ├── routes/            # API route definitions
│   ├── middlewares/        # Auth, error handling
│   ├── validations/       # Input validation
│   ├── utils/             # JWT, bcrypt helpers
│   └── db/                # Migrations and seeds
├── public/
│   └── index.html         # Frontend dashboard
└── uploads/               # Receipt file storage
```

## Scripts

```bash
npm run dev          # Start with nodemon (hot reload)
npm start            # Production start
npm run migrate      # Run database migrations
npm run seed         # Seed sample data
npm test             # Run tests
```

## Deployment

Ready for deployment on:
- **Render** / **Railway** / **Fly.io**
- **AWS EC2/ECS**
- **DigitalOcean App Platform**
- **Heroku**

Database is hosted on **Neon** (serverless PostgreSQL).

## Author

**Palash Singhal**