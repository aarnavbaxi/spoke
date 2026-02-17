# Product Requirements Document (PRD)
## SpokeAI

**Version:** 1.0  
**Last Updated:** February 14, 2026  
**Author:** Aarnav

---

## 1. Product Overview

### 1.1 Product Vision

A daily-use iOS app that helps users improve their public speaking skills through AI-powered feedback, gamification, and consistent practice. Users speak into the app for timed sessions and receive actionable insights to sound smarter and more confident.

### 1.2 Problem Statement

Many people struggle with public speaking and articulating themselves clearly in professional and social settings. While people naturally admire those who speak well, there are limited accessible tools for daily speaking practice with immediate, actionable feedback.

### 1.3 Target Users

- **Primary:** Anyone wanting to improve everyday conversation skills
- **Secondary:** Job seekers preparing for interviews
- **Tertiary:** Students preparing for presentations
- **Common thread:** People who notice their vocabulary or speaking skills need improvement

---

## 2. Product Features

### 2.1 Free Tier Features

#### Core Recording Functionality

- **3-minute timed speaking sessions**
- Start/stop recording controls
- Visual countdown timer
- Audio playback capability

#### Freeform Speaking Mode

- Users can speak about any topic
- No prompts provided in free tier
- Open-ended practice environment

#### Basic Metrics

The app calculates and displays:

- **Filler words count:** Track instances of "um," "uh," "like," "you know," etc.
- **Speaking pace:** Words per minute (WPM)
- **Vocabulary diversity:** Ratio of unique words to total words

#### AI Feedback & Suggestions

- Gemini-powered analysis of transcript
- Personalized feedback on speaking patterns
- Actionable suggestions for improvement
- Highlights areas of strength and weakness

#### Gamification Elements

- **Streak counter:** Tracks consecutive days of practice
- **Achievement badges:** Unlock badges for milestones (e.g., "First Session," "7-Day Streak," "100 Sessions," "Filler-Free")
- Badge collection visible in profile

#### Progress Tracking

- Historical view of all metrics over time
- Visual charts showing improvement
- Session history (list of past sessions with dates)

### 2.2 Premium Tier Features

**Pricing:** $3.99/month or $29.99/year

#### Flexible Session Length

- User can choose session duration (3, 5, 10, 15 minutes, or custom)
- No fixed time limit

#### Interview Mode

- Curated interview question prompts:
  - "Tell me about yourself"
  - "Describe a time you showed leadership"
  - "What's your greatest weakness?"
  - "Why do you want this role?"
  - Additional common interview questions
- Practice mode specifically for job interviews

#### Generate Prompt Button

- AI-generated speaking prompts for freeform mode
- Variety of topics to keep practice interesting
- Examples: "Describe your ideal weekend," "Explain your favorite hobby," "Talk about a recent news event"

#### Advanced Metrics

- **Sentence complexity analysis:** Average sentence length, complexity score
- **Pause frequency and duration:** Track natural pauses vs awkward silences
- **Additional insights:** Vocabulary sophistication, speaking confidence score

---

## 3. Technical Architecture

### 3.1 Technology Stack

**Frontend:**
- React Native with Expo
- React Native Voice/Audio library (expo-av or react-native-audio-recorder-player)

**Backend:**
- Supabase (PostgreSQL database, authentication, storage)

**AI Services:**
- Web Speech API (transcription)
- Google Gemini 1.5 Flash API (AI feedback generation)

**Payments:**
- RevenueCat (in-app purchase management)

**Analytics:**
- Mixpanel or PostHog (optional)

### 3.2 Database Schema

#### users

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | varchar(255) | Unique user email |
| `created_at` | timestamp | Account creation |
| `subscription_tier` | enum | 'free' or 'premium' |
| `subscription_expires_at` | timestamp | Premium expiration |
| `current_streak` | integer | Current consecutive days |
| `longest_streak` | integer | Best streak achieved |
| `last_practice_date` | date | Last session date |
| `total_sessions` | integer | Total sessions count |

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `subscription_tier`

**Row Level Security:**
- Users can only read/update their own row
- Insert only allowed during signup

#### sessions

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `transcript` | text | Full transcription |
| `duration` | integer | Seconds |
| `audio_url` | varchar(500) | Storage URL (optional) |
| `created_at` | timestamp | Recording time |
| `filler_words_count` | integer | Detected filler words |
| `speaking_pace` | float | Words per minute |
| `vocab_diversity` | float | Unique/total ratio |
| `ai_feedback` | text | Gemini feedback |
| `session_mode` | enum | freeform/interview/custom |
| `prompt_used` | text | Prompt if applicable |
| `advanced_metrics` | jsonb | Premium metrics |

**advanced_metrics structure (premium only):**
```json
{
  "sentence_complexity": {
    "avg_sentence_length": 15.2,
    "complexity_score": 0.72
  },
  "pause_analysis": {
    "total_pauses": 23,
    "avg_pause_duration": 1.4,
    "awkward_pauses": 3
  },
  "vocab_sophistication": 0.68,
  "confidence_score": 0.81
}
```

**Indexes:**
- Primary key on `id`
- FK index on `user_id`
- Index on `created_at`
- Composite index on `(user_id, created_at)`

**Row Level Security:**
- Users can only read/insert/update their own sessions
- Delete allowed for session owner only

