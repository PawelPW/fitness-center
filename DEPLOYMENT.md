# Fitness Center - Cloud Deployment Guide

This guide will help you deploy your fitness center application to the cloud for manual mobile app installation.

## 📋 Overview

Since you'll be manually installing the app on your phone, you only need to deploy:
1. **PostgreSQL Database** (cloud-hosted)
2. **Node.js API** (cloud-hosted)

The mobile app will be built with the production API URL and installed directly on your device.

---

## 🚀 Quick Start (Recommended: Railway)

Railway is the easiest and most cost-effective option for getting started (~$10/month).

### Step 1: Deploy to Railway

1. **Create Railway Account**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login
   ```

2. **Create New Project**
   ```bash
   cd /home/pawel/projects/fitness-center/server
   railway init
   ```

3. **Add PostgreSQL Database**
   ```bash
   railway add --database postgres
   ```

4. **Deploy Backend**
   ```bash
   railway up
   ```

5. **Get Your Database URL**
   ```bash
   railway variables
   ```
   Copy the `DATABASE_URL` value - it will look like:
   `postgresql://user:password@host.railway.app:5432/railway`

6. **Set Environment Variables**
   ```bash
   # Set JWT secret (use the one from .env.production)
   railway variables set JWT_SECRET="N3D8nQfDtz53/8wSpF57jswRHPE8FuAVUXCPs4vtVCs="

   # Set CORS origins (for mobile app)
   railway variables set ALLOWED_ORIGINS="capacitor://localhost,http://localhost,https://localhost"

   # Set rate limiting
   railway variables set RATE_LIMIT_WINDOW_MS="900000"
   railway variables set RATE_LIMIT_MAX_REQUESTS="100"
   ```

7. **Initialize Database**
   ```bash
   # Set the DATABASE_URL in your local .env.production file
   # Then run:
   cd /home/pawel/projects/fitness-center/server
   npm run db:setup
   ```

8. **Get Your API URL**
   ```bash
   railway status
   ```
   Your API will be at: `https://your-app-name.up.railway.app`

### Step 2: Configure Mobile App

1. **Update Production Environment**
   ```bash
   cd /home/pawel/projects/fitness-center

   # Edit .env.production
   nano .env.production
   ```

   Update `VITE_API_URL` with your Railway URL:
   ```
   VITE_API_URL=https://your-app-name.up.railway.app/api
   ```

2. **Build Mobile App**
   ```bash
   # Build the web app with production environment
   npm run build:mobile
   ```

### Step 3: Install on Your Phone

#### For Android:

1. **Open Android Studio**
   ```bash
   npm run android
   ```

2. **Build APK**
   - In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Or run: `cd android && ./gradlew assembleDebug`

3. **Install on Phone**
   - Connect your phone via USB with USB debugging enabled
   - In Android Studio: Run > Run 'app'
   - Or use: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

#### For iOS (macOS only):

1. **Open Xcode**
   ```bash
   npm run ios
   ```

2. **Build and Run**
   - Select your device from the target dropdown
   - Click the Run button (Play icon)
   - Sign with your Apple Developer account if required

---

## 💰 Alternative Cloud Providers

### Option 1: Render.com (~$7-15/month)

**Pros**: Easy setup, automatic HTTPS, free tier available
**Cons**: Free tier has cold starts (slow first request)

1. **Create Account**: https://render.com
2. **New Web Service**:
   - Connect your GitHub repo
   - Build command: `npm install`
   - Start command: `npm start`
3. **Add PostgreSQL**:
   - Dashboard > New > PostgreSQL
   - Copy the `Internal Database URL`
4. **Set Environment Variables**:
   - In Web Service settings > Environment
   - Add all variables from `.env.production`

### Option 2: DigitalOcean App Platform (~$12/month)

**Pros**: Simple pricing, good performance, managed services
**Cons**: Slightly more expensive

1. **Create Account**: https://digitalocean.com
2. **Create New App**:
   - Choose your GitHub repo
   - Select `server` directory
   - Type: Web Service
3. **Add Database**:
   - Add Component > Database > PostgreSQL
4. **Configure**:
   - Build command: `npm install`
   - Run command: `npm start`
   - Environment variables from `.env.production`

### Option 3: Heroku (~$7-16/month)

**Pros**: Industry standard, extensive documentation
**Cons**: Requires credit card even for free tier

