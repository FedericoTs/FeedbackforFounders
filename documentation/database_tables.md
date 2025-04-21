# Database Tables Documentation

## Overview

This document provides a comprehensive list of all database tables used in the project, along with their purpose and key relationships.

## User Management Tables

### `users`
- **Purpose**: Stores core user information and authentication data
- **Key Fields**: id, email, full_name, points, level, points_to_next_level, login_streak, last_login_date, max_streak
- **Relationships**: One-to-many with user_activity, project_collaborators, projects

### `user_profiles`
- **Purpose**: Stores extended user profile information
- **Key Fields**: id, user_id, bio, location, website, avatar_url, banner_url
- **Relationships**: One-to-one with users

### `user_skills`
- **Purpose**: Stores skills associated with users
- **Key Fields**: id, user_id, skill
- **Relationships**: Many-to-one with users

### `user_social_links`
- **Purpose**: Stores social media links for users
- **Key Fields**: id, user_id, platform, username
- **Relationships**: Many-to-one with users

## Activity Tracking Tables

### `user_activity`
- **Purpose**: Records all user activities for gamification and history
- **Key Fields**: id, user_id, activity_type, description, points, created_at, metadata, project_id
- **Relationships**: Many-to-one with users, optional relation to projects

### `user_login_history`
- **Purpose**: Tracks user login dates for streak calculations
- **Key Fields**: id, user_id, login_date, streak_count, points_earned
- **Relationships**: Many-to-one with users

### `achievements`
- **Purpose**: Defines available achievements in the system
- **Key Fields**: id, title, description, icon, color, points_reward, requirements
- **Relationships**: Many-to-many with users through user_achievements

### `user_achievements`
- **Purpose**: Junction table tracking which users have earned which achievements
- **Key Fields**: id, user_id, achievement_id, earned_at
- **Relationships**: Many-to-one with users and achievements

## Project Management Tables

### `projects`
- **Purpose**: Stores project information
- **Key Fields**: id, title, description, url, category, tags, visibility, status, featured, user_id, thumbnail_url
- **Relationships**: Many-to-one with users, one-to-many with project_collaborators, project_comments, project_goals

### `project_collaborators`
- **Purpose**: Tracks users collaborating on projects
- **Key Fields**: id, project_id, user_id, role
- **Relationships**: Many-to-one with projects and users

### `project_activity`
- **Purpose**: Records activity specific to projects
- **Key Fields**: id, project_id, user_id, activity_type, description, created_at, metadata
- **Relationships**: Many-to-one with projects and users

### `project_versions`
- **Purpose**: Tracks version history of projects
- **Key Fields**: id, project_id, title, description, version_number, created_at, created_by
- **Relationships**: Many-to-one with projects and users

### `project_comments`
- **Purpose**: Stores comments on projects
- **Key Fields**: id, project_id, user_id, content, created_at
- **Relationships**: Many-to-one with projects and users

### `project_feedback`
- **Purpose**: Tracks feedback count for projects
- **Key Fields**: id, project_id, count
- **Relationships**: One-to-one with projects

### `project_feedback_sentiment`
- **Purpose**: Tracks sentiment analysis of feedback
- **Key Fields**: id, project_id, positive, negative, neutral
- **Relationships**: One-to-one with projects

## Project Goals and Questionnaires

### `project_goals`
- **Purpose**: Stores goals for projects
- **Key Fields**: id, project_id, title, description, target_value, current_value, goal_type, status, created_by
- **Relationships**: Many-to-one with projects and users

### `project_questionnaires`
- **Purpose**: Stores questionnaires for projects
- **Key Fields**: id, project_id, title, description, questions, is_active, created_by
- **Relationships**: Many-to-one with projects and users

### `questionnaire_responses`
- **Purpose**: Stores responses to questionnaires
- **Key Fields**: id, questionnaire_id, user_id, responses, created_at
- **Relationships**: Many-to-one with project_questionnaires and users

## Project Promotion

### `project_promotions`
- **Purpose**: Tracks project promotion campaigns
- **Key Fields**: id, project_id, user_id, points_allocated, start_date, end_date, audience_type, estimated_reach, status
- **Relationships**: Many-to-one with projects and users

## Storage

### Storage Buckets
- **avatars**: Stores user profile avatars
- **banners**: Stores user profile banner images
- **project_thumbnails**: Stores project thumbnail images

## Schema Evolution

The database schema has evolved over time through migrations. Key migration files include:

- Initial user profiles schema (20240701000001_user_profiles_schema.sql)
- Project tables creation (20240801000001_create_projects_tables.sql)
- Project collaboration tables (20240901000001_project_collaboration_tables.sql)
- Goals and questionnaires (20240905000001_add_goals_and_questionnaires.sql)
- Activity tracking (20240914000001_user_activity_tracking.sql)
- Login streak tracking (20240915000001_add_login_streak_tracking.sql)

## Realtime Enabled Tables

The following tables have realtime functionality enabled through the Supabase realtime publication:

- user_activity
- projects
- project_activity
- project_comments
- project_goals
- project_questionnaires
- questionnaire_responses

## Notes on Database Design

1. The database follows a relational design with clear entity relationships.
2. Gamification is implemented through the user_activity, achievements, and points tracking in the users table.
3. Project collaboration is handled through role-based permissions in the project_collaborators table.
4. The system uses separate tables for different aspects of projects (goals, questionnaires, feedback) to maintain modularity.
5. Login streaks and daily rewards are tracked through dedicated tables and fields.
