# MARKETING_AUTOMATION_APP.md — Full Specification for HairHalo Marketing Automation Platform

> **Purpose**: Feed this ENTIRE file to Claude Code (or any AI coding assistant) to build a standalone marketing automation web app that generates, schedules, and publishes social media content across all major platforms — autonomously, 24/7.

---

## 🎯 Project Overview

Build a **standalone admin dashboard** (React + Vite + Tailwind + Supabase) that fully automates HairHalo's social media marketing. The system should:

1. **Generate content** using AI (captions, hashtags, image prompts, video scripts)
2. **Schedule posts** across Instagram, TikTok, X/Twitter, LinkedIn, Facebook, YouTube Shorts
3. **Auto-publish** routine content without human intervention via cron jobs
4. **Queue campaigns and ads** for manual approval before posting
5. **Track analytics** — engagement, clicks, growth, and ROI
6. **Run 24/7** — even when the admin is asleep

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                 │
│  (React SPA — content calendar, approval queue,   │
│   analytics, platform settings, campaign mgmt)    │
└──────────────┬───────────────────┬────────────────┘
               │                   │
    ┌──────────▼──────┐  ┌────────▼─────────┐
    │  Supabase DB    │  │  Edge Functions   │
    │  (posts, queue, │  │  (AI generation,  │
    │   analytics,    │  │   publishing,     │
    │   campaigns)    │  │   cron triggers)  │
    └──────────┬──────┘  └────────┬─────────┘
               │                   │
    ┌──────────▼──────────────────▼─────────┐
    │         Platform APIs                  │
    │  Instagram Graph API | TikTok API     │
    │  X/Twitter API v2   | LinkedIn API    │
    │  Facebook Pages API | YouTube Data API │
    └────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres + Edge Functions + Realtime + Storage) |
| AI | Lovable AI Gateway (google/gemini-3-flash-preview default) |
| Scheduling | pg_cron + pg_net (Supabase native) |
| Image Gen | Lovable AI image generation models |
| Auth | Supabase Auth (email+password, admin-only access) |

---

## 🗄️ Database Schema

### Table: `social_accounts`
Stores connected social media platform credentials.

```sql
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'linkedin', 'facebook', 'youtube'
  account_name TEXT NOT NULL,
  account_id TEXT, -- platform-specific account/page ID
  access_token_secret TEXT NOT NULL, -- name of secret in Supabase vault
  refresh_token_secret TEXT, -- for OAuth refresh
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- platform-specific data (page_id, channel_id, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `content_posts`
The core table — every piece of content lives here.

```sql
CREATE TABLE public.content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}', -- URLs to images/videos in Supabase Storage
  media_type TEXT DEFAULT 'image', -- 'image', 'video', 'carousel', 'text'
  alt_text TEXT,
  
  -- Targeting
  platforms TEXT[] NOT NULL, -- ['instagram', 'twitter', 'linkedin']
  language TEXT DEFAULT 'en', -- 'en', 'es', 'pt'
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Status workflow
  status TEXT DEFAULT 'draft', -- draft → queued → approved → scheduled → publishing → published → failed
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Publishing results
  published_at TIMESTAMPTZ,
  platform_post_ids JSONB DEFAULT '{}', -- { "twitter": "123456", "instagram": "789" }
  publish_error TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  
  -- Content generation metadata
  content_pillar TEXT, -- 'motivation', 'transformation', 'education', etc.
  campaign_id UUID,
  ai_generated BOOLEAN DEFAULT true,
  generation_prompt TEXT,
  
  -- Multilingual variants
  caption_es TEXT,
  caption_pt TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `campaigns`
Groups of related posts for coordinated launches.

```sql
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT, -- 'launch', 'challenge', 'recruitment', 'seasonal', 'ad'
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  start_date DATE,
  end_date DATE,
  budget_total NUMERIC,
  budget_spent NUMERIC DEFAULT 0,
  target_metric TEXT, -- 'downloads', 'signups', 'views', 'engagement'
  target_value INT,
  current_value INT DEFAULT 0,
  approval_required BOOLEAN DEFAULT true, -- campaigns always need approval by default
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `content_templates`
Reusable content templates for recurring post types.

```sql
CREATE TABLE public.content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT, -- 'carousel', 'reel_script', 'thread', 'single_post', 'ad_copy'
  platform TEXT, -- NULL = all platforms
  content_pillar TEXT,
  prompt_template TEXT NOT NULL, -- AI prompt with {{variables}}
  default_hashtags TEXT[] DEFAULT '{}',
  example_output TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `post_analytics`