1. **Install Heroku CLI**:
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   heroku login
   ```

2. **Create App**:
   ```bash
   cd /home/pawel/projects/fitness-center/server
   heroku create your-app-name
   ```

3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set JWT_SECRET="N3D8nQfDtz53/8wSpF57jswRHPE8FuAVUXCPs4vtVCs="
   heroku config:set ALLOWED_ORIGINS="capacitor://localhost,http://localhost"
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

---

## 🔒 Security Checklist

Before deploying to production, ensure:

- [x] JWT secret has been changed from default
- [x] Database uses SSL connections
- [x] CORS is configured for your domain
- [x] Rate limiting is enabled
- [x] Environment variables are set on cloud platform (not in code)
- [ ] HTTPS is enabled (automatic on most platforms)
- [ ] Database backups are configured
- [ ] Monitoring is set up (optional but recommended)

---

## 🗄️ Database Management

### Initialize Database (First Time)

After deploying your database, run:

```bash
cd /home/pawel/projects/fitness-center/server

# Make sure DATABASE_URL is set in .env.production
npm run db:setup
```

This will:
- Create all tables
- Add indexes
- Insert 73 default exercises
- Verify setup

### Manual Database Setup

If you prefer manual setup or the script fails:

1. **Connect to your database**:
   ```bash
   psql "your-database-url-here"
   ```

2. **Run SQL file**:
   ```sql
   \i server/src/config/init_production_db.sql
   ```

### Database Backups (Recommended)

Most cloud providers offer automatic backups:

- **Railway**: Automatic daily backups (paid plans)
- **Render**: Point-in-time recovery (paid plans)
- **DigitalOcean**: Daily backups included
- **Heroku**: Continuous protection (paid add-on)

---

## 📱 Building Mobile Apps

### Development Build (for testing)

```bash
# Build web assets
npm run build:mobile

# Android
npm run android
# Then: Build > Build APK in Android Studio

# iOS (macOS only)
npm run ios
# Then: Product > Build in Xcode
```

### Production Build (for distribution)

#### Android APK (Release)

1. **Generate Signing Key** (first time only):
   ```bash
   cd android/app
   keytool -genkey -v -keystore fitness-center.keystore -alias fitness-center -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing**:
   Create `android/gradle.properties`:
   ```properties
   MYAPP_UPLOAD_STORE_FILE=fitness-center.keystore
   MYAPP_UPLOAD_KEY_ALIAS=fitness-center
   MYAPP_UPLOAD_STORE_PASSWORD=your-password
   MYAPP_UPLOAD_KEY_PASSWORD=your-password
   ```

3. **Build Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

   APK location: `android/app/build/outputs/apk/release/app-release.apk`

4. **Install on Phone**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

#### iOS (Ad-Hoc Distribution)

Requires Apple Developer account ($99/year)

1. **Configure Signing** in Xcode:
   - Select project > Signing & Capabilities
   - Choose your team
   - Select "Ad Hoc" provisioning

2. **Build Archive**:
   - Product > Archive
   - Distribute App > Ad Hoc
   - Export IPA file

3. **Install on Phone**:
   - Use Xcode Devices window
   - Or use TestFlight (requires App Store Connect)

---

## 🧪 Testing Your Deployment

### 1. Test API Health

```bash
curl https://your-api-url.com/api/health
```

Expected response:
```json
{"status":"ok","message":"Fitness Center API is running"}
```

### 2. Test User Registration

```bash
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'
```

### 3. Test Login

```bash
curl -X POST https://your-api-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!"}'
```

### 4. Test from Mobile App

1. Build and install the app
2. Open the app
3. Register a new user
4. Login
5. Create a training session
6. Verify data is saved by logging in on another device

---

## 🐛 Troubleshooting

### App can't connect to API

**Problem**: Mobile app shows network errors

**Solutions**:
1. Check VITE_API_URL in `.env.production` is correct
2. Rebuild the app: `npm run build:mobile`
3. Check CORS settings allow `capacitor://localhost`
4. Verify API is running: `curl https://your-api-url.com/api/health`

### Database connection failed

**Problem**: API logs show database connection errors

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check database allows SSL connections
3. Ensure database is running and accessible
4. Check firewall/security group settings

### CORS errors in browser

**Problem**: API requests blocked by CORS policy

**Solutions**:
1. Add your domain to ALLOWED_ORIGINS environment variable
2. Restart the API server
3. Clear browser cache

