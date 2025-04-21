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

1. **Goal Creation**:
   - User creates a new goal with title, description, target value, etc.
   - System saves goal details to the `project_goals` table
   - System records a SINGLE activity entry in `user_activity` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `goal_created` type
   - Points are awarded based on the `reward_rules` table

2. **Goal Update**:
   - User updates an existing goal
   - System updates goal details in the `project_goals` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `project_updated` type
   - Points are awarded based on the `reward_rules` table

3. **Goal Completion**:
   - User marks a goal as completed
   - System updates goal status to "completed" in the `project_goals` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `goal_completed` type
   - Points are awarded based on the `reward_rules` table

4. **Goal Deletion**:
   - User deletes a goal
   - System removes goal from the `project_goals` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `project_updated` type
   - Points are awarded based on the `reward_rules` table

## Questionnaire Management Workflow

The questionnaire management workflow follows these specific steps:

1. **Questionnaire Creation**:
   - User creates a new questionnaire with title, description, questions, etc.
   - System saves questionnaire details to the `project_questionnaires` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `questionnaire_created` type
   - Points are awarded based on the `reward_rules` table

2. **Questionnaire Update**:
   - User updates an existing questionnaire
   - System updates questionnaire details in the `project_questionnaires` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `project_updated` type
   - Points are awarded based on the `reward_rules` table

3. **Questionnaire Deletion**:
   - User deletes a questionnaire
   - System removes questionnaire from the `project_questionnaires` table
   - System uses `rewardsService.processReward()` to record activity in `user_activity` table with `project_updated` type
   - Points are awarded based on the `reward_rules` table

## Implementation Details

### Activity Recording

Activity recording is handled by the `rewardsService.processReward()` function, which:

1. Checks if the activity is eligible for points (based on limits and cooldowns)
2. Determines the correct point value from the `reward_rules` table
3. Records the activity in the `user_activity` table
4. Updates the user's points using the `gamificationService`

### Points Update

Points updates are handled by the `gamificationService.awardPoints()` function, which:

1. Adds the awarded points to the user's total
2. Checks if the user has reached a new level
3. Updates the `users` table with the new points and level
4. Records a level-up activity if applicable

## Error Handling

The system includes fallback mechanisms to ensure activities and points are recorded even if parts of the process fail:

1. If the edge function for gamification fails, direct database updates are attempted
2. If activity recording fails, simplified retry attempts are made
3. If points synchronization is needed, the `syncPointsService` can reconcile discrepancies

## Maintenance

This document should be updated whenever:

1. New activity types are added to the system
2. Changes are made to the point allocation logic
3. The workflow for recording activities is modified
4. New tables or fields are added to the activity tracking system

## Last Updated

This documentation was last updated on: August 15, 2024
