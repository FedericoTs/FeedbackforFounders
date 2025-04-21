# Gamification System Documentation

## Overview

This document provides a comprehensive overview of the gamification system implemented in the platform. The gamification system is designed to incentivize user engagement, reward contributions, and create a compelling feedback ecosystem through points, levels, achievements, streaks, and other game mechanics.

## Core Gamification Components

### Points System

Points are the primary currency of the gamification system, awarded for various activities:

| Activity Type | Points | Description | Limits |
|--------------|--------|-------------|--------|
| `project_created` | 20 | Creating a new project | Max 3 rewarded projects |
| `project_updated` | 5 | Updating an existing project | 24-hour cooldown |
| `feedback_given` | 10 | Providing feedback on a project | No limit |
| `feedback_received` | 5 | Receiving feedback on your project | No limit |
| `goal_created` | 5 | Creating a project goal | No limit |
| `goal_completed` | 15 | Completing a project goal | No limit |
| `questionnaire_created` | 10 | Creating a questionnaire | No limit |
| `questionnaire_response` | 5 | Receiving a questionnaire response | No limit |
| `daily_login` | 5 | Logging in for the day | Once per day |
| `profile_completed` | 10 | Completing your profile | One-time only |
| `project_promotion` | -50 | Promoting a project (points spent) | No limit |

### Level System

Users progress through levels as they accumulate points:

| Level | Points Required | Points to Next Level |
|-------|----------------|----------------------|
| 1 | 0 | 100 |
| 2 | 100 | 250 |
| 3 | 250 | 500 |
| 4 | 500 | 1,000 |
| 5 | 1,000 | 2,000 |
| 6 | 2,000 | 3,500 |
| 7 | 3,500 | 5,000 |
| 8 | 5,000 | 7,500 |
| 9 | 7,500 | 10,000 |
| 10 | 10,000 | 15,000 |

Each level increase provides:
- Increased status in the community
- Access to additional features (varies by level)
- Special achievements at milestone levels (e.g., Level 5)

### Login Streak System

The login streak system rewards consistent daily engagement:

| Streak Length | Daily Bonus Points | Tier |
|---------------|-------------------|------|
| 1-2 days | 0 (base points only) | Beginner |
| 3-6 days | 2 | Beginner |
| 7-13 days | 5 | Bronze |
| 14-29 days | 10 | Bronze |
| 30-99 days | 15 | Silver |
| 100-179 days | 15 | Gold |
| 180-364 days | 15 | Platinum |
| 365+ days | 15 | Diamond |

Streak features:
- Base points (5) awarded for each daily login
- Bonus points added based on streak length
- Streak resets if a day is missed
- Maximum streak is tracked and displayed
- Special achievements for milestone streaks (7, 30, 100, 365 days)

### Achievements System

Achievements are special recognitions for accomplishing specific goals:

| Achievement | Requirements | Points Reward |
|-------------|--------------|---------------|
| First Project | Create your first project | 50 |
| Feedback Champion | Give feedback to 10 different projects | 100 |
| Goal Setter | Create 5 project goals | 75 |
| Goal Achiever | Complete 10 project goals | 150 |
| Week Streak | Maintain a 7-day login streak | 50 |
| Month Streak | Maintain a 30-day login streak | 150 |
| Level 5 Achieved | Reach level 5 | 150 |
| Profile Perfectionist | Complete all profile sections | 50 |
| Collaboration Star | Collaborate on 3 different projects | 100 |
| Questionnaire Creator | Create 3 questionnaires | 75 |

Achievements are displayed on user profiles and provide one-time point bonuses when earned.

## Gamification Workflows

### Activity Recording Workflow

1. **User Action**: User performs an action (e.g., creates a project)
2. **Service Layer**: The relevant service (e.g., `projectService`) processes the action
3. **Reward Processing**: `rewardsService.processReward()` is called with:
   - User ID
   - Activity type
   - Description
   - Metadata
   - Project ID (if applicable)
4. **Eligibility Check**: System checks if the activity is eligible for points based on:
   - Cooldown periods
   - Activity limits
   - User status
5. **Activity Recording**: Activity is recorded in the `user_activity` table
6. **Points Award**: Points are awarded via `gamificationService.awardPoints()`
7. **Level Check**: System checks if the user has reached a new level
8. **Achievement Check**: System checks if any achievements have been unlocked

### Project Creation Reward Flow

1. User creates a project through the UI
2. `projectService.createProject()` processes the creation
3. System checks if the user has reached their project limit
4. Project data is saved to the `projects` table
5. Related records are initialized (feedback counters, collaborators)
6. System checks if the user should be rewarded (max 3 rewarded projects)
7. If eligible, `rewardsService.processReward()` is called
8. 20 points are awarded and recorded in `user_activity`
9. User's total points are updated in the `users` table
10. System checks if the user has leveled up

### Login Streak Reward Flow

1. User logs in to the platform
2. `useLoginStreak()` hook is triggered
3. System checks if the user has already logged in today
4. If not, the `daily-streak` edge function is invoked
5. System calculates the current streak:
   - If the last login was yesterday, increment streak
   - If the last login was earlier, reset streak to 1
