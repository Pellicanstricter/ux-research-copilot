# Railway Deployment Guide

## Prerequisites
1. GitHub account
2. Railway account (sign up at railway.app)
3. Push your code to GitHub

## Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit - ready for Railway deployment"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and log in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `ux-research-copilot` repository
4. Railway will auto-detect the Dockerfile

### Configure Backend Service

**Environment Variables:**
```
OPENAI_API_KEY=your_openai_api_key_here
REDIS_HOST=redis
REDIS_PORT=6379
PORT=8000
```

**Settings:**
- Root Directory: `/` (leave default)
- Dockerfile Path: `Dockerfile`

## Step 3: Add Redis to Backend

1. In your backend service, click "New" → "Database" → "Add Redis"
2. Railway will automatically:
   - Create a Redis instance
   - Link it to your backend
   - Set REDIS_HOST and REDIS_PORT environment variables

## Step 4: Deploy Frontend to Railway

1. In the same project, click "New" → "GitHub Repo" (select same repo)
2. Configure the frontend service

**Environment Variables:**
```
VITE_API_URL=https://your-backend-url.railway.app
```

**Settings:**
- Root Directory: `frontend`
- Dockerfile Path: `frontend/Dockerfile`

## Step 5: Get Your URLs

After deployment:
1. Backend URL: `https://your-backend-xxxxx.railway.app`
2. Frontend URL: `https://your-frontend-xxxxx.railway.app`

Update frontend's `VITE_API_URL` with your actual backend URL

## Step 6: Update CORS in Backend

Edit `main.py` line 29 to allow your frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-xxxxx.railway.app"],  # Update this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Push changes:
```bash
git add main.py
git commit -m "Update CORS for production"
git push
```

Railway will auto-redeploy!

## Costs

**Free Tier:**
- $5 free credit per month
- Perfect for testing

**Typical Monthly Cost (after free tier):**
- Backend: ~$5-10 (depends on usage)
- Frontend: ~$0-3 (static files, cheap)
- Redis: ~$2-5
- **Total: ~$7-15/month**

## Troubleshooting

**Build fails:**
- Check Railway logs
- Verify all files committed to git
- Check Dockerfile syntax

**Can't connect to backend:**
- Verify VITE_API_URL in frontend env vars
- Check CORS settings in main.py
- Verify backend is running (check Railway logs)

**Redis connection fails:**
- Make sure Redis is linked to backend service
- Check REDIS_HOST and REDIS_PORT env vars

## Domain Setup (Optional)

1. In Railway frontend service → Settings → Domains
2. Click "Generate Domain" for free Railway subdomain
3. Or add custom domain (requires DNS setup)

## Monitoring

- View logs: Click service → "Logs" tab
- View metrics: Click service → "Metrics" tab
- Set up alerts in Railway dashboard

---

**You're done!** Your app is now live on the internet 🎉