Tracks performance metrics pulled from platform APIs.

```sql
CREATE TABLE public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  clicks INT DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `automation_rules`
Configures what runs automatically vs. needs approval.

```sql
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  content_pillar TEXT, -- NULL = applies to all
  platform TEXT, -- NULL = applies to all
  auto_publish BOOLEAN DEFAULT false, -- true = no approval needed
  max_daily_posts INT DEFAULT 3,
  posting_hours_start TIME DEFAULT '08:00',
  posting_hours_end TIME DEFAULT '21:00',
  posting_timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table: `generation_queue`
Tracks AI content generation jobs.

```sql
CREATE TABLE public.generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'weekly_content', 'campaign_content', 'single_post', 'translations'
  parameters JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB,
  error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ⚡ Edge Functions

### 1. `generate-social-content` — AI Content Generator

**Trigger**: Called by cron (weekly) or manually from dashboard.

**What it does**:
- Reads `content_templates` and `automation_rules`
- Calls Lovable AI Gateway with the brand guidelines from MARKETING_SYSTEM.md
- Generates a week's worth of posts (7 Instagram, 5 TikTok, 3 Twitter, 1 LinkedIn)
- Generates Spanish and Portuguese translations for top posts
- Inserts posts into `content_posts` with appropriate status:
  - `status: 'scheduled'` if `auto_publish = true` in automation_rules
  - `status: 'queued'` if `approval_required = true`
- Generates image prompts and calls image generation for visual content
- Stores generated images in Supabase Storage bucket `marketing-assets`

**System prompt to embed** (excerpt):
```
You are HairHalo's Marketing AI. Brand voice: confident, playful, empowering, inclusive, tech-forward.
Tagline: "See Your New Look Before You Book"
Key phrases: "See it before you cut it", "AI-powered preview", "Zero surprises", "Try before you commit"
Never use: "Revolutionary", "Best-in-class", "Utilize", "Synergy", "Disrupting"
Always include 3-4 core hashtags: #HairHalo #SeeItBeforeYouCutIt #AIHairMakeover #MyHairHalo
```

### 2. `publish-social-post` — Platform Publisher

**Trigger**: Called by cron every 5 minutes scanning for posts where `scheduled_at <= now()` AND `status = 'scheduled'`.

**What it does**:
- Fetches due posts from `content_posts`
- For each post, calls the appropriate platform API:
  - **X/Twitter**: POST to `https://api.x.com/2/tweets`
  - **LinkedIn**: POST to LinkedIn UGC API
  - **Facebook**: POST to Facebook Pages Graph API
  - **Instagram**: POST via Instagram Graph API (requires Facebook Page)
  - **TikTok**: POST via TikTok Content Posting API
  - **YouTube**: POST via YouTube Data API v3 (Shorts)
- Updates `status` to `'published'` or `'failed'`
- Stores platform-specific post IDs in `platform_post_ids`
- On failure: increments `retry_count`, sets back to `'scheduled'` if under max_retries

### 3. `fetch-post-analytics` — Analytics Collector

**Trigger**: Cron every 6 hours.

**What it does**:
- Fetches all posts published in the last 30 days
- Calls each platform's analytics API to get impressions, likes, comments, shares
- Upserts into `post_analytics`
- Calculates engagement rates

### 4. `content-calendar-generator` — Monthly Planner

**Trigger**: Called manually or by cron on the 25th of each month.

**What it does**:
- Generates a complete 30-day content calendar for the next month
- Respects `automation_rules` for posting frequency and hours
- Assigns content pillars based on day-of-week rotation
- Creates draft posts in `content_posts`
- Triggers `generate-social-content` for each day's content

### 5. `campaign-orchestrator` — Campaign Manager

