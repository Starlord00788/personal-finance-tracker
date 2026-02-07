# ===============================================
# Docker + PostgreSQL Setup for Personal Finance Tracker
# ===============================================

Write-Host "🐳 Docker + PostgreSQL Setup for Personal Finance Tracker" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if WSL is installed and running
Write-Host "🔍 Step 1: Checking WSL status..." -ForegroundColor Yellow
try {
    $wslStatus = wsl --status 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ WSL is installed and running" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ WSL not found. Please install WSL first:" -ForegroundColor Red
    Write-Host "   1. Open PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host "   2. Run: wsl --install" -ForegroundColor Yellow
    Write-Host "   3. Restart your computer" -ForegroundColor Yellow
    Write-Host "   4. Run this script again" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check if Docker is installed
Write-Host "🔍 Step 2: Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop:" -ForegroundColor Red
    Write-Host "   Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Step 3: Start Docker Desktop if not running
Write-Host "🔍 Step 3: Checking if Docker Desktop is running..." -ForegroundColor Yellow
try {
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker Desktop not running. Starting..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "🕐 Waiting for Docker Desktop to start (60 seconds)..." -ForegroundColor Yellow
    
    $timeout = 60
    $elapsed = 0
    do {
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "   Checking... ($elapsed/$timeout seconds)" -ForegroundColor Gray
        try {
            docker ps 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Docker Desktop is now running!" -ForegroundColor Green
                break
            }
        } catch { }
    } while ($elapsed -lt $timeout)
    
    if ($elapsed -ge $timeout) {
        Write-Host "❌ Docker Desktop failed to start within 60 seconds" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop manually and run this script again" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Remove existing container if it exists
Write-Host "🔍 Step 4: Checking for existing finance-db container..." -ForegroundColor Yellow
try {
    docker ps -a --filter "name=finance-db" --format "{{.Names}}" 2>$null | ForEach-Object {
        if ($_ -eq "finance-db") {
            Write-Host "⚠️  Removing existing finance-db container..." -ForegroundColor Yellow
            docker rm -f finance-db 2>$null
            Write-Host "✅ Existing container removed" -ForegroundColor Green
        }
    }
} catch { }

# Step 5: Start PostgreSQL container
Write-Host "🚀 Step 5: Starting PostgreSQL container..." -ForegroundColor Yellow
try {
    $containerID = docker run --name finance-db `
        -e POSTGRES_PASSWORD=password123 `
        -e POSTGRES_USER=postgres `
        -e POSTGRES_DB=finance_tracker `
        -p 5432:5432 `
        -d postgres:15
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL container started successfully!" -ForegroundColor Green
        Write-Host "   Container ID: $containerID" -ForegroundColor Gray
    } else {
        throw "Failed to start container"
    }
} catch {
    Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Wait for PostgreSQL to be ready
Write-Host "🕐 Step 6: Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$timeout = 30
$elapsed = 0
do {
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "   Checking... ($elapsed/$timeout seconds)" -ForegroundColor Gray
    try {
        docker exec finance-db pg_isready -U postgres 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
            break
        }
    } catch { }
} while ($elapsed -lt $timeout)

if ($elapsed -ge $timeout) {
    Write-Host "❌ PostgreSQL failed to start within 30 seconds" -ForegroundColor Red
    exit 1
}

# Step 7: Verify database connection
Write-Host "🔍 Step 7: Verifying database connection..." -ForegroundColor Yellow
try {
    $dbVersion = docker exec finance-db psql -U postgres -d finance_tracker -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        throw "Database connection failed"
    }
} catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Docker + PostgreSQL setup complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Container Information:" -ForegroundColor Cyan
Write-Host "   Name: finance-db"
Write-Host "   Image: postgres:15"
Write-Host "   Port: localhost:5432"
Write-Host "   Database: finance_tracker"
Write-Host "   Username: postgres"
Write-Host "   Password: password123"
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run migrations: npm run migrate"
Write-Host "   2. Start your app: npm run dev"
Write-Host "   3. Open: http://localhost:3000"
Write-Host ""
Write-Host "🛠️  Docker Commands:" -ForegroundColor Cyan
Write-Host "   Start:  docker start finance-db"
Write-Host "   Stop:   docker stop finance-db"
Write-Host "   Remove: docker rm -f finance-db"
Write-Host "   Logs:   docker logs finance-db"
Write-Host "   Shell:  docker exec -it finance-db psql -U postgres -d finance_tracker"
Write-Host ""