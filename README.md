# Personal Finance Tracker - Day 1 Implementation

A backend-driven financial analytics platform built with Node.js, Express.js, and PostgreSQL.

## 🚀 Day 1 Complete Features

✅ **Project Setup & Architecture**
- Clean MVC architecture with service-repository pattern
- Express.js server with security middleware
- PostgreSQL database design
- JWT authentication system
- Complete user CRUD operations

✅ **Database Schema**
- Users table with UUID primary keys
- Categories, transactions, budgets, notifications, exchange_rates tables
- Proper foreign key relationships
- Soft delete support

✅ **Authentication System**
- JWT-based authentication
- bcrypt password hashing
- Protected route middleware
- Password strength validation

✅ **User Management**
- User registration
- User login
- Profile management
- Account deletion
- **Receipt Upload**: Store transaction receipts securely
- **Multi-Currency Support**: Handle multiple currencies with exchange rates
- **Anomaly Detection**: Identify unusual spending patterns
- **AI Financial Advisor**: Get smart insights powered by OpenAI
- **Email Notifications**: Automated alerts for budget overruns

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **AI**: OpenAI GPT
- **Security**: Helmet, CORS, Rate Limiting

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd Fischer\ Jordan
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Database Setup

```bash
# Create PostgreSQL database
creatdb finance_tracker

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📊 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update profile (protected)
- `PUT /api/users/change-password` - Change password (protected)
- `DELETE /api/users/account` - Delete account (protected)

### Health Check
- `GET /health` - Server health status

*More endpoints will be added in subsequent development phases*

## 📦 Database Schema

### Users
- **id**: UUID (Primary Key)
- **name**: VARCHAR(100)
- **email**: VARCHAR(255) UNIQUE
- **password_hash**: VARCHAR(255)
- **google_id**: VARCHAR(255) NULLABLE
- **preferred_currency**: VARCHAR(3) DEFAULT 'USD'
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### Categories
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key)
- **name**: VARCHAR(100)
- **type**: ENUM('income', 'expense')
- **is_deleted**: BOOLEAN DEFAULT FALSE
- **created_at**: TIMESTAMP

### Transactions
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key)
- **category_id**: UUID (Foreign Key)
- **amount**: NUMERIC(14,2)
- **currency**: VARCHAR(3)
- **type**: ENUM('income', 'expense')
- **description**: TEXT
- **transaction_date**: DATE
- **receipt_url**: TEXT NULLABLE
- **created_at**: TIMESTAMP

*Additional tables: budgets, notifications, exchange_rates*

## 🚈 Development Workflow

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run start        # Start production server
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run db:setup     # Run migrations + seed
npm run lint         # Lint and fix code
npm run format       # Format code with Prettier
```

## 📝 Environment Variables

See [.env.example](.env.example) for all required environment variables.

Key variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `SENDGRID_API_KEY`, `FROM_EMAIL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## 🛡 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-Origin Resource Sharing
- **Rate Limiting**: Prevent abuse
- **JWT**: Stateless authentication
- **bcrypt**: Password hashing
- **Input Validation**: express-validator
- **SQL Injection Protection**: Parameterized queries

## 💯 Project Structure

```
src/
  ├── config/          # Database and app configuration
  ├── controllers/     # Request handlers
  ├── services/        # Business logic
  ├── repositories/    # Data access layer
  ├── routes/          # API routes
  ├── middlewares/     # Custom middleware
  ├── validations/     # Input validation schemas
  ├── utils/           # Utility functions
  ├── jobs/            # Background jobs
  └── db/              # Database migrations and seeds
```

## 💡 What's Next? (Day 2-4)

- **Day 2**: Categories, Transactions, Budgets
- **Day 3**: Dashboard, Reporting, File Upload
- **Day 4**: OAuth, AI Features, Deployment

## 🐛 Testing

```bash
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 🚀 Deployment

This API is deployment-ready for:
- **Render**
- **AWS EC2/ECS**
- **DigitalOcean**
- **Heroku**

## 📜 API Documentation

- Development: `http://localhost:3000`
- Health Check: `http://localhost:3000/health`
- API Root: `http://localhost:3000/api`

## 🥰 Author

**Palash Singhal**  
Built with ❤️ and lots of ☕

---

*This project demonstrates clean architecture, financial precision, and production-ready backend development practices.*