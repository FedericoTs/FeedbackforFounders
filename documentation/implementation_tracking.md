# Implementation Tracking: Gamification & Feedback Integration

## Overview

This document tracks the implementation plan for integrating the gamification system with the feedback page functionality. It identifies components, services, database tables, and functions that need to be updated or created to ensure proper alignment between these two core features.

## Analysis Summary

After reviewing both `gamification.md` and `feedback_page_design.md`, we've identified several areas where the systems need to be aligned:

1. **Points System Alignment**: The feedback page design includes specific point calculations for feedback quality that need to be reflected in the gamification system.

2. **Feedback Quality Metrics**: The gamification system needs to incorporate the AI-analyzed metrics (specificity, actionability, novelty) from the feedback system.

3. **Achievement Integration**: Achievements related to feedback quality and quantity need to be properly tracked and rewarded.

4. **UI Components**: Several UI components need to be updated or created to display feedback-related rewards and achievements.

5. **Database Schema**: The database schema needs to be updated to support the enhanced feedback data structure with quality metrics.

## Components Requiring Updates

### UI Components

| Component | Current Status | Required Changes | Dependencies |
|-----------|----------------|------------------|-------------|
| `AwardToastListener.tsx` | Exists | Add support for feedback-specific award events | `useAwardToast` hook |
| `RewardsPanel.tsx` | Exists | Add feedback-specific achievements and stats | Gamification service |
| `ActivityFeed.tsx` | Exists | Add feedback activity types and visualizations | Activity service |
| `FeedbackInterface.tsx` | Exists | Integrate with points system, add quality indicators | Rewards service |

### Services

| Service | Current Status | Required Changes | Dependencies |
|---------|----------------|------------------|-------------|
| `rewards.ts` | Exists | Add feedback quality-based point calculation | Gamification service |
| `gamification.ts` | Exists | Update point values for feedback activities | None |
| `activity.ts` | Exists | Add feedback-specific activity types | None |
| `project.ts` | Exists | Add methods for feedback section mapping | None |

### Edge Functions

| Function | Current Status | Required Changes | Dependencies |
|----------|----------------|------------------|-------------|
| `gamification` | Exists | Add feedback quality multipliers | None |
| `feedback-analysis` | Needs creation | Create new function for AI feedback analysis | OpenAI API |

## Database Schema Updates

### New Tables

```sql
-- Feedback Table (Enhanced version from feedback_page_design.md)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  section_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment FLOAT,
  category TEXT NOT NULL,
  subcategory TEXT,
  actionability_score FLOAT,
  specificity_score FLOAT,
  novelty_score FLOAT,
  helpfulness_rating INTEGER,
  screenshot_url TEXT,
  screenshot_annotations JSON,
  quick_reactions JSON,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Section Mapping Table
CREATE TABLE IF NOT EXISTS project_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL,
  dom_path TEXT,
  visual_bounds JSON,
  priority INTEGER,
  feedback_count INTEGER DEFAULT 0,
  average_sentiment FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, section_id)
);
```

### Updates to Existing Tables

```sql
-- Add feedback-specific fields to user_activity table
ALTER TABLE user_activity
  ADD COLUMN IF NOT EXISTS feedback_id UUID REFERENCES feedback(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feedback_quality_score FLOAT;

-- Add feedback-specific achievements
INSERT INTO achievements (id, name, description, points, icon, requirement_type, requirement_value)
VALUES
  (uuid_generate_v4(), 'Feedback Champion', 'Give feedback to 10 different projects', 100, 'message-square', 'feedback_count', 10),
  (uuid_generate_v4(), 'Quality Reviewer', 'Achieve an average feedback quality score of 0.8+', 150, 'award', 'feedback_quality', 0.8),
  (uuid_generate_v4(), 'Section Specialist', 'Provide feedback on all sections of a project', 75, 'layout', 'complete_sections', 1);
```

## Implementation Plan

### Phase 1: Database Schema Updates

1. Create migration file for new tables (feedback, project_sections)
2. Update existing tables with new columns
3. Add feedback-specific achievements

### Phase 2: Service Layer Updates

1. Update `rewards.ts` with feedback quality point calculation
2. Update `gamification.ts` with new point values
3. Create feedback analysis service for AI-powered quality assessment

### Phase 3: UI Component Updates

1. Update `FeedbackInterface.tsx` to integrate with points system
2. Update `AwardToastListener.tsx` for feedback-specific awards
3. Update `RewardsPanel.tsx` to show feedback achievements
4. Update `ActivityFeed.tsx` to display feedback activities

### Phase 4: Edge Function Implementation

1. Update gamification edge function
2. Create feedback-analysis edge function

## Testing Plan

1. Test feedback submission flow with point awards
2. Verify quality metrics calculation
3. Test achievement unlocking for feedback activities
4. Verify activity feed displays feedback activities correctly
5. Test section-based feedback collection

## Dependencies

- OpenAI API for feedback quality analysis
- Supabase for database and edge functions
- React components for UI updates

## Status Tracking

| Task | Status | Assigned To | Completed Date |
|------|--------|-------------|----------------|
| Database schema migration | Not Started | | |
| Rewards service update | Not Started | | |
| Gamification service update | Not Started | | |
| Feedback analysis service | Not Started | | |
| FeedbackInterface.tsx update | Not Started | | |
| AwardToastListener.tsx update | Not Started | | |
| RewardsPanel.tsx update | Not Started | | |
| ActivityFeed.tsx update | Not Started | | |
| Gamification edge function update | Not Started | | |
| Feedback analysis edge function | Not Started | | |
