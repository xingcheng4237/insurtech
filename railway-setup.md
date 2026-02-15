# Quick Railway Deployment Guide

This is the fastest way to get your Insurtech News Tracker to production.

## Prerequisites

- GitHub account (already have: xingcheng4237)
- Gmail app password for email delivery
- OpenAI API key (or Manus Forge API credentials)

## Step-by-Step Instructions

### 1. Sign Up for Railway (2 minutes)

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

### 2. Create New Project (1 minute)

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `xingcheng4237/insurtech-tracker-web`
4. Railway will start deploying automatically

### 3. Add MySQL Database (1 minute)

1. In your project dashboard, click "+ New"
2. Select "Database"
3. Choose "MySQL"
4. Railway will provision the database and automatically set `DATABASE_URL`

### 4. Configure Environment Variables (5 minutes)

Click on your web service → "Variables" tab → "Raw Editor" and paste:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{MySQL.DATABASE_URL}}
JWT_SECRET=REPLACE_WITH_RANDOM_STRING_32_CHARS
EMAIL_USER=xingcheng4237@gmail.com
EMAIL_PASSWORD=REPLACE_WITH_GMAIL_APP_PASSWORD
EMAIL_FROM=xingcheng4237@gmail.com
EMAIL_TO=xingcheng4237@gmail.com
OPENAI_API_KEY=REPLACE_WITH_YOUR_OPENAI_KEY
```

**Generate JWT_SECRET**:
```bash
# Run this in terminal to generate a secure secret:
openssl rand -base64 32
```

**Get Gmail App Password**:
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password for "Mail"
3. Copy the 16-character password

### 5. Run Database Migrations (2 minutes)

1. Wait for deployment to complete (green checkmark)
2. Click on your service → "Settings" → "Deploy"
3. Under "Custom Start Command", temporarily change to:
   ```
   pnpm db:push && pnpm start
   ```
4. Click "Deploy" to redeploy
5. After successful deployment, change back to:
   ```
   pnpm start
   ```

### 6. Set Up Daily Cron Job (3 minutes)

1. In your project, click "+ New"
2. Select "Cron Job"
3. Configure:
   - **Name**: Daily News Collection
   - **Schedule**: `0 1 * * *` (1:00 AM UTC = 9:00 AM SGT)
   - **Command**: 
     ```bash
     curl -X POST https://${{web.RAILWAY_PUBLIC_DOMAIN}}/api/cron/daily-collection \
       -H "Authorization: Bearer ${{CRON_SECRET}}"
     ```
4. Add `CRON_SECRET` to your web service variables (generate another random string)

### 7. Add Cron Endpoint to Your App

Create `server/cronEndpoint.ts`:

```typescript
import { Router } from 'express';
import { runDailyCollection } from './newsCollector';

export const cronRouter = Router();

cronRouter.post('/api/cron/daily-collection', async (req, res) => {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    await runDailyCollection();
    res.json({ success: true, message: 'Daily collection completed' });
  } catch (error) {
    console.error('Cron job failed:', error);
    res.status(500).json({ error: error.message });
  }
});
```

Update `server/_core/index.ts` to include the cron router:

```typescript
import { cronRouter } from '../cronEndpoint';

// Add this line after other routes
app.use(cronRouter);
```

Commit and push to GitHub:

```bash
git add .
git commit -m "Add cron endpoint for Railway"
git push origin main
```

Railway will automatically redeploy.

### 8. Get Your Production URL

1. Go to your web service in Railway
2. Click "Settings" → "Networking"
3. Under "Public Networking", you'll see your URL:
   ```
   https://insurtech-tracker-web-production.up.railway.app
   ```

### 9. Test Your Deployment

1. Visit your production URL
2. Check homepage loads
3. Go to `/latest` and click "Collect News"
4. Wait 2-3 minutes
5. Verify report appears
6. Check your email for the report

### 10. Add Custom Domain (Optional)

1. In Railway: Settings → Networking → Custom Domain
2. Add your domain (e.g., `insurtech.yourdomain.com`)
3. Add CNAME record in your DNS:
   ```
   CNAME: insurtech → your-app.up.railway.app
   ```

## Verification Checklist

- [ ] Application deployed successfully
- [ ] Database connected (check logs)
- [ ] Homepage loads at production URL
- [ ] Manual collection works
- [ ] Email received after collection
- [ ] Cron job scheduled
- [ ] All environment variables set
- [ ] SSL certificate active (automatic)

## Troubleshooting

### Build Fails
- Check logs in Railway dashboard
- Verify all dependencies in package.json
- Ensure Node.js version matches (22.x)

### Database Connection Error
- Verify `DATABASE_URL` is set to `${{MySQL.DATABASE_URL}}`
- Check database service is running
- Run migrations: `pnpm db:push`

### Email Not Sending
- Verify Gmail app password (not regular password)
- Check `EMAIL_USER` and `EMAIL_PASSWORD` are correct
- Test SMTP connection

### Cron Job Not Running
- Verify cron schedule: `0 1 * * *`
- Check `CRON_SECRET` matches in both places
- Test endpoint manually with curl
- Check cron job logs in Railway

## Cost

Railway free tier includes:
- $5 credit per month
- Enough for small-medium traffic

Expected costs:
- Web service: ~$5/month
- MySQL database: ~$5/month
- **Total: ~$10/month** (first month free)

## Next Steps After Deployment

1. Monitor application for 24 hours
2. Verify first scheduled collection (next day 9 AM SGT)
3. Set up uptime monitoring (UptimeRobot)
4. Configure error tracking (Sentry)
5. Add custom domain
6. Share with stakeholders!

---

**Estimated Total Time**: 15-20 minutes  
**Difficulty**: Easy  
**Recommended For**: Quick production deployment
