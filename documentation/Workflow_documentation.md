# Activity Tracking Workflow Documentation

## Overview

This document outlines the standard workflow for tracking user activities in the platform. Every user action that should be rewarded with points follows this consistent pattern to ensure proper activity recording, point allocation, and user statistics updates.

### Recent Improvements

The activity tracking system has been enhanced with the following improvements:

1. **Standardized Activity Metadata**: Type-safe interfaces for different activity types
2. **Automated Description Generation**: Consistent descriptions based on activity type and metadata
3. **Simplified Activity Creation**: Helper functions to create properly formatted activity records
4. **Improved Duplicate Prevention**: Enhanced checks to prevent duplicate activity records
5. **Flexible Activity Recording**: Support for both direct ActivityData objects and simplified parameter objects

## Standard Activity Tracking Workflow

1. **User Action Trigger**: User performs an action that should be tracked (e.g., creating a project, completing a goal)
2. **Data Persistence**: The primary data related to the action is saved in the appropriate table
3. **Activity Recording**: A single record is created in the `user_activity` table with:
   - `user_id`: The ID of the user performing the action
   - `activity_type`: The type of activity (from predefined list)
   - `description`: Human-readable description of the activity
   - `points`: Points awarded based on the `reward_rules` table
   - `metadata`: Additional contextual information (optional)
   - `project_id`: Related project ID if applicable
4. **Points Update**: The user's total points are updated in the `users` table
5. **Level Check**: The system checks if the user has reached a new level based on points
6. **Streak Update**: For daily activities, login streaks are updated if applicable

## Activity Types

The following activity types are tracked in the system:

| Activity Type | Description | Points Source |
|--------------|-------------|---------------|
| `project_created` | User creates a new project | `reward_rules` table |
| `project_updated` | User updates an existing project | `reward_rules` table |
| `feedback_given` | User provides feedback on a project | `reward_rules` table |
| `feedback_received` | User receives feedback on their project | `reward_rules` table |
| `goal_created` | User creates a project goal | `reward_rules` table |
| `goal_completed` | User completes a project goal | `reward_rules` table |
| `questionnaire_created` | User creates a questionnaire | `reward_rules` table |
| `questionnaire_response` | User receives a questionnaire response | `reward_rules` table |
| `daily_login` | User logs in for the day | `reward_rules` table |
| `profile_completed` | User completes their profile | `reward_rules` table |
| `project_promotion` | User promotes a project | `reward_rules` table |
| `achievement_earned` | User earns an achievement | Varies by achievement |
| `level_up` | User reaches a new level | No points awarded |

## Project Creation Workflow

The project creation workflow follows these specific steps:

1. **Modal Trigger**: User clicks "Create Project" button to open the creation modal
2. **Input Details**: User enters project details (title, description, etc.)
3. **Data Validation**: System validates the input data
4. **Project Persistence**: 
   - System saves project details to the `projects` table
   - System initializes related records (feedback counters, etc.)
   - System adds the creator as the project owner in `project_collaborators`
5. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `project_created`
   - Metadata includes projectId, projectTitle, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `activityService.recordActivity`
   - Points are determined from the `reward_rules` table
6. **Points Update**: 
   - System updates the user's points in the `users` table
   - System checks if the user has leveled up
7. **Completion**: User is redirected to the new project or shown a success message

### Improved Activity Recording

The activity recording process now uses a more standardized approach:

```typescript
// Example of recording a project creation activity
const activityRecord = createActivityRecord(
  userId,
  'project_created',
  {
    points: 20, // Points from reward rules
    metadata: {
      projectId: project.id,
      projectTitle: project.title
    }
  }
);

// Record the activity
await activityService.recordActivity(activityRecord);
```

Alternatively, the simplified format can be used:

```typescript
// Simplified format
await activityService.recordActivity({
  userId,
  activityType: 'project_created',
  points: 20,
  metadata: {
    projectId: project.id,
    projectTitle: project.title
  }
});
```

## Goal Management Workflow

The goal management workflow follows these specific steps:

### Goal Creation

1. **Modal Trigger**: User clicks "Add Goal" button to open the creation modal
2. **Input Details**: User enters goal details (title, description, target value, goal type, etc.)
3. **Data Validation**: System validates the input data
4. **Goal Persistence**: 
   - System saves goal details to the `project_goals` table
   - System sets initial values (current_value = 0, status = "in_progress")
5. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `goal_created`
   - Metadata includes goalTitle, goalType, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (5 points)
6. **Points Update**: 
   - System updates the user's points in the `users` table
   - System checks if the user has leveled up
7. **Completion**: User sees the new goal in the project goals list

### Goal Update

1. **Edit Trigger**: User clicks edit button on an existing goal
2. **Input Changes**: User modifies goal details
3. **Data Validation**: System validates the updated data
4. **Goal Update Persistence**: 
   - System updates goal details in the `project_goals` table
   - System sets updated_at timestamp
5. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `project_updated`
   - Metadata includes goalTitle, goalType, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (5 points, subject to 24-hour cooldown)
