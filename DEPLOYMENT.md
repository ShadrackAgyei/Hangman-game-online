# Deployment Guide

This guide will help you deploy the Multiplayer Hangman game with the frontend on Vercel and the backend on Render.

## Backend Deployment (Render)

### 1. Prepare Backend
```bash
cd backend
npm install
```

### 2. Deploy to Render
1. Go to [Render.com](https://render.com) and create an account
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `multiplayer-hangman-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3000` (Render will auto-assign)

### 3. Environment Variables
Add these environment variables in Render:
- `NODE_ENV` = `production`
- `FRONTEND_URL` = `https://your-vercel-app.vercel.app` (you'll get this after frontend deployment)

### 4. Copy Backend URL
After deployment, copy your Render backend URL (e.g., `https://your-app.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Update Backend URL
1. Open `frontend/js/app.js`
2. Replace `https://your-render-backend-url.onrender.com` with your actual Render backend URL

### 2. Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com) and create an account
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: `Other`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.` (current directory)
   - **Install Command**: `npm install`

### 3. Update CORS Settings
After frontend deployment:
1. Go back to Render dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend service

## Alternative: Single Repository Deployment

If you want to deploy from a single repository:

### Option 1: Separate Repositories
1. Create two separate GitHub repositories:
   - `multiplayer-hangman-frontend` (contains `frontend/` contents)
   - `multiplayer-hangman-backend` (contains `backend/` contents)

### Option 2: Monorepo with Build Scripts
Keep everything in one repo but use the root directory settings in deployment platforms.

## Local Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables Reference

### Backend (.env)
```
PORT=3000
FRONTEND_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### Frontend (automatic detection)
The frontend automatically detects whether it's running locally or in production.

## Troubleshooting

### CORS Issues
- Ensure `FRONTEND_URL` in backend matches your Vercel domain
- Check that CORS is properly configured in `backend/server.js`

### Connection Issues
- Verify the backend URL in `frontend/js/app.js` matches your Render URL
- Check that both services are running and accessible

### Socket.io Issues
- Ensure WebSocket support is enabled (both Render and Vercel support this)
- Check browser console for connection errors

## Testing Deployment

1. Open your Vercel frontend URL
2. Create a game and note the room code
3. Open another browser/tab and join the game
4. Test real-time functionality

## Monitoring

- **Render**: Check logs in the Render dashboard
- **Vercel**: Check function logs in the Vercel dashboard
- **Frontend**: Use browser developer tools for debugging
