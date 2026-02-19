# Insurtech News Tracker - Railway Deployment Guide

## 📋 Overview

Complete guide for deploying the Insurtech News Tracker to Railway with all features enabled.

---

## 🚀 Quick Start

### 1. Deploy to Railway

1. **Connect GitHub Repository**
   - Go to [Railway](https://railway.app)
   - Create new project
   - Connect to `xingcheng4237/insurtech-tracker-web`

2. **Add MySQL Database**
   - Click "+ New" → "Database" → "MySQL"
   - Railway will automatically set `DATABASE_URL`

3. **Configure Environment Variables** (see below)

4. **Deploy** - Railway automatically deploys on push to `main`

---

## 🔑 Required Environment Variables

### **Core Configuration**

```bash
DATABASE_URL=(auto-configured by Railway MySQL)
NODE_ENV=production
PORT=3000
```

### **OpenAI API** (Required for AI Analysis)

```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

Get your key: https://platform.openai.com/api-keys

### **Email Delivery** (Required - Using Resend)

```bash
RESEND_API_KEY=re_YOUR_KEY_HERE
EMAIL_TO=xingcheng4237@gmail.com
```

Get Resend API key:
1. Sign up at https://resend.com/signup
2. Go to https://resend.com/api-keys
3. Create new API key

### **Daily Schedule** (Optional)

```bash
SCHEDULE_ENABLED=true
SCHEDULE_TIME=09:00
SCHEDULE_TIMEZONE=Asia/Singapore
SCHEDULE_MODE=production
```

**Modes:**
- `production` = sends to all verified subscribers
- `test` = sends only to xingcheng4237@gmail.com

### **Authentication** (Optional)

```bash
JWT_SECRET=your-random-secret-key
```

---

## ✅ Complete Environment Variable Template

Copy this to Railway Variables tab:

```bash
# Core
DATABASE_URL=(auto-configured)
NODE_ENV=production

# AI Analysis
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Email Delivery
RESEND_API_KEY=re_YOUR_KEY_HERE
EMAIL_TO=xingcheng4237@gmail.com

# Daily Schedule
SCHEDULE_ENABLED=true
SCHEDULE_TIME=09:00
SCHEDULE_TIMEZONE=Asia/Singapore
SCHEDULE_MODE=production

# Authentication
JWT_SECRET=your-random-secret-key-here
```

---

## 🧪 Testing Checklist

### **1. Basic Functionality**
- [ ] Website loads
- [ ] Health check: `/health` returns `{"status":"ok"}`
- [ ] Navigation works

### **2. Test Email Delivery**
- [ ] Click "🧪 Test Collect" button
- [ ] Wait 3-5 minutes
- [ ] Check email at xingcheng4237@gmail.com
- [ ] Verify email contains articles and AI analysis

### **3. Schedule Status**
- [ ] Go to `/schedule` page
- [ ] Verify status matches `SCHEDULE_ENABLED`
- [ ] Check next run time is correct

### **4. Production Mode**
- [ ] Add subscriber via website form
- [ ] Click "Collect News" (not Test)
- [ ] Verify email sent to all subscribers

---

## 📊 Monitoring

### **Railway Logs - Expected Output**

**Startup:**
```
✅ Database migrations completed successfully
Server running on http://0.0.0.0:8080/
📅 Scheduler: ENABLED
   Time: 09:00 (Asia/Singapore)
✅ Scheduler: Started successfully
⏰ Next scheduled run: Monday, February 19, 2026, 09:00 AM SGT
```

**News Collection:**
```
🚀 Starting news collection...
📡 Fetching Google News (30 queries)...
✅ Google News: 45 articles
📡 Fetching RSS feeds (7 feeds)...
✅ RSS Feeds: 38 articles
✅ After deduplication: 67 articles
✅ After AI filtering: 12 articles
```

**Email Delivery:**
```
✅ Email service configured successfully (Resend API)
[NewsCollection] Sending email report...
✅ Email sent successfully via Resend
Email ID: abc123...
Recipient: xingcheng4237@gmail.com
```

---

## 🐛 Troubleshooting

### **Email Not Received**
1. Check Railway logs for errors
2. Verify `RESEND_API_KEY` is correct
3. Check spam folder
4. Check Resend dashboard for delivery status

### **AI Analysis Failing**
1. Verify `OPENAI_API_KEY` is correct
2. Test key with curl:
   ```bash
   curl https://api.openai.com/v1/chat/completions \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
   ```

### **Schedule Not Running**
1. Verify `SCHEDULE_ENABLED=true`
2. Check logs for scheduler initialization
3. Check `/schedule` page for next run time

---

## 🎉 Success Criteria

✅ Website loads  
✅ Test collection works  
✅ Email arrives with AI analysis  
✅ Schedule page shows correct status  
✅ Daily automation triggers (if enabled)  

**Your deployment is complete! 🚀**