**Trigger**: Called when a campaign status changes to 'active'.

**What it does**:
- Reads campaign parameters (type, duration, platforms, budget)
- Generates all campaign posts according to the campaign template
- Schedules posts across the campaign duration
- Monitors campaign KPIs and adjusts posting if needed

---

## 🖥️ Dashboard Pages

### 1. Dashboard Home (`/`)
- **Today's posts**: Timeline of scheduled, published, and queued posts
- **Quick stats**: Posts published today, engagement rate, follower growth
- **Approval queue count** badge
- **System health**: Cron job status, API connection status, error count

### 2. Content Calendar (`/calendar`)
- **Monthly calendar view** with drag-and-drop post scheduling
- **Color-coded** by platform (Instagram=pink, TikTok=black, Twitter=blue, LinkedIn=navy)
- **Click to expand** any day to see/edit posts
- **Bulk actions**: Generate week, approve all, reschedule
- **Filter** by platform, content pillar, status, campaign

### 3. Approval Queue (`/approvals`)
- **Card-based queue** of posts awaiting approval
- Each card shows: preview, caption, hashtags, scheduled time, platform icons
- **One-click approve/reject** with optional edit before approve
- **Bulk approve** button for routine content
- **AI confidence score** on each post (how well it matches brand guidelines)

### 4. Content Generator (`/generate`)
- **Manual content generation** interface
- Select: platform(s), content pillar, tone, language, campaign
- **Live preview** of generated content
- **Regenerate** button with feedback ("make it funnier", "more professional")
- **Image generation** panel with AI-generated visuals
- **Save as template** option

### 5. Campaigns (`/campaigns`)
- **Campaign list** with status, progress bars, dates
- **Campaign builder**: name, type, duration, platforms, budget, KPIs
- **Campaign timeline**: Gantt-chart view of all campaign posts
- **Performance dashboard** per campaign

### 6. Analytics (`/analytics`)
- **Overview charts**: Engagement over time, followers over time, best performing posts
- **Platform breakdown**: Performance by platform with comparison
- **Content pillar analysis**: Which pillars drive the most engagement
- **Best posting times**: Heatmap of engagement by hour/day
- **ROI tracker**: Cost per click, cost per download, conversion rates
- **Export** to CSV/PDF

### 7. Platform Settings (`/settings/platforms`)
- **Connect/disconnect** social media accounts
- **OAuth flow** for each platform
- **API key management** (stored as Supabase secrets)
- **Test connection** button
- **Posting preferences** per platform (max posts/day, quiet hours)

### 8. Automation Rules (`/settings/automation`)
- **Rule builder**: Which content types auto-publish vs. need approval
- **Scheduling preferences**: Peak hours, frequency limits
- **Content pillar rotation** configuration
- **Emergency stop** button — pauses all automated publishing
- **Audit log** of all automated actions

### 9. Templates (`/templates`)
- **Template library**: Browse and manage content templates
- **Template editor**: Edit AI prompts with variable placeholders
- **Template testing**: Generate sample output from a template
- **Import/export** templates

---

## ⏰ Cron Jobs (pg_cron + pg_net)

| Job | Schedule | Edge Function | Description |
|---|---|---|---|
| Weekly content gen | `0 2 * * 1` (Mon 2am) | `generate-social-content` | Generate next week's content |
| Publish posts | `*/5 * * * *` (every 5 min) | `publish-social-post` | Publish due scheduled posts |
| Fetch analytics | `0 */6 * * *` (every 6h) | `fetch-post-analytics` | Pull engagement metrics |
| Monthly calendar | `0 3 25 * *` (25th, 3am) | `content-calendar-generator` | Plan next month |
| Token refresh | `0 0 * * *` (daily midnight) | `refresh-platform-tokens` | Refresh OAuth tokens |
| Retry failed | `*/15 * * * *` (every 15 min) | `retry-failed-posts` | Retry failed publishes |

---

## 🔐 Security

### API Keys Required (store as Supabase Secrets)