6. System calculates bonus points based on streak length
7. Base points (5) plus bonus points are awarded
8. Activity is recorded in `user_activity` and `user_login_history`
9. User's streak information is updated in the `users` table
10. If a milestone streak is reached, special notifications are shown

## Points Synchronization

The system includes a robust points synchronization mechanism to ensure consistency:

1. **Direct Updates**: Points are directly updated in the `users` table when awarded
2. **Activity Tracking**: All point-awarding activities are recorded in `user_activity`
3. **Synchronization Service**: `syncPointsService` can reconcile discrepancies by:
   - Calculating total points from all `user_activity` records
   - Updating the `users` table if the calculated total differs
   - Recalculating user level based on total points

This ensures that even if points updates fail in one part of the system, they can be reconciled later.

## Fallback Mechanisms

The system includes several fallback mechanisms to ensure reliability:

1. **Edge Function Fallback**: If the gamification edge function fails, direct database updates are attempted
2. **Activity Recording Fallback**: If activity recording fails, simplified retry attempts are made
3. **Points Update Fallback**: If points cannot be updated through the primary method, alternative update paths are tried

These fallbacks ensure that users receive their rewards even if parts of the system experience temporary issues.

## Project Promotion System

Users can spend points to promote their projects:

1. User selects a project to promote
2. User allocates points (minimum 50) to the promotion
3. Points are deducted from the user's total
4. Project receives increased visibility based on points allocated
5. Promotion runs for a specified period (typically 7-30 days)
6. Analytics track the promotion's performance

Promoted projects receive:
- Featured placement in discovery feeds
- Higher ranking in search results
- Special visual indicators
- Enhanced analytics on performance

## User Interface Elements

### Rewards Panel

The Rewards Panel (`RewardsPanel.tsx`) displays:
- Current level and progress to next level
- Total points
- Daily login reward status
- Login streak information
- Recent point activity
- Earned achievements

### Login Streak Display

The Login Streak Display (`LoginStreakDisplay.tsx`) shows:
- Current streak count
- Progress to next milestone
- Maximum streak achieved
- Current streak tier (Beginner, Bronze, Silver, Gold, Platinum, Diamond)

### Activity Feed

The Activity Feed (`ActivityFeed.tsx`) displays:
- Recent activities across the platform
- Points earned for each activity
- Special indicators for achievements and level-ups

### Award Toast Notifications

The Award Toast system (`AwardToast.tsx`, `useAwardToast.tsx`, `AwardToastListener.tsx`) provides:
- Animated, visually appealing notifications when points are awarded
- Different visual styles based on award type (default, achievement, streak, level-up)
- Immediate feedback to users when they earn points or reach milestones
- Points amount prominently displayed with animation effects
- Automatic dismissal after 5 seconds with a visual countdown

Toast variants include:
- Default (teal gradient): For standard point awards
- Achievement (amber/yellow gradient): For earning achievements
- Streak (blue/indigo gradient): For login streak rewards
- Level-up (purple/pink gradient): For reaching new levels

## Implementation Details

### Key Services

- **rewardsService**: Defines reward rules and processes rewards
- **gamificationService**: Handles points, levels, and core gamification logic
- **activityService**: Records user activities
- **syncPointsService**: Ensures points consistency across the system

### Edge Functions

- **gamification**: Processes points awards and level-ups
- **daily-streak**: Manages login streaks and bonus points
- **daily-login**: Records daily logins and awards base points

### UI Components

- **AwardToast**: Animated toast notification for rewards
- **AwardToastProvider**: Context provider for the toast system
- **AwardToastListener**: Listens for award events and triggers toasts
- **RewardsPanel**: Displays user's rewards and progress
- **LoginStreakDisplay**: Shows login streak information
- **ActivityFeed**: Displays recent activity and points earned

### Database Tables

- **users**: Stores user points, level, and streak information
- **user_activity**: Records all point-earning activities
- **user_achievements**: Tracks earned achievements
- **user_login_history**: Records login dates and streaks
- **achievements**: Defines available achievements

## Best Practices

1. **Immediate Feedback**: Users receive immediate notification when points are awarded through animated toast notifications
2. **Transparent Progress**: Level progress and point requirements are clearly displayed
3. **Balanced Rewards**: Points are balanced to reward valuable contributions appropriately
4. **Anti-Gaming Measures**: Cooldowns and limits prevent system exploitation
5. **Fallback Mechanisms**: Ensure rewards are processed even during system issues
6. **Visual Differentiation**: Different types of rewards (achievements, level-ups, streaks) have distinct visual styles
7. **Non-Intrusive Notifications**: Toast notifications provide feedback without disrupting the user experience

## Future Enhancements

Planned enhancements to the gamification system include:

1. **Leaderboards**: Weekly and monthly leaderboards for most active users
2. **Challenges**: Time-limited challenges with special rewards
3. **Badges**: Visual badges for profile customization
4. **Reward Redemption**: Ability to redeem points for tangible benefits
5. **Teams**: Team-based gamification elements for collaborative projects

## Maintenance

This documentation should be updated when:

1. New activity types are added to the system
2. Point values are adjusted
3. Level requirements are changed
4. New achievements are added
5. Streak bonuses are modified

## Last Updated

This documentation was last updated on: September 25, 2024