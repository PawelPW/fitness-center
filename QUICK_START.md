# Quick Start Guide - Cloud Deployment

## 🚀 Deploy in 15 Minutes

### Prerequisites
- [ ] Node.js installed
- [ ] Android Studio installed (for Android)
- [ ] USB cable to connect phone

### Step 1: Deploy Backend (5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Go to server directory
cd server

# Create project
railway init

# Add PostgreSQL
railway add --database postgres

# Deploy
railway up

# Set environment variables
railway variables set JWT_SECRET="N3D8nQfDtz53/8wSpF57jswRHPE8FuAVUXCPs4vtVCs="
railway variables set ALLOWED_ORIGINS="capacitor://localhost,http://localhost"
railway variables set RATE_LIMIT_WINDOW_MS="900000"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"

# Initialize database
npm run db:setup

# Get your API URL
railway status
# Copy the URL shown (e.g., https://fitness-center-production.up.railway.app)
```

### Step 2: Configure Mobile App (2 minutes)

```bash
# Go back to project root
cd ..

# Edit .env.production file
nano .env.production
```

Update with your Railway URL:
```
VITE_API_URL=https://your-railway-url.up.railway.app/api
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Build Mobile App (5 minutes)

```bash
# Build for mobile with production settings
npm run build:mobile

# Open Android Studio
npm run android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. Wait for build to complete

### Step 4: Install on Phone (3 minutes)

#### Option A: Via USB (Recommended)

1. Enable USB debugging on your Android phone:
   - Settings > About phone
   - Tap "Build number" 7 times
   - Go back > Developer options
   - Enable "USB debugging"

2. Connect phone via USB

3. In Android Studio:
   - Click Run button (green play icon)
   - Select your device
   - App will install and launch

#### Option B: Via APK File

1. Locate the APK:
   ```bash
   open android/app/build/outputs/apk/debug/
   ```

2. Transfer `app-debug.apk` to your phone (email, USB, cloud)

3. On your phone:
   - Open the APK file
   - Allow installation from unknown sources if prompted
   - Install

### Step 5: Test (1 minute)

1. Open the Fitness Center app on your phone
2. Register a new user
3. Login
4. Create a training session
5. ✅ Done!

---

## 📱 Update Your App Later

When you make code changes:

```bash
# 1. Rebuild
npm run build:mobile

# 2. Rebuild APK
npm run android
# Then: Build > Build APK in Android Studio

# 3. Reinstall on phone
# Click Run in Android Studio
```

---

## 🐛 Troubleshooting

### App shows "Network Error"

1. Check API is running:
   ```bash
   curl https://your-railway-url.up.railway.app/api/health
   ```

2. Verify `.env.production` has correct URL

3. Rebuild app:
   ```bash
   npm run build:mobile
   ```

### Database errors

```bash
cd server
npm run db:setup
```

### Railway deployment failed

```bash
railway logs
```

Check the logs for specific errors.

---

## 💰 Cost

- Railway: $10/month (includes database + API)
- No App Store fees (manual installation)
- **Total: $10/month**

---

## 📚 Full Documentation

See `DEPLOYMENT.md` for detailed instructions and alternative deployment options.
