# Personal Finance Tracker - Docker Setup

## 🐳 Docker PostgreSQL Setup for Day 1

### Prerequisites
- Docker Desktop installed
- Docker Desktop running

### Quick Docker Setup

#### 1. Start Docker Desktop
```bash
# On Windows, start Docker Desktop application
# Or run from command line:
"C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

#### 2. Start PostgreSQL Container
```bash
# Start PostgreSQL 15 in Docker
docker run --name finance-db \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=finance_tracker \
  -p 5432:5432 \
  -d postgres:15

# Wait a few seconds for container to start, then check status
docker ps
```

#### 3. Verify Database Creation
```bash
# Connect to the database to verify it's working
docker exec -it finance-db psql -U postgres -d finance_tracker

# Inside psql, run:
\l               # List databases
\q               # Quit
```

#### 4. Run Your Application
```bash
# Your .env is already configured correctly for these credentials
npm run migrate
npm run dev
```

### Docker Management Commands

#### Container Controls
```bash
# Stop the database
docker stop finance-db

# Start the database (after stopping)
docker start finance-db

# Remove the container completely
docker rm finance-db

# View logs
docker logs finance-db
```

#### Database Access
```bash
# Connect to PostgreSQL directly
docker exec -it finance-db psql -U postgres -d finance_tracker

# Run SQL commands from host
docker exec finance-db psql -U postgres -d finance_tracker -c "SELECT version();"
```

### Troubleshooting

#### If "Docker Desktop is not running" error:
1. Start Docker Desktop manually
2. Wait for the Docker icon in system tray to show "Docker is running"
3. Then run the docker commands

#### If port 5432 is already in use:
```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# Use a different port mapping
docker run --name finance-db \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=finance_tracker \
  -p 5433:5432 \
  -d postgres:15

# Update .env to use port 5433
DB_PORT=5433
```

#### If container name already exists:
```bash
# Remove existing container
docker rm -f finance-db

# Then run the docker run command again
```

### Environment Variables (Already Set!)
Your `.env` file is perfectly configured:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=password123
```

### Next Steps
1. Start Docker Desktop
2. Run the PostgreSQL container command above
3. Run `npm run migrate` to create tables
4. Run `npm run dev` to start your server

🎯 **Your Personal Finance Tracker will be running on http://localhost:3000**