```
TWITTER_CONSUMER_KEY
TWITTER_CONSUMER_SECRET
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET
INSTAGRAM_ACCESS_TOKEN
FACEBOOK_PAGE_ACCESS_TOKEN
FACEBOOK_PAGE_ID
LINKEDIN_ACCESS_TOKEN
LINKEDIN_ORGANIZATION_ID
TIKTOK_ACCESS_TOKEN
TIKTOK_OPEN_ID
YOUTUBE_API_KEY
YOUTUBE_REFRESH_TOKEN
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
LOVABLE_API_KEY (pre-configured)
```

### Auth Rules
- Dashboard is **admin-only** — single admin user with email+password
- All edge functions validate JWT
- Platform tokens stored in Supabase Vault, never exposed to frontend
- RLS policies: admin user can CRUD all tables

---

## 🎨 Brand Guidelines (Embedded in AI Prompts)

The system must embed these in every content generation call:

```json
{
  "brand_name": "HairHalo",
  "tagline": "See Your New Look Before You Book",
  "voice": ["confident", "playful", "empowering", "inclusive", "tech-forward"],
  "approved_phrases": [
    "See it before you cut it",
    "AI-powered preview",
    "Your look, your way",
    "Zero surprises",
    "Confidence in every cut",
    "Try before you commit"
  ],
  "banned_words": ["Revolutionary", "Best-in-class", "Utilize", "Synergy", "Disrupting"],
  "core_hashtags": ["#HairHalo", "#SeeItBeforeYouCutIt", "#AIHairMakeover", "#MyHairHalo", "#NoMoreBadHaircuts"],
  "content_pillars": {
    "monday": "motivation",
    "tuesday": "transformation",
    "wednesday": "education",
    "thursday": "community",
    "friday": "fun",
    "saturday": "lifestyle",
    "sunday": "storytelling"
  },
  "multilingual": {
    "es": { "tagline": "Ve tu nuevo look antes de ir al salón", "tone": "tú (informal)" },
    "pt": { "tagline": "Veja seu novo visual antes de cortar", "tone": "você (informal)" }
  },
  "app_url": "https://hair-halo-hubs.lovable.app/launch",
  "utm_pattern": "?utm_source={{platform}}&utm_medium=social&utm_campaign={{campaign_name}}"
}
```

---

## 📋 Content Pillar Rotation

| Day | Pillar | Auto-Publish? | Platforms |
|---|---|---|---|
| Monday | Motivation ("New week, new look") | ✅ Yes | Instagram, Twitter, Facebook |
| Tuesday | Transformation (before/after, user stories) | ✅ Yes | Instagram, TikTok, Twitter |
| Wednesday | Education (how HairHalo works, tips) | ✅ Yes | Instagram, LinkedIn, Twitter |
| Thursday | Community (stylist spotlights) | ❌ Approval | Instagram, LinkedIn, Facebook |
| Friday | Fun (memes, polls, challenges) | ✅ Yes | TikTok, Instagram, Twitter |
| Saturday | Lifestyle (weekend inspo) | ✅ Yes | Instagram, Facebook |
| Sunday | Storytelling (founder stories, BTS) | ❌ Approval | Instagram, LinkedIn |

---

## 🚀 Implementation Order

Build in this exact sequence:

### Phase 1: Foundation (Week 1)
1. Create Supabase tables with RLS
2. Build admin auth (single admin user)
3. Create dashboard layout with sidebar navigation
4. Build the content calendar page (read-only view first)

### Phase 2: AI Content Engine (Week 2)
5. Create `generate-social-content` edge function
6. Build the manual content generator page
7. Build the template management page
8. Wire up content generation to create posts in DB

### Phase 3: Publishing Pipeline (Week 3)
9. Create `publish-social-post` edge function
10. Build platform settings page with API key management
11. Set up pg_cron jobs for automated publishing
12. Build the approval queue page

### Phase 4: Analytics & Campaigns (Week 4)
13. Create `fetch-post-analytics` edge function
14. Build analytics dashboard with charts
15. Build campaign management page
16. Create `campaign-orchestrator` edge function

### Phase 5: Polish & Automation (Week 5)
17. Build automation rules page
18. Add emergency stop functionality
19. Add audit logging
20. Add email notifications for failures and approval requests
21. Build mobile-responsive views
22. End-to-end testing

