
# Backend Setup Plan for Tasks & Gamification System

## Overview
This plan sets up the complete backend infrastructure to make the todo list functional and establish the foundation for the XP/gamification system. Currently, your database has no tables, so we'll create everything from scratch.

---

## Database Tables Required

### 1. User Profiles Table
Stores user-specific data and gamification stats.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | References auth.users |
| username | text | Display name |
| avatar_url | text | Profile picture |
| total_xp | integer | Accumulated XP (default: 0) |
| current_level | integer | Player level (default: 1) |
| current_streak | integer | Current day streak (default: 0) |
| longest_streak | integer | Best streak ever (default: 0) |
| last_activity_date | date | For streak calculation |
| weekly_goal_xp | integer | Weekly XP target (default: 500) |
| created_at | timestamp | Join date |
| updated_at | timestamp | Last update |

### 2. Tasks Table
Stores user tasks with XP rewards.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | Unique task ID |
| user_id | uuid (FK) | Links to profiles |
| title | text | Task description |
| subject | text | Category/subject |
| xp_reward | integer | XP earned on completion |
| completed | boolean | Completion status |
| completed_at | timestamp | When completed (null if not) |
| due_date | date | Optional due date |
| created_at | timestamp | Creation time |

### 3. Study Sessions Table
Tracks study time for the heatmap.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | Unique session ID |
| user_id | uuid (FK) | Links to profiles |
| date | date | Study date |
| study_minutes | integer | Time studied |
| xp_earned | integer | XP from session |
| tasks_completed | integer | Tasks done that day |
| created_at | timestamp | Creation time |

### 4. XP Transactions Table
Audit log of all XP changes.

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | Unique transaction ID |
| user_id | uuid (FK) | Links to profiles |
| amount | integer | XP gained/lost |
| source | text | What earned the XP |
| source_id | uuid | Related item ID |
| created_at | timestamp | When earned |

---

## Security: Row Level Security (RLS) Policies

All tables will have RLS enabled with these policies:
- **SELECT**: Users can only read their own data
- **INSERT**: Users can only create their own data
- **UPDATE**: Users can only update their own data
- **DELETE**: Users can only delete their own data

---

## Database Functions & Triggers

### 1. Auto-Create Profile on Signup
A trigger that creates a profile row when a new user registers.

### 2. Award XP Function
A function to safely add XP, update levels, and log transactions:
- Adds XP to user profile
- Checks for level-up (every 1000 XP)
- Creates XP transaction record

### 3. Update Streak Function
A function called when tasks are completed:
- Checks if user studied today
- Updates current streak
- Updates longest streak if beaten

### 4. Complete Task Function
Atomic function that:
- Marks task complete
- Awards XP
- Updates/creates study session for today
- Updates streak

---

## Frontend Changes

### TaskPanel Component Updates
- Fetch tasks from Supabase on load
- Add task creation modal/form
- Toggle task completion with real XP updates
- Show loading states and error handling
- Real-time updates when tasks change

### QuickStats Component Updates
- Fetch user profile from Supabase
- Display real Total XP, Level, Streak, Weekly Goal
- Calculate weekly progress dynamically

### StudyHeatmap Component Updates
- Fetch study_sessions for current year
- Display real activity data
- Update when tasks are completed

---

## Technical Implementation Order

1. **Migration 1**: Create profiles table with RLS
2. **Migration 2**: Create tasks table with RLS
3. **Migration 3**: Create study_sessions table with RLS
4. **Migration 4**: Create xp_transactions table with RLS
5. **Migration 5**: Create database functions and triggers
6. **Frontend**: Update TaskPanel to use Supabase
7. **Frontend**: Create custom hooks for data fetching
8. **Frontend**: Update QuickStats with real data
9. **Frontend**: Connect StudyHeatmap to study_sessions

---

## Level System Design

| Level | Title | XP Required |
|-------|-------|-------------|
| 1 | Beginner | 0 |
| 2 | Learner | 1,000 |
| 3 | Student | 2,500 |
| 4 | Scholar | 5,000 |
| 5 | Expert | 10,000 |
| 6 | Master | 20,000 |
| 7 | Grandmaster | 35,000 |
| 8 | Legend | 50,000 |

---

## XP Reward Structure

| Action | XP Reward |
|--------|-----------|
| Complete a task | 10-50 XP (user-defined) |
| Complete a quiz | 50-200 XP |
| Study session (per 30 min) | 25 XP |
| Maintain streak (daily bonus) | 10 XP x streak days |
| Complete flashcard deck | 30 XP |

---

## Summary

This setup provides:
- Persistent task storage with XP rewards
- Real-time gamification stats
- Streak tracking with automatic updates
- Study session tracking for the heatmap
- Full audit trail of XP earned
- Secure user data isolation via RLS

All features require authentication to work, which is already implemented in your app.