#### achievements

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `badge_type` | varchar(100) | Badge identifier |
| `badge_name` | varchar(100) | Display name |
| `badge_description` | text | Achievement details |
| `unlocked_at` | timestamp | When earned |

**Badge types:**

- `first_session` - "First Step" - Complete your first session
- `streak_3` - "Getting Started" - 3-day streak
- `streak_7` - "One Week Strong" - 7-day streak
- `streak_30` - "Monthly Master" - 30-day streak
- `streak_100` - "Century Club" - 100-day streak
- `sessions_10` - "Ten Sessions" - Complete 10 sessions
- `sessions_50` - "Half Century" - Complete 50 sessions
- `sessions_100` - "Centurion" - Complete 100 sessions
- `filler_free` - "Filler-Free" - Session with 0 filler words
- `speed_demon` - "Speed Demon" - 180+ WPM
- `vocab_master` - "Vocab Master" - 0.9+ vocab diversity

**Indexes:**
- Primary key on `id`
- FK index on `user_id`
- Composite unique index on `(user_id, badge_type)`

**Row Level Security:**
- Users can only read their own achievements
- Insert handled by backend triggers only

#### Database Relationships
```
users (1) ──→ (many) sessions
  └─→ (many) achievements
```

**Foreign Keys:**
- `sessions.user_id` → `users.id` (ON DELETE CASCADE)
- `achievements.user_id` → `users.id` (ON DELETE CASCADE)

#### Database Functions & Triggers

**Function: update_user_streak()**

- Triggered after INSERT on `sessions`
- Checks `last_practice_date`
- If yesterday: increment `current_streak`
- If today: no change
- If 2+ days ago: reset to 1
- Update `longest_streak` if exceeded
- Update `last_practice_date` to today
- Increment `total_sessions`

**Function: check_and_award_badges()**

- Triggered after INSERT on `sessions`
- Checks user stats
- Awards badges if criteria met
- Inserts into `achievements` if new

**Triggers:**
```sql
CREATE TRIGGER after_session_insert
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();

CREATE TRIGGER after_session_badge_check
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION check_and_award_badges();
```

### 3.3 Key Algorithms

**Filler Words Detection:**
- Regex pattern matching on transcript
- Patterns: "um", "uh", "like", "you know", "so", "actually", "basically"

**Speaking Pace Calculation:**
```
WPM = (total_word_count / duration_in_seconds) * 60
```

**Vocabulary Diversity:**
```
diversity_score = unique_words / total_words
```

### 3.4 API Integrations

**Google Gemini API:**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Model: `gemini-1.5-flash`
- Purpose: Generate AI feedback from transcript
- Free tier: 15 requests/min, 1,500 requests/day
- Cost after free tier: $0.075 per 1M input tokens

**Web Speech API:**
- Built into React Native
- Real-time transcription
- No API costs

---

## 4. User Flow

### 4.1 First-Time User Experience

1. Download app from App Store
2. Create account (email/password or social login)
3. Onboarding screens:
   - How the app works
   - Benefits of daily practice
   - Overview of streaks and badges
4. Prompt to start first session
5. Complete first 3-minute session
6. View results and unlock "First Session" badge
7. Opt-in for daily reminder notifications

### 4.2 Daily User Flow

1. Open app (notification reminder)
2. See current streak on home screen
3. Tap "Start Session"
4. Choose mode:
   - Freeform (free tier default)
   - Generate Prompt (premium only)
   - Interview Mode (premium only)
5. Speak for 3 minutes (or custom time for premium)
6. Processing screen: "Analyzing your speech..."
7. Results screen:
   - Metrics displayed
   - AI feedback paragraph
   - Streak updated (+1)
   - Badge unlocked (if applicable)
8. Options:
   - View progress over time
   - Start another session
   - Share achievement

### 4.3 Premium Upgrade Flow

1. User encounters premium feature
2. Paywall screen:
   - Feature preview
   - Benefits of premium
   - Pricing: $3.99/month or $29.99/year
3. iOS in-app purchase via RevenueCat
4. Confirmation and immediate access

---

## 5. UI/UX Requirements

### 5.1 Screen Breakdown

**Home Screen:**
- Current streak counter (prominent)
- "Start Session" CTA button
- Quick stats: total sessions, badges earned
- Navigation: Home, Progress, Profile

**Recording Screen:**
- Large circular timer (countdown)
- Waveform visualization (optional)
- Stop/Pause button
- Mode indicator

**Results Screen:**
- Metrics cards:
  - Filler words count
  - Speaking pace (WPM)
  - Vocabulary diversity score
- AI feedback section (expandable)
- "View Details" for transcript
- CTA: "Practice Again" or "View Progress"

**Progress Screen:**
- Line chart: metrics over time
- Session history list (scrollable)
- Streak calendar view
- Best/worst sessions highlighted

**Profile Screen:**
- User info
- Subscription status
- Badge collection (grid view)
- Settings: notifications, account, subscription

### 5.2 Design Principles

- **Minimalist:** Clean, uncluttered interface
- **Motivating:** Celebratory animations for streaks/badges
- **Clear feedback:** Metrics easy to understand at a glance
- **Accessible:** Large tap targets, readable fonts

---

## 6. Monetization

### 6.1 Pricing Strategy

**Free tier:** Full access to core features

**Premium tier:**
- $3.99/month (billed monthly)
- $29.99/year (37% savings, better retention)

---

**End of PRD**