---

## 💡 AI Content Generation Prompt Templates

### Daily Post Generator
```
You are HairHalo's Marketing AI. Today is {{day_of_week}}, content pillar: {{pillar}}.

Generate {{count}} social media posts for: {{platforms}}

Requirements:
- Follow HairHalo brand voice (confident, playful, empowering)
- Include 3-4 core hashtags + 3-5 trending/niche hashtags
- Each post must have a clear CTA
- Mention the app's AI preview feature naturally
- Keep Instagram captions under 2200 chars
- Keep tweets under 280 chars
- Include alt text for any visual descriptions

For the top {{translate_count}} posts, also provide:
- Spanish translation (using "tú" informal)
- Portuguese translation (using "você" informal)

Output as JSON array with this structure:
{
  "posts": [{
    "platform": "instagram",
    "caption": "...",
    "hashtags": ["..."],
    "media_description": "...",
    "image_prompt": "...",
    "alt_text": "...",
    "cta": "...",
    "caption_es": "...",
    "caption_pt": "...",
    "best_posting_time": "HH:MM EST"
  }]
}
```

### Campaign Content Generator
```
You are HairHalo's Marketing AI. Generate content for the "{{campaign_name}}" campaign.

Campaign type: {{campaign_type}}
Duration: {{start_date}} to {{end_date}}
Platforms: {{platforms}}
Goal: {{target_metric}} — target: {{target_value}}
Budget: ${{budget}}

Generate a complete content schedule with {{posts_per_day}} posts per day.
Include influencer collaboration ideas and ad copy variants.

Output as JSON with day-by-day breakdown.
```

---

## 🔧 Platform API Quick Reference

### X/Twitter (api.x.com)
- POST tweet: `POST https://api.x.com/2/tweets`
- Auth: OAuth 1.0a (consumer key + access token)
- Media upload: `POST https://upload.twitter.com/1.1/media/upload.json`

### Instagram (via Facebook Graph API)
- Publish: `POST https://graph.facebook.com/v18.0/{ig-user-id}/media` → `POST .../media_publish`
- Auth: Facebook Page access token with `instagram_content_publish` permission

### LinkedIn
- Share post: `POST https://api.linkedin.com/v2/ugcPosts`
- Auth: OAuth 2.0 with `w_member_social` scope

### Facebook Pages
- Publish: `POST https://graph.facebook.com/v18.0/{page-id}/feed`
- Auth: Page access token with `pages_manage_posts` permission

### TikTok
- Content Posting API: `POST https://open.tiktokapis.com/v2/post/publish/content/init/`
- Auth: OAuth 2.0 with `video.upload` and `video.publish` scopes

### YouTube (Shorts)
- Upload: `POST https://www.googleapis.com/upload/youtube/v3/videos`
- Auth: OAuth 2.0 with `youtube.upload` scope

---

## 📊 Dashboard Design Guidelines

- **Dark theme** matching HairHalo's design system
- Primary color: HSL(328, 85%, 60%) — hot magenta
- Accent color: HSL(185, 100%, 50%) — electric cyan
- Background: HSL(240, 20%, 6%)
- Cards: HSL(245, 18%, 11%) with glassmorphism
- Use recharts for analytics charts
- Use shadcn/ui for all components
- Mobile-responsive with bottom navigation on small screens
- Real-time updates via Supabase Realtime for approval queue

---

## ✅ Success Criteria

The system is complete when:
1. ✅ AI generates a full week of content with one click or automatically via cron
2. ✅ Posts publish automatically to all 6 platforms at scheduled times
3. ✅ Campaign content goes through approval queue; routine content auto-publishes
4. ✅ Analytics dashboard shows real engagement data from all platforms
5. ✅ The system runs 24/7 without manual intervention
6. ✅ Emergency stop pauses all automation instantly
7. ✅ Failed posts retry automatically up to 3 times
8. ✅ Monthly content calendar is pre-generated on the 25th

---

*This document is a complete specification. Feed it to Claude Code or any AI coding assistant to build the entire marketing automation platform from scratch.*
