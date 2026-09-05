# Insurtech News Tracker Web - TODO

## Features Implemented

- [x] Database schema for storing news articles and reports
- [x] Backend API to integrate existing Python news collection logic
- [x] Frontend page to display the latest daily digest
- [x] Frontend page to view historical reports
- [x] Professional table-based email template rendering on web
- [x] Display AI-powered analysis and insights
- [x] Categorized news view by topic
- [x] Scheduled job to run news collection daily at 9:00 AM SGT
- [x] Email delivery integration (using existing Python email functionality)
- [x] Manual collection trigger via web UI

## UI/UX Improvements (User Feedback)

- [x] Optimize report display UI for better readability
- [x] Remove broken RSS feed (dig-in.com 404 error)
- [x] Full-width layout for report viewing
- [x] Better HTML report rendering on web pages
- [x] Improved spacing and typography in report view

## Future Enhancements (Optional)

- [ ] Admin dashboard for managing collection settings
- [ ] User authentication for personalized reports
- [ ] Export reports as PDF
- [ ] Email subscription management
- [ ] Custom search query builder
- [ ] RSS feed management UI
- [ ] Analytics dashboard for article trends
- [ ] Mobile app version

## Weekly Performance Review System (New Feature)

- [x] Design performance metrics tracking system
- [x] Add database schema for tracking collection logs
- [x] Implement performance analytics backend API
- [x] Create weekly report generator with statistics
- [x] Design professional weekly performance email template
- [x] Schedule weekly automation (every Monday 9:00 AM SGT)
- [x] Test weekly performance review system

## Email Subscription Feature (New Feature)

- [x] Design subscription database schema
- [x] Add subscribers table with email verification
- [x] Implement subscription API endpoints (subscribe/unsubscribe/verify)
- [x] Create subscription form on homepage
- [x] Add email verification system
- [x] Create subscription management page (verify/unsubscribe pages)
- [x] Integrate with daily email delivery system
- [x] Add unsubscribe link to emails
- [ ] Test subscription workflow end-to-end

## Daily Schedule Fix (Bug Report)

- [x] Diagnose why daily 9:00 AM SGT schedule is not executing
- [x] Fix the scheduled automation properly using Manus schedule tool
- [x] Verify daily collection is running automatically
- [ ] Test that emails are being sent daily (will verify tomorrow)

## Background Job Processing (Performance Fix)

- [x] Implement background job queue system
- [x] Update news collection API to use background jobs
- [x] Add job status tracking in database
- [x] Create job monitoring endpoint (/jobs page)
- [x] Test manual collection trigger with background jobs
- [x] Verify scheduled automation works with new system
