# 🚀 Deployment Checklist

## Pre-deployment Setup ✅

Your project is now ready for deployment! Here's what we've prepared:

### Project Structure
```
multiplayer-hangman/
├── backend/                 # Backend for Render
│   ├── server.js
│   ├── gameManager.js
│   ├── package.json
│   ├── .env.example
│   └── build.sh
├── frontend/                # Frontend for Vercel  
│   ├── index.html
│   ├── config.js           # Easy backend URL config
│   ├── css/style.css
│   ├── js/app.js
│   └── package.json
├── DEPLOYMENT.md           # Detailed deployment guide
└── vercel.json            # Vercel configuration
```

## 🔧 Quick Deployment Steps

### 1. Deploy Backend (Render)
1. Push your code to GitHub
2. Go to [Render.com](https://render.com) → "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = `https://your-vercel-app.vercel.app`
6. Deploy and copy the URL (e.g., `https://your-app.onrender.com`)

### 2. Update Frontend Configuration
1. Open `frontend/config.js`
2. Replace `https://your-render-backend-url.onrender.com` with your actual Render URL
3. Commit and push changes

### 3. Deploy Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com) → "New Project"
2. Import your GitHub repository
3. Settings:
   - **Framework**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
4. Deploy and copy the URL

### 4. Update Backend CORS
1. Go back to Render
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend

## 🧪 Testing

After deployment:
1. Open your Vercel URL
2. Create a game
3. Open another tab/browser and join the game
4. Test real-time functionality

## 🛠️ Configuration Files Created

- ✅ **CORS enabled** for cross-origin requests
- ✅ **Environment variables** for different environments
- ✅ **Health check endpoint** (`/health`)
- ✅ **Automatic URL detection** for local vs production
- ✅ **Proper Socket.io CORS** configuration
- ✅ **Deployment scripts** and configurations

## 📋 URLs to Update

**After backend deployment, update:**
- `frontend/config.js` → `BACKEND_URL`

**After frontend deployment, update:**
- Render environment variable → `FRONTEND_URL`

## 🚨 Important Notes

1. **Free Tier Limitations**: Render free tier may have cold starts
2. **WebSocket Support**: Both platforms support WebSockets
3. **Environment Variables**: Don't commit actual URLs to Git
4. **HTTPS Required**: Both deployments will use HTTPS

## 🔍 Troubleshooting

If you encounter issues:
1. Check browser console for errors
2. Verify URLs in configuration files
3. Check Render logs for backend errors
4. Ensure CORS is properly configured

Your multiplayer hangman game is now deployment-ready! 🎮