6. **Points Update**: 
   - System updates the user's points in the `users` table if eligible
   - System checks if the user has leveled up
7. **Completion**: User sees the updated goal in the project goals list

### Goal Completion

1. **Completion Trigger**: User clicks "Mark as Completed" on a goal
2. **Status Update**: 
   - System updates goal status to "completed" in the `project_goals` table
   - System sets updated_at timestamp
3. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `goal_completed`
   - Metadata includes goalTitle, goalType, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (15 points)
4. **Points Update**: 
   - System updates the user's points in the `users` table
   - System checks if the user has leveled up
5. **Completion**: User sees the goal marked as completed with visual indicators

### Goal Deletion

1. **Deletion Trigger**: User clicks delete button on a goal
2. **Confirmation**: User confirms deletion in a confirmation dialog
3. **Goal Removal**: 
   - System removes goal from the `project_goals` table
4. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `project_updated`
   - Metadata includes goalTitle, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (5 points, subject to 24-hour cooldown)
5. **Points Update**: 
   - System updates the user's points in the `users` table if eligible
   - System checks if the user has leveled up
6. **Completion**: User sees the updated goals list without the deleted goal

### Improved Goal Activity Recording

The goal activity recording process uses the standardized approach:

```typescript
// Example of recording a goal creation activity
await rewardsService.processReward({
  userId: user.id,
  activityType: "goal_created",
  description: `Created goal: ${newGoal.title} for project`,
  projectId: projectId,
  metadata: { goalTitle: newGoal.title, goalType: newGoal.goal_type },
});

// Example of recording a goal completion activity
await rewardsService.processReward({
  userId: user.id,
  activityType: "goal_completed",
  description: `Completed goal: ${goal.title}`,
  projectId: goal.project_id,
  metadata: { goalTitle: goal.title, goalType: goal.goal_type },
});
```

## Questionnaire Management Workflow

The questionnaire management workflow follows these specific steps:

### Questionnaire Creation

1. **Modal Trigger**: User clicks "Create Questionnaire" button to open the creation modal
2. **Input Details**: User enters questionnaire details (title, description, questions, etc.)
3. **Data Validation**: System validates the input data
4. **Questionnaire Persistence**: 
   - System saves questionnaire details to the `project_questionnaires` table
   - System sets is_active flag and created_by user ID
5. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `questionnaire_created`
   - Metadata includes questionnaireTitle, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (10 points)
6. **Points Update**: 
   - System updates the user's points in the `users` table
   - System checks if the user has leveled up
7. **Completion**: User sees the new questionnaire in the project questionnaires list

### Questionnaire Update

1. **Edit Trigger**: User clicks edit button on an existing questionnaire
2. **Input Changes**: User modifies questionnaire details
3. **Data Validation**: System validates the updated data
4. **Questionnaire Update Persistence**: 
   - System updates questionnaire details in the `project_questionnaires` table
   - System sets updated_at timestamp
5. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `project_updated`
   - Metadata includes questionnaireTitle, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (5 points, subject to 24-hour cooldown)
6. **Points Update**: 
   - System updates the user's points in the `users` table if eligible
   - System checks if the user has leveled up
7. **Completion**: User sees the updated questionnaire in the project questionnaires list

### Questionnaire Response

1. **Response Trigger**: A user submits a response to a questionnaire
2. **Data Validation**: System validates the response data
3. **Response Persistence**: 
   - System saves response details to the `questionnaire_responses` table
4. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `questionnaire_response`
   - Metadata includes questionnaireTitle, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (5 points)
5. **Points Update**: 
   - System updates the questionnaire creator's points in the `users` table
   - System checks if the user has leveled up
6. **Completion**: Questionnaire creator sees the new response in their responses list

### Questionnaire Deletion

1. **Deletion Trigger**: User clicks delete button on a questionnaire
2. **Confirmation**: User confirms deletion in a confirmation dialog
3. **Questionnaire Removal**: 
   - System removes questionnaire from the `project_questionnaires` table
4. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `project_updated`
   - Metadata includes questionnaireTitle, projectId, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` table via `rewardsService.processReward()`
   - Points are determined from the `reward_rules` table (5 points, subject to 24-hour cooldown)
5. **Points Update**: 
   - System updates the user's points in the `users` table if eligible
   - System checks if the user has leveled up
6. **Completion**: User sees the updated questionnaires list without the deleted questionnaire

### Improved Questionnaire Activity Recording

The questionnaire activity recording process uses the standardized approach:

```typescript
// Example of recording a questionnaire creation activity
await rewardsService.processReward({
  userId: user.id,
  activityType: "questionnaire_created",
  description: `Created questionnaire: ${questionnaire.title}`,
  projectId: questionnaire.project_id,
  metadata: { questionnaireTitle: questionnaire.title },
});