### Rate limiting errors

**Problem**: "Too many requests" errors

**Solutions**:
1. Increase RATE_LIMIT_MAX_REQUESTS in environment variables
2. Implement user-specific rate limiting (future enhancement)
3. Use exponential backoff in API calls

---

## 📊 Monitoring (Optional)

### Free Monitoring Tools

1. **UptimeRobot** (Free tier: 50 monitors)
   - Monitor API health endpoint
   - Email alerts on downtime
   - https://uptimerobot.com

2. **Sentry** (Free tier: 5K errors/month)
   ```bash
   npm install @sentry/node
   ```
   Add to `server/src/server.js`:
   ```javascript
   import * as Sentry from "@sentry/node";
   Sentry.init({ dsn: "your-dsn" });
   ```

3. **LogTail** (Free tier: 1GB/month)
   - Centralized logging
   - Real-time log viewer
   - https://betterstack.com/logs

---

## 💡 Cost Breakdown

### Minimum Cost Setup (Railway)
- PostgreSQL: $5/month
- Web Service: $5/month
- **Total: ~$10/month**

### Recommended Setup (Railway + Monitoring)
- PostgreSQL: $5/month
- Web Service: $5/month
- Better Stack Monitoring: $10/month
- **Total: ~$20/month**

### No App Store Fees (Manual Installation)
- ✅ No Apple Developer account needed ($99/year saved)
- ✅ No Google Play Store fee ($25 one-time saved)
- ✅ No app review process delays

---

## 🔄 Updating Your App

### Backend Updates

1. **Push changes to git**
2. **Deploy to cloud**:
   - Railway: Automatic deployment on git push
   - Render: Automatic deployment on git push
   - Heroku: `git push heroku main`

### Mobile App Updates

1. **Make changes to code**
2. **Build new version**:
   ```bash
   npm run build:mobile
   npm run android  # or npm run ios
   ```
3. **Build new APK/IPA**
4. **Manually install on phone**

---

## 📚 Next Steps

### When Ready for App Store Distribution

When you're ready to distribute via App Store/Play Store:

1. **Apple App Store**:
   - Purchase Apple Developer account ($99/year)
   - Create App Store Connect listing
   - Submit for review (7-14 days)
   - Guide: https://developer.apple.com/app-store/submissions/

2. **Google Play Store**:
   - Pay one-time fee ($25)
   - Create Google Play Console listing
   - Submit for review (2-7 days)
   - Guide: https://play.google.com/console/about/guides/

### Scaling Considerations

When you reach 1,000+ active users:

1. **Upgrade database** to higher tier
2. **Add caching** (Redis) for frequently accessed data
3. **Implement CDN** for static assets
4. **Add monitoring** and alerting
5. **Consider AWS/GCP** for better scalability

---

## 🆘 Support

If you encounter issues:

1. Check the API logs in your cloud dashboard
2. Test the API health endpoint
3. Verify environment variables are set correctly
4. Check database connectivity
5. Review CORS and security settings

---

## ✅ Deployment Checklist

Use this checklist when deploying:

- [ ] Cloud database created and running
- [ ] Database schema initialized (ran `npm run db:setup`)
- [ ] Backend API deployed to cloud
- [ ] Environment variables set on cloud platform
- [ ] API health check returns OK
- [ ] JWT secret changed from default
- [ ] CORS configured for mobile app
- [ ] `.env.production` updated with production API URL
- [ ] Mobile app built with production settings
- [ ] Mobile app tested on device
- [ ] User registration and login working
- [ ] Data persistence verified
- [ ] Monitoring set up (optional)
- [ ] Database backups configured (optional)

---

## 📝 Environment Variables Reference

### Backend (.env.production on cloud platform)

```bash
NODE_ENV=production
PORT=5000  # Usually auto-set by platform

# Database (usually auto-set by platform)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# JWT (REQUIRED - change this!)
JWT_SECRET=N3D8nQfDtz53/8wSpF57jswRHPE8FuAVUXCPs4vtVCs=
JWT_EXPIRES_IN=7d

# CORS (for mobile app)
ALLOWED_ORIGINS=capacitor://localhost,http://localhost,https://localhost

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.production local)

```bash
# Replace with your actual API URL
VITE_API_URL=https://your-app-name.up.railway.app/api
```

---

**Deployment prepared successfully! 🎉**

Start with Railway for the quickest and most cost-effective deployment.
