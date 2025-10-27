# Deployment Guide

This guide covers deploying the Votez application to various platforms.

## Platform Compatibility

### ✅ Fully Compatible
- **Vercel** (Recommended for Frontend)
- **Netlify**
- **AWS Amplify**
- **Railway**
- **Render**
- **Digital Ocean App Platform**

### ⚠️ Requires Configuration
- **AWS S3 + CloudFront** (static export only)
- **Azure Static Web Apps**
- **Google Cloud Run** (with Docker)

## Deploying to Vercel (Recommended)

Vercel provides the best experience for Next.js applications with automatic deployments, edge functions, and global CDN.

### Prerequisites
- Vercel account ([Sign up free](https://vercel.com))
- GitHub/GitLab/Bitbucket repository
- Backend API deployed separately

### Step-by-Step Deployment

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables:**
   In Vercel dashboard → Settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com/ws
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Vercel handles SSL automatically

## Deploying to Netlify

### Steps

1. **Connect repository** to Netlify
2. **Configure build:**
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Add environment variables**
4. **Deploy**

## Deploying to AWS Amplify

### Steps

1. **Connect repository** to AWS Amplify Console
2. **Configure app:**
   - Framework: Next.js
   - Build command: `npm run build && npm run export`
   - Output directory: `out`
3. **Add environment variables**
4. **Save and deploy**

## Deploying with Docker

### Build and Push to Docker Hub

```bash
# Build the image
docker build -t yourusername/votez-app:latest .

# Push to Docker Hub
docker push yourusername/votez-app:latest
```

### Deploy to Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: votez-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: votez-app
  template:
    metadata:
      labels:
        app: votez-app
    spec:
      containers:
      - name: votez-app
        image: yourusername/votez-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://your-api-domain.com"
        - name: NEXT_PUBLIC_WS_URL
          value: "wss://your-api-domain.com/ws"
```

## Backend Deployment

The backend API must be deployed separately. Recommended platforms:

### Render
1. Create new Web Service
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables

### Railway
1. Connect repository
2. Railway auto-detects FastAPI
3. Add environment variables
4. Deploy

### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
flyctl launch

# Deploy
flyctl deploy
```

## Environment Variables Reference

### Frontend (.env.local)

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

# Production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com/ws
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# Optional
DEBUG=false
ENVIRONMENT=production
```

## Post-Deployment Checklist

- [ ] Verify HTTPS is enabled
- [ ] Test WebSocket connections
- [ ] Check CORS configuration
- [ ] Monitor error logs
- [ ] Set up custom domain
- [ ] Configure CDN caching
- [ ] Enable monitoring/analytics
- [ ] Set up backup strategy

## Troubleshooting Deployment

### Build Failures

**Error:** `Module not found`
- Solution: Ensure all dependencies are in `package.json`

**Error:** `Environment variable not set`
- Solution: Add all `NEXT_PUBLIC_*` vars in platform settings

### Runtime Issues

**Error:** `WebSocket connection failed`
- Solution: Check backend URL is correct and uses `wss://` (not `ws://`)

**Error:** `API request failed`
- Solution: Verify backend is running and CORS is configured

### Performance Issues

- Enable gzip compression
- Use CDN for static assets
- Implement caching headers
- Optimize images
- Enable production mode in Next.js

## Monitoring and Analytics

Recommended tools:
- **Vercel Analytics** (built-in)
- **Google Analytics**
- **Sentry** (error tracking)
- **LogRocket** (session replay)
- **Posthog** (product analytics)

## Security Checklist

- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Use secure cookies
- [ ] Implement rate limiting
- [ ] Enable CSP headers
- [ ] Regular dependency updates
- [ ] Secure environment variables
- [ ] Enable DDoS protection

## Cost Estimation

### Free Tier (Suitable for MVP)
- **Vercel**: $0/month
- **Backend (Render)**: $0/month
- **Database (Supabase)**: $0/month
- **Total**: Free

### Production Tier (Recommended)
- **Vercel Pro**: $20/month
- **Backend (Render)**: $7/month
- **Database (Supabase)**: $25/month
- **Monitoring**: $0-10/month
- **Total**: ~$62/month

## Support

For deployment issues:
1. Check platform documentation
2. Review build logs
3. Check environment variables
4. Test locally first
5. Contact platform support

Happy deploying! 🚀