// Example of recording a questionnaire response activity
await rewardsService.processReward({
  userId: questionnaire.created_by, // Points go to questionnaire creator
  activityType: "questionnaire_response",
  description: `Received response for questionnaire: ${questionnaire.title}`,
  projectId: questionnaire.project_id,
  metadata: { questionnaireTitle: questionnaire.title, responseId: responseData.id },
});
```

## Login Streak Reward Flow

1. **Login Trigger**: User logs in to the platform
2. **Hook Activation**: `useLoginStreak()` hook is triggered
3. **Duplicate Check**: System checks if the user has already logged in today
4. **Streak Processing**: If not already logged in today, the `daily-streak` edge function is invoked
5. **Streak Calculation**: 
   - If the last login was yesterday, increment streak
   - If the last login was earlier, reset streak to 1
6. **Points Calculation**: System calculates bonus points based on streak length
7. **Points Award**: Base points (5) plus bonus points are awarded
8. **Activity Recording**: 
   - System creates a standardized activity record using `createActivityRecord` helper function
   - Activity type is set to `daily_login`
   - Metadata includes streak, maxStreak, bonusPoints, and timestamp
   - System performs duplicate check to ensure only ONE activity is recorded
   - System records the activity entry in `user_activity` and `user_login_history` tables
   - Points are determined from the base daily login (5) plus streak bonus
9. **User Update**: User's streak information is updated in the `users` table
10. **Notification**: If a milestone streak is reached, special notifications are shown

### Improved Login Streak Activity Recording

The login streak activity recording process uses the standardized approach:

```typescript
// Example of recording a daily login with streak bonus
const metadata = {
  loginDate: new Date().toISOString(),
  streak: streakData.streak,
  maxStreak: streakData.maxStreak,
  bonusPoints: streakData.bonusPoints || 0,
  streakBroken: streakData.streakBroken || false,
  newRecord: streakData.newRecord || false,
};

await rewardsService.processReward({
  userId,
  activityType: "daily_login",
  description: streakData.message || "Daily login reward",
  metadata,
});
```

## Implementation Details

### Activity Recording

Activity recording is handled by the `rewardsService.processReward()` function, which:

1. Checks if the activity is eligible for points (based on limits and cooldowns)
2. Determines the correct point value from the `reward_rules` table
3. Records the activity in the `user_activity` table
4. Updates the user's points using the `gamificationService`
5. Dispatches an `award:received` custom event with reward details
6. Triggers an animated toast notification to provide immediate feedback

### Points Update

Points updates are handled by the `gamificationService.awardPoints()` function, which:

1. Adds the awarded points to the user's total
2. Checks if the user has reached a new level
3. Updates the `users` table with the new points and level
4. Records a level-up activity if applicable

## Fallback Mechanisms

The system includes several fallback mechanisms to ensure reliability:

1. **Edge Function Fallback**: If the gamification edge function fails, direct database updates are attempted
2. **Activity Recording Fallback**: If activity recording fails, simplified retry attempts are made
3. **Points Update Fallback**: If points cannot be updated through the primary method, alternative update paths are tried
4. **Duplicate Prevention**: Multiple checks are implemented to prevent duplicate activity records
5. **Points Synchronization**: The `syncPointsService` can reconcile discrepancies between activity points and user total points

These fallbacks ensure that users receive their rewards even if parts of the system experience temporary issues.

### Standardized Reward Processing

All activity types use the `rewardsService.processReward()` function as the standard entry point for recording activities and awarding points:

```typescript
// Standard reward processing pattern used across all activity types
await rewardsService.processReward({
  userId: user.id,
  activityType: "activity_type", // e.g., "project_created", "goal_completed", etc.
  description: "Human-readable description of the activity",
  projectId: "optional-project-id", // If activity is related to a project
  metadata: { /* Additional contextual information */ },
});
```

This standardized approach ensures consistent handling of:
1. Eligibility checks (limits, cooldowns)
2. Duplicate prevention
3. Activity recording
4. Points awarding
5. Level-up detection
6. User feedback via animated toast notifications
7. Error handling and fallbacks

### Award Notification Workflow

When points are awarded, the system provides immediate visual feedback through the following workflow:

1. **Reward Processing**: `rewardsService.processReward()` determines if points should be awarded
2. **Event Dispatch**: If points are awarded, a custom `award:received` event is dispatched with details:
   - Points amount
   - Title (e.g., "Points Awarded!", "Level Up!")
   - Description (e.g., "Awarded 10 points!")
   - Variant (default, achievement, streak, level)
3. **Event Listening**: The `AwardToastListener` component listens for the `award:received` event
4. **Toast Display**: When an event is received, the listener calls `showAwardToast()` from the `useAwardToast` hook
5. **Visual Feedback**: An animated toast notification appears with:
   - Appropriate icon based on the award type
   - Points amount with animation
   - Title and description
   - Color scheme matching the award type
   - Progress bar indicating automatic dismissal timing
6. **Automatic Dismissal**: The toast automatically dismisses after 5 seconds

This workflow ensures users receive immediate, visually appealing feedback for their actions, enhancing the gamification experience.

## Maintenance

This document should be updated whenever:

1. New activity types are added to the system
2. Changes are made to the point allocation logic
3. The workflow for recording activities is modified
4. New tables or fields are added to the activity tracking system

## Last Updated

This documentation was last updated on: September 25, 2024