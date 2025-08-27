# Deployment Rehberi 🚀

> **E-Commerce Dashboard Production Deployment Dokümantasyonu**

## 🎯 Deployment Stratejisi

Bu dokümantasyon, Elle Shoes E-Commerce Dashboard'un production ortamına deploy edilmesi için gerekli tüm adımları içerir.

---

## 📋 Ön Gereksinimler

### 1. Sistem Gereksinimleri

#### **Minimum Sunucu Özellikleri**
- **RAM:** 4GB (8GB önerilen)
- **CPU:** 2 vCPU (4 vCPU önerilen)
- **Disk:** 50GB SSD
- **Network:** 1Gbps bağlantı

#### **İşletim Sistemi**
- Ubuntu 20.04 LTS veya üzeri
- CentOS 8 veya üzeri
- Amazon Linux 2

### 2. Yazılım Gereksinimleri

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 13+
sudo apt update
sudo apt install postgresql postgresql-contrib

# Redis 6+
sudo apt install redis-server

# Nginx (Reverse Proxy)
sudo apt install nginx

# PM2 (Process Manager)
npm install -g pm2

# Docker (Opsiyonel)
sudo apt install docker.io docker-compose
```

### 3. Domain ve SSL

```bash
# SSL sertifikası (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 Environment Setup

### 1. PostgreSQL Yapılandırması

```bash
# PostgreSQL kullanıcı oluşturma
sudo -u postgres psql
CREATE USER ecommerce_user WITH PASSWORD 'strong_password';
CREATE DATABASE ecommerce_dashboard;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_dashboard TO ecommerce_user;
\q

# Connection test
psql -h localhost -U ecommerce_user -d ecommerce_dashboard
```

### 2. Redis Yapılandırması

```bash
# Redis config düzenleme
sudo nano /etc/redis/redis.conf

# Güvenlik ayarları
requirepass your_redis_password
bind 127.0.0.1

# Service başlatma
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 3. Environment Variables

```bash
# Production .env dosyası
sudo nano /var/www/ecommerce-dashboard/backend/.env
```

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://ecommerce_user:strong_password@localhost:5432/ecommerce_dashboard"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=your_redis_password

# Google Analytics
GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_service_account_json
GOOGLE_ANALYTICS_PROPERTY_ID=349428903

# JWT
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/uploads

# Logging
LOG_LEVEL=info
LOG_DIR=/var/log/ecommerce-dashboard
```

---

## 🏗️ Build ve Deployment

### 1. Manual Deployment

```bash
# 1. Projeyi sunucuya yükle
git clone https://github.com/your-repo/ecommerce-dashboard.git
cd ecommerce-dashboard

# 2. Backend build
cd backend
npm install --production
npm run build

# 3. Frontend build
cd ../frontend
npm install --production
npm run build

# 4. Static files için nginx dizini oluştur
sudo mkdir -p /var/www/ecommerce-dashboard
sudo cp -r dist/* /var/www/ecommerce-dashboard/

# 5. Backend için PM2 yapılandırması
cd ../backend
pm2 start ecosystem.config.js --env production
```

### 2. PM2 Configuration

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'ecommerce-dashboard',
    script: 'dist/simple-app.js',
    instances: 2, // CPU core sayısına göre ayarlayın
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/ecommerce-dashboard/error.log',
    out_file: '/var/log/ecommerce-dashboard/out.log',
    log_file: '/var/log/ecommerce-dashboard/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/ecommerce-dashboard.git',
      path: '/var/www/ecommerce-dashboard',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
```

### 3. Nginx Configuration

**/etc/nginx/sites-available/ecommerce-dashboard:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=reports:10m rate=10r/m;

# Upstream backend
upstream backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s backup;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Frontend Static Files
    location / {
        root /var/www/ecommerce-dashboard;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Routes
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Report Downloads (Rate Limited)
    location /uploads/reports/ {
        limit_req zone=reports burst=5 nodelay;
        
        alias /var/www/uploads/reports/;
        
        # Security: Only allow specific file types
        location ~* \.(xlsx|csv)$ {
            add_header Content-Disposition "attachment";
            add_header X-Content-Type-Options "nosniff";
        }
        
        # Deny everything else
        location ~ {
            deny all;
        }
    }

    # Health Check
    location /health {
        proxy_pass http://backend;
        access_log off;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /var/www/ecommerce-dashboard;
    }
}
```

```bash
# Nginx yapılandırmasını aktifleştir
sudo ln -s /etc/nginx/sites-available/ecommerce-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🐳 Docker Deployment

### 1. Multi-Stage Dockerfile

**backend/Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3000

CMD ["node", "dist/simple-app.js"]
```

**frontend/Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ecommerce_dashboard
      POSTGRES_USER: ecommerce_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://ecommerce_user:${DB_PASSWORD}@postgres:5432/ecommerce_dashboard
      - REDIS_URL=redis://redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - backend
      - frontend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    networks:
      - frontend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./uploads:/var/www/uploads:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - frontend

volumes:
  postgres_data:
  redis_data:

networks:
  frontend:
  backend:
```

### 3. Docker Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting deployment..."

# Environment check
if [ ! -f ".env.prod" ]; then
    echo "❌ .env.prod file not found!"
    exit 1
fi

# Load environment variables
set -a
source .env.prod
set +a

# Pull latest images
echo "📦 Pulling latest code..."
git pull origin main

# Build and deploy with Docker Compose
echo "🏗️ Building containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🔄 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment completed successfully!"

# Health check
echo "🔍 Running health check..."
sleep 10
curl -f http://localhost/health || echo "❌ Health check failed"

echo "🎉 Deployment finished!"
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install backend dependencies
      run: |
        cd backend
        npm ci

    - name: Run backend tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci

    - name: Run frontend tests
      run: |
        cd frontend
        npm test

    - name: Build frontend
      run: |
        cd frontend
        npm run build

    - name: Build backend
      run: |
        cd backend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Build and push backend image
      uses: docker/build-push-action@v3
      with:
        context: ./backend
        push: true
        tags: ghcr.io/${{ github.repository }}/backend:latest

    - name: Build and push frontend image
      uses: docker/build-push-action@v3
      with:
        context: ./frontend
        push: true
        tags: ghcr.io/${{ github.repository }}/frontend:latest

    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.PRIVATE_KEY }}
        script: |
          cd /var/www/ecommerce-dashboard
          git pull origin main
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d --remove-orphans
          docker image prune -f

    - name: Run health check
      run: |
        sleep 30
        curl -f ${{ secrets.PRODUCTION_URL }}/health
```

### 2. Automatic Database Migrations

**scripts/migrate.sh:**
```bash
#!/bin/bash

echo "🗄️ Running database migrations..."

# Wait for database to be ready
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "Waiting for database to be ready..."
  sleep 2
done

# Run Prisma migrations
npx prisma migrate deploy

# Seed database if needed
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
fi

echo "✅ Database setup completed!"
```

---

## 📊 Monitoring ve Logging

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# PM2 monitoring dashboard
pm2 install pm2-server-monit
```

### 2. Log Management

**logrotate configuration (/etc/logrotate.d/ecommerce-dashboard):**
```
/var/log/ecommerce-dashboard/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Health Monitoring Script

**scripts/health-check.sh:**
```bash
#!/bin/bash

HEALTH_URL="https://yourdomain.com/health"
SLACK_WEBHOOK_URL="your-slack-webhook-url"

check_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
    
    if [ "$response" != "200" ]; then
        echo "❌ Health check failed - HTTP $response"
        
        # Send Slack notification
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🚨 E-Commerce Dashboard health check failed!"}' \
            "$SLACK_WEBHOOK_URL"
        
        return 1
    else
        echo "✅ Health check passed"
        return 0
    fi
}

# Run health check
check_health

# Setup cron job for continuous monitoring
# */5 * * * * /path/to/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## 🔒 Security Best Practices

### 1. Firewall Configuration

```bash
# UFW Firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Specific rules for database (only local)
sudo ufw deny 5432
sudo ufw deny 6379
```

### 2. SSL/TLS Configuration

```bash
# Strong SSL configuration test
ssl-config.mozilla.org

# Check SSL rating
ssllabs.com/ssltest/
```

### 3. Database Security

```sql
-- Create read-only user for monitoring
CREATE USER monitoring_user WITH PASSWORD 'monitoring_password';
GRANT CONNECT ON DATABASE ecommerce_dashboard TO monitoring_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;

-- Backup user
CREATE USER backup_user WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE ecommerce_dashboard TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

---

## 🔄 Backup Strategy

### 1. Database Backup

**scripts/backup-db.sh:**
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/ecommerce-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ecommerce_dashboard"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# PostgreSQL backup
pg_dump -U ecommerce_user -h localhost $DB_NAME | \
    gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "✅ Database backup completed: db_backup_$DATE.sql.gz"
```

### 2. File System Backup

```bash
# Rsync backup for uploads and reports
rsync -av --delete /var/www/uploads/ backup-server:/backups/uploads/

# Cron job for daily backups
# 0 2 * * * /path/to/backup-db.sh
# 30 2 * * * /path/to/backup-files.sh
```

---

## 🚨 Troubleshooting

### 1. Common Issues

#### **Port Already in Use**
```bash
# Find process using port
lsof -ti:3000
# Kill process
kill -9 $(lsof -ti:3000)
```

#### **PM2 Process Issues**
```bash
# Restart all processes
pm2 restart all

# Check logs
pm2 logs

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U ecommerce_user -d ecommerce_dashboard -c "SELECT 1;"
```

#### **Redis Connection Issues**
```bash
# Check Redis status
sudo systemctl status redis

# Test Redis connection
redis-cli ping
```

### 2. Performance Tuning

```bash
# Increase file limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Nginx worker optimization
worker_processes auto;
worker_connections 1024;
```

---

## 📈 Scaling Strategies

### 1. Horizontal Scaling

```yaml
# Docker Swarm example
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

### 2. Load Balancer Configuration

```nginx
upstream backend_cluster {
    least_conn;
    server backend1.example.com:3000 weight=3;
    server backend2.example.com:3000 weight=2;
    server backend3.example.com:3000 weight=1 backup;
}
```

---

**🚀 Bu deployment rehberi, Elle Shoes E-Commerce Dashboard'un production ortamına güvenli ve scalable bir şekilde deploy edilmesi için gerekli tüm bilgileri içerir. Deployment işlemi sırasında karşılaştığınız sorunlar için development ekibi ile iletişime geçin.**