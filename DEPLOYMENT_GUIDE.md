# Complete Railway Deployment Guide - Fitness Center App

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ Railway account (sign up at https://railway.app)
- ✅ Railway CLI installed (`npm install -g @railway/cli`)
- ✅ Git repository initialized
- ✅ Code committed to git

---

## 🚀 Part 1: Deploy Backend (Server + Database)

### Step 1: Create Railway Project

```bash
# Navigate to your project root
cd /home/pawel/projects/fitness-center

# Login to Railway
railway login

# Initialize new Railway project
railway init
```

When prompted:
- **Project name**: `fitness-center-backend` (or your choice)
- **Start with**: Empty project

### Step 2: Create Backend Service

```bash
# Create a new service for the backend
railway service create backend
```

### Step 3: Link to Backend Service

```bash
# Link your local directory to the backend service
railway link
```

Select the project and service you just created.

### Step 4: Add PostgreSQL Database

```bash
# Add PostgreSQL database to your project
railway add --database postgresql
```

This creates:
- PostgreSQL instance
- Automatic `DATABASE_URL` variable
- Other database connection variables

### Step 5: Set Backend Environment Variables

**IMPORTANT: Generate a NEW JWT secret - DO NOT use the example below!**

```bash
# First, generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Copy the output and use it as JWT_SECRET below

# Set all required environment variables
railway variables set \
  NODE_ENV=production \
  PORT=5000 \
  JWT_SECRET="<PASTE_YOUR_GENERATED_SECRET_HERE>" \
  JWT_EXPIRES_IN=7d \
  ALLOWED_ORIGINS="capacitor://localhost,http://localhost" \
  RATE_LIMIT_WINDOW_MS=900000 \
  RATE_LIMIT_MAX_REQUESTS=100
```

**Note**: `DATABASE_URL` is automatically set by Railway PostgreSQL plugin.

**Security Warning**: Never commit your actual JWT_SECRET to git or share it in documentation. Each environment (dev, staging, production) should have a unique secret.

### Step 6: Create Railway Configuration for Backend

Create `railway.json` in the **root** directory:

```bash
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd server && npm install"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
```

### Step 7: Deploy Backend

```bash
# Commit the railway.json
git add railway.json
git commit -m "Add Railway configuration"

# Deploy backend
railway up
```

Wait for deployment to complete (1-3 minutes).

### Step 8: Get Backend URL

```bash
# Generate a public domain for your backend
railway domain
```

This will give you a URL like: `https://fitness-center-backend.up.railway.app`

**Save this URL** - you'll need it for the frontend!

### Step 9: Setup Database Schema

```bash
# Run database migrations
railway run npm run db:migrate
```

If successful, you'll see:
```
✓ Database connected successfully
✓ All tables created successfully
```

---

## 🎨 Part 2: Deploy Frontend

### Step 10: Create Frontend Service

```bash
# Create a new service for frontend
railway service create frontend
```

### Step 11: Update Frontend Environment Variable

Before deploying frontend, update the API URL:

```bash
# Navigate to root
cd /home/pawel/projects/fitness-center

# Update .env.production with your actual backend URL
echo "VITE_API_URL=https://your-backend-url.up.railway.app/api" > .env.production
```

**Replace** `your-backend-url.up.railway.app` with the URL from Step 8!

### Step 12: Build Frontend

```bash
# Build the frontend with production environment
npm run build
```

This creates the `dist/` folder with your production frontend.

### Step 13: Create Frontend Railway Config

Create `railway.frontend.json`:

```bash
cat > railway.frontend.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve dist -l 3000",
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF
```

### Step 14: Deploy Frontend

```bash
# Link to frontend service
railway link
# (Select your project and the "frontend" service)

# Deploy frontend
railway up --config railway.frontend.json
```

### Step 15: Get Frontend URL

```bash
# Generate public domain for frontend
railway domain
```

You'll get: `https://fitness-center-frontend.up.railway.app`

---

## 🔗 Part 3: Link Frontend & Backend (CORS)

### Step 16: Update CORS Configuration

Now that you have both URLs, update the backend CORS:

```bash
# Link back to backend service
railway link
# (Select backend service)

# Update CORS with your frontend URL
railway variables set ALLOWED_ORIGINS="https://your-frontend-url.up.railway.app,capacitor://localhost,http://localhost"
```

**Replace** `your-frontend-url.up.railway.app` with your actual frontend URL!

### Step 17: Restart Backend

```bash
# Restart backend to apply CORS changes
railway restart
```

---

## ✅ Part 4: Verification & Testing

### Step 18: Test Backend Health

```bash
curl https://your-backend-url.up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","message":"Fitness Center API is running"}
```

### Step 19: Test Frontend

Open your frontend URL in a browser:
```
https://your-frontend-url.up.railway.app
```

You should see the futuristic login screen!

### Step 20: Create Test Account

Try creating an account:
- **Username**: `testuser`
- **Email**: `test@example.com`
- **Password**: `Test@Password123`

If registration succeeds, your app is fully deployed! 🎉

---

## 📱 Part 5: Mobile App Configuration

### Step 21: Update Mobile App API URL

For the Capacitor mobile apps, update the API URL:

```bash
# Update capacitor.config.json
cd /home/pawel/projects/fitness-center
```

Edit `capacitor.config.json` and add:

```json
{
  "appId": "com.fitnesscenter.app",
  "appName": "Fitness Center",
  "webDir": "dist",
  "server": {
    "url": "https://your-backend-url.up.railway.app",
    "cleartext": false
  }
}
```

### Step 22: Rebuild Mobile Apps

```bash
# Build and sync to mobile platforms
npm run build:mobile

# Open in Android Studio
npm run android

# Open in Xcode (macOS only)
npm run ios
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing `DATABASE_URL` → Make sure PostgreSQL is added
- Port already in use → Railway auto-assigns ports
- Build failed → Check `server/package.json` has correct scripts

### Frontend Shows "API Error"

**Check:**
1. Is backend URL correct in `.env.production`?
2. Did you rebuild after changing `.env.production`? (`npm run build`)
3. Is CORS configured with frontend URL?

```bash
# View backend logs
railway logs --service backend

# View frontend logs
railway logs --service frontend
```

### Database Connection Errors

**Verify DATABASE_URL:**
```bash
railway variables | grep DATABASE_URL
```

Should show a real PostgreSQL URL, not the placeholder.

**Re-run migrations:**
```bash
railway run npm run db:migrate
```

### CORS Errors in Browser Console

**Update CORS origins:**
```bash
railway link  # Select backend
railway variables set ALLOWED_ORIGINS="https://your-frontend-url.up.railway.app,capacitor://localhost"
railway restart
```

---

## 📊 Monitoring & Maintenance

### View Application Logs

```bash
# Backend logs
railway logs --service backend --follow

# Frontend logs
railway logs --service frontend --follow
```

### Check Resource Usage

Go to Railway Dashboard → Your Project → Metrics

### Update Environment Variables

```bash
# Link to the service you want to update
railway link

# Set new variable
railway variables set VARIABLE_NAME=new_value

# Restart service to apply
railway restart
```

---

## 💰 Cost Optimization

Railway offers:
- **$5 free credit/month** (Hobby plan)
- **Pay-as-you-go** beyond free tier

**Tips to save costs:**
1. Use **Hobby plan** for development/testing
2. Scale down during inactive hours
3. Monitor usage in Railway dashboard
4. Delete unused services/databases

---

## 🎯 Quick Reference Commands

```bash
# Login to Railway
railway login

# Create new project
railway init

# Add database
railway add --database postgresql

# Set environment variable
railway variables set KEY=VALUE

# View all variables
railway variables

# Deploy current directory
railway up

# Generate public domain
railway domain

# View logs
railway logs --follow

# Restart service
railway restart

# Link to different service
railway link

# Check service status
railway status
```

---

## 📞 Support

**Railway Documentation**: https://docs.railway.app/
**Railway Discord**: https://discord.gg/railway
**Your deployment guide**: This file!

---

## ✨ Summary

After following this guide, you will have:

✅ Backend API deployed and running
✅ PostgreSQL database provisioned and migrated
✅ Frontend web app deployed
✅ CORS properly configured
✅ Mobile apps configured to use production API
✅ All environment variables set securely
✅ Monitoring and logging set up

**Your live URLs:**
- Backend API: `https://your-backend.up.railway.app`
- Frontend App: `https://your-frontend.up.railway.app`

🎉 **Congratulations! Your fitness center app is now live in production!**
