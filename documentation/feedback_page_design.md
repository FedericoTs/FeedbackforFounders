# Feedback Page and System Specifications

## Overview

The Feedback page is the core interaction point of the platform, enabling users to provide contextual, specific feedback on websites while earning points through the gamification system. This document outlines the comprehensive specifications for the feedback collection, analysis, visualization, and reward mechanisms.

## Table of Contents

1. [User Experience](#user-experience)
2. [Interface Design](#interface-design)
3. [Feedback Collection System](#feedback-collection-system)
4. [Element Selection Tool](#element-selection-tool)
5. [Feedback Analysis System](#feedback-analysis-system)
6. [Visualization for Website Owners](#visualization-for-website-owners)
7. [Gamification and Reward System](#gamification-and-reward-system)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Implementation Roadmap](#implementation-roadmap)

## User Experience

### Feedback Provider Journey

1. User navigates to the Discovery page and selects a project to review
2. System loads the website in a secure iframe with the feedback toolbar overlaid
3. User browses the website naturally within the frame
4. When ready to provide feedback:
   - User activates the element selection tool
   - User hovers over elements to see them highlighted
   - User clicks to select a specific element
   - Feedback form appears for that element
5. User completes feedback form with:
   - Written comments
   - Category selection
   - Subcategory selection
   - Severity/priority rating
6. User submits feedback and receives points based on quality
7. User can continue to provide more feedback points or move to another project

### Website Owner Journey

1. Owner receives notification of new feedback
2. Owner navigates to their project dashboard
3. Owner can view feedback in multiple ways:
   - List view with all feedback entries
   - Visual view with pins on website elements
   - Analytics dashboard with aggregated insights
4. Owner can filter feedback by:
   - Element/component
   - Category/subcategory
   - Severity/priority
   - Date received
   - Sentiment
5. Owner can mark feedback as:
   - Implemented
   - Planned
   - Considered
   - Declined
6. Owner can rate feedback usefulness, affecting points awarded

## Interface Design

### Feedback Collection Interface

#### Website Viewing Frame
- Full-width iframe occupying approximately 80% of vertical space
- Custom header with minimal controls to maximize website visibility
- Responsive design that maintains website's intended layout
- Visual indicator showing iframe is in "feedback mode"

#### Feedback Toolbar
- Positioned at the top of the screen, slim and unobtrusive
- Contains:
  - Element selection tool toggle
  - Feedback list toggle
  - View mode toggle (split/full)
  - Exit button
  - Project information
  - Points earned indicator

#### Element Selection Tool
- Activation button in the toolbar
- Cursor changes to indicate selection mode
- Hover highlights with element boundary box
- Click selects element and opens feedback form
- Selected elements show persistent highlight until form is submitted or canceled

#### Feedback Form
- Slides in from right side when element is selected
- Contains:
  - Selected element screenshot thumbnail
  - Element path indicator (e.g., "Header > Navigation > Menu Item")
  - Comment text area with rich formatting options
  - Category dropdown with subcategories
  - Severity/priority slider (1-5)
  - Additional context input (device, browser, etc.)
  - Submit and cancel buttons

### Feedback Visualization Interface

#### Visual Mode
- Website displayed with feedback pins overlaid
- Pins are color-coded by category
- Size indicates frequency of feedback for that element
- Hover shows quick preview of feedback count and sentiment
- Click opens detailed feedback panel for that element

#### List Mode
- Organized table of all feedback entries
- Columns:
  - Element (with thumbnail)
  - Category/Subcategory
  - Comment preview
  - Severity
  - Date
  - Status
  - Actions
- Sorting and filtering options
- Bulk actions for similar feedback

#### Analytics Dashboard
- Summary metrics at the top
- Visualizations:
  - Heat map of feedback density on the website
  - Category distribution chart
  - Sentiment analysis over time
  - Top feedback themes word cloud
  - Priority distribution

## Feedback Collection System

### Website Loading Mechanism

#### Iframe Integration
- Secure iframe loading with:
  - Content Security Policy handling
  - X-Frame-Options bypass system
  - Proxy service for websites that block iframe embedding
- Fallback mechanisms:
  - Screenshot-based feedback option
  - Local rendering option (requiring website owners to install a snippet)
- Performance optimization for quick loading

#### Website Interaction
- JavaScript injection to enable user interaction within iframe
- Event capturing to prevent navigation away from target page
- Viewport adjustment to handle responsive websites
- URL parameter handling to navigate to specific sections

### Feedback Form Components

#### Text Input
- Rich text editor with basic formatting
- Minimum character count requirement (e.g., 30 characters)
- Maximum character limit (e.g., 2000 characters)
- Real-time character counter
- Spelling and grammar suggestions

#### Categorization System
- Primary categories:
  - UI Design
  - UX Flow
  - Content
  - Functionality
  - Performance
  - Accessibility
  - Business Logic
  - General
- Each primary category has 5-7 relevant subcategories
- Custom category option for project owners

#### Severity/Priority Rating
- 5-point scale with clear definitions:
  1. Minor suggestion (cosmetic)
  2. Minor improvement (small enhancement)
  3. Moderate issue (affects some users)
  4. Major issue (affects many users)
  5. Critical issue (breaks functionality)
- Visual indicator showing severity (color + icon)

#### Metadata Collection
- Automatic:
  - Browser and device information
  - Screen resolution
  - Time spent viewing before feedback
  - User expertise level (based on platform history)
- Optional user-provided:
  - Task they were trying to accomplish
  - Prior experience with similar websites/products

## Element Selection Tool

### Technical Implementation

#### DOM Element Selection
- JavaScript-based element highlighter
- Traverses DOM tree to identify selectable elements
- Creates hierarchical element map for navigation
- Handles dynamic content and AJAX-loaded components
- Stores unique CSS selectors for each element

#### Element Highlighting
- Boundary box overlay around elements
- Color indication of hovering vs. selected state
- Z-index management to ensure visibility
- Animated transitions between states
- Responsive to window resizing

#### Selection Storage
- Captures:
  - Unique CSS selector
  - XPath as fallback
  - Element dimensions and position
  - Element type and attributes
  - Screenshot of the element in context
  - Hierarchical path to element

### User Interaction Flow

1. User activates selection tool from toolbar
2. Cursor changes to indicate selection mode is active
3. As user moves cursor, elements are highlighted with bounding box
4. Small tooltip shows element type (div, button, nav, etc.)
5. When user hovers on nested elements, they can use scroll wheel to navigate hierarchy
6. User clicks to select specific element
7. Selected element remains highlighted while feedback form appears
8. User can adjust selection if needed before submitting feedback

## Feedback Analysis System

### OpenAI Integration

#### Text Analysis Pipeline
1. Raw feedback text is collected and stored
2. Batch processing sends feedback to OpenAI API at regular intervals
3. Multiple analysis prompts extract different insights:
   - Sentiment analysis (positive/negative/neutral)
   - Key suggestions identification
   - Categorization verification
   - Priority assessment
   - Actionability scoring
4. Results are stored and linked to original feedback

#### Analysis Prompts
- Sentiment Analysis Prompt:
  ```
  Analyze the following feedback and determine the sentiment on a scale from -1 (very negative) to 1 (very positive). Provide a single number as the result along with a one-sentence explanation:
  [FEEDBACK TEXT]
  ```

- Key Suggestions Prompt:
  ```
  Extract the main suggestions from the following feedback. Format as bullet points, with each suggestion no longer than 15 words:
  [FEEDBACK TEXT]
  ```

- Actionability Prompt:
  ```
  On a scale of 1-10, rate how actionable the following feedback is, where 1 means vague/unusable and 10 means specific and immediately implementable. Provide the score and brief justification:
  [FEEDBACK TEXT]
  ```

### Insight Generation

#### Automated Summaries
- Per-element summary generation
- Aggregation of similar feedback
- Identification of patterns across multiple elements
- Prioritized action recommendations

#### Categorization Enhancement
- AI verification of user-selected categories
- Suggestion of additional relevant categories
- Identification of cross-category patterns
- Topic modeling for emergent themes

#### Feedback Quality Assessment
- Scoring system based on:
  - Specificity of feedback
  - Actionability
  - Clarity of expression
  - Constructiveness
  - Uniqueness compared to existing feedback
- Quality score influences points awarded

## Visualization for Website Owners

### Element-Based Visualization

#### Pin Overlay System
- Interactive overlay showing pins on website elements
- Pin characteristics:
  - Color represents category
  - Size represents feedback volume
  - Icon represents average severity
  - Opacity represents recency
- Clustering algorithm for elements with multiple feedback points
- Zoom and pan controls for detailed inspection

#### Filtering Capabilities
- Filter pins by:
  - Category/subcategory
  - Date range
  - Severity level
  - Sentiment
  - Implementation status
  - Feedback quality
- Combined filters with AND/OR logic
- Save filter presets for quick access

#### Interaction Flow
1. Owner views website with pins overlay
2. Owner hovers over pin to see summary tooltip
3. Owner clicks pin to open detailed feedback panel
4. Panel shows all feedback for that element
5. Owner can sort and filter within the panel
6. Owner can respond to or take action on feedback

### Insights Dashboard

#### Summary Metrics
- Total feedback count
- Average sentiment score
- Distribution by category
- Distribution by severity
- Implementation rate
- User satisfaction with responses

#### Visualization Components

1. **Heat Map**
   - Visual representation of feedback density
   - Color intensity shows concentration
   - Segmented by page section
   - Toggle between all feedback/open issues

2. **Element Ranking**
   - List of elements with most feedback
   - Sortable by various metrics
   - Quick links to view all feedback for each element

3. **PROS/CONS Summary**
   - AI-generated list of strengths and weaknesses
   - Based on sentiment analysis and frequency
   - Categorized by website aspect

4. **Priority Matrix**
   - 2x2 matrix plotting severity vs. frequency
   - Quadrants indicate action priorities
   - Elements positioned according to their metrics

5. **Sentiment Timeline**
   - Graph showing sentiment trends over time
   - Filterable by category
   - Annotations for major updates/changes

6. **Word Cloud**
   - Visual representation of common terms
   - Segmented by positive/negative sentiment
   - Interactive to filter feedback by term

7. **Action Recommendations**
   - AI-generated prioritized list of actions
   - Based on severity, frequency, and sentiment
   - Estimated impact assessment

## Gamification and Reward System

### Point System

#### Points Earning
- Base points for providing feedback
- Bonus points for:
  - First feedback on a project
  - Finding previously unreported issues
  - High-quality, detailed feedback
  - Feedback that gets implemented
  - Providing feedback in underserved categories
- Multipliers for:
  - User expertise level
  - Streak of consistent feedback

#### Dynamic Value Adjustment
- Formula for calculating diminishing returns:
  ```
  pointsAwarded = basePoints * (1 / (1 + (similarFeedbackCount * 0.2)))
  ```
- Similarity detection using:
  - Same element + category + subcategory
  - Text similarity analysis via OpenAI API
  - Owner marking as duplicate

#### Quality Assessment
- Initial points awarded immediately
- Adjustment after analysis:
  - Increase for high-quality feedback
  - Decrease for low-quality feedback
  - Zero points for spam or inappropriate content
- Further adjustment based on owner rating
- Notification to user of final points awarded

### Leveling System

#### Experience Levels
1. Novice Reviewer (0-100 points)
2. Regular Reviewer (101-500 points)
3. Experienced Reviewer (501-1500 points)
4. Expert Reviewer (1501-5000 points)
5. Master Reviewer (5001+ points)

#### Level Benefits
- Higher base points per feedback
- Access to exclusive projects
- Higher visibility for own projects
- Special badges on profile
- Weighted impact on project ratings

### Achievement System

#### Achievement Categories
- Volume-based (number of feedback items)
- Quality-based (high ratings from owners)
- Diversity-based (across categories/project types)
- Impact-based (implemented suggestions)
- Consistency-based (daily/weekly streaks)

#### Badge Display
- Profile showcase of earned badges
- Progress indicators for upcoming badges
- History of achievements with dates
- Special visual effects for rare achievements

## Database Schema

### Core Tables

#### feedback
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  element_selector TEXT NOT NULL,
  element_xpath TEXT,
  element_screenshot_url TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  severity INTEGER DEFAULT 3,
  sentiment FLOAT,
  actionability_score INTEGER,
  quality_score INTEGER,
  is_duplicate BOOLEAN DEFAULT FALSE,
  similar_feedback_ids UUID[],
  implementation_status TEXT DEFAULT 'pending',
  points_awarded INTEGER DEFAULT NULL,
  final_points_awarded INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### feedback_analysis
```sql
CREATE TABLE feedback_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  raw_sentiment FLOAT,
  normalized_sentiment FLOAT,
  key_suggestions TEXT[],
  detected_categories TEXT[],
  quality_indicators JSONB,
  actionability_score INTEGER,
  uniqueness_score INTEGER,
  analysis_version TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### element_feedback_summary
```sql
CREATE TABLE element_feedback_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  element_selector TEXT NOT NULL,
  feedback_count INTEGER DEFAULT 0,
  average_sentiment FLOAT,
  average_severity FLOAT,
  category_distribution JSONB,
  summary_text TEXT,
  pros TEXT[],
  cons TEXT[],
  action_recommendations JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, element_selector)
);
```

#### feedback_interactions
```sql
CREATE TABLE feedback_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  value INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Support Tables

#### feedback_categories
```sql
CREATE TABLE feedback_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES feedback_categories(id),
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, parent_id)
);
```

#### points_adjustments
```sql
CREATE TABLE points_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  points_delta INTEGER NOT NULL,
  adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### feedback_duplicates
```sql
CREATE TABLE feedback_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  duplicate_feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  similarity_score FLOAT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(original_feedback_id, duplicate_feedback_id)
);
```

## API Endpoints

### Feedback Collection

#### `GET /projects/:id/feedback-interface`
- Returns the feedback interface configuration for a specific project
- Includes element selection tool settings and category options

#### `POST /projects/:id/feedback`
- Creates new feedback entry
- Request body:
  ```json
  {
    "elementSelector": "div#header > nav.main-nav > ul > li:nth-child(2)",
    "elementXPath": "/html/body/div[1]/nav/ul/li[2]",
    "content": "The navigation menu item 'Products' is not clearly visible due to low contrast.",
    "category": "UI Design",
    "subcategory": "Color & Contrast",
    "severity": 3,
    "metadata": {
      "browser": "Chrome 98.0.4758.102",
      "device": "Desktop",
      "viewportSize": "1920x1080"
    }
  }
  ```
- Returns created feedback with initial points awarded

#### `GET /projects/:id/feedback`
- Returns all feedback for a project
- Query parameters for filtering:
  - `elementSelector`
  - `category`
  - `subcategory`
  - `severity`
  - `sentiment`
  - `implementationStatus`
  - `dateFrom`
  - `dateTo`

### Feedback Management

#### `PUT /feedback/:id`
- Updates feedback entry (for owner responses)
- Request body:
  ```json
  {
    "implementationStatus": "planned",
    "ownerResponse": "Thank you for this feedback. We'll be implementing this in our next update.",
    "ownerRating": 5
  }
  ```

#### `POST /feedback/:id/rate`
- Rates feedback quality (by project owner)
- Affects final points awarded
- Request body:
  ```json
  {
    "rating": 4,
    "comment": "Very helpful feedback, thank you!"
  }
  ```

### Feedback Analysis

#### `GET /projects/:id/analytics`
- Returns analytics overview for project
- Includes summary metrics and visualizations

#### `GET /projects/:id/analytics/elements`
- Returns element-specific analytics
- Can filter by element selector

#### `GET /projects/:id/analytics/sentiment`
- Returns sentiment analysis breakdown
- Includes trends over time

#### `GET /projects/:id/analytics/recommendations`
- Returns AI-generated action recommendations
- Sorted by priority

### Points System

#### `GET /users/:id/points`
- Returns user's point history
- Includes breakdown by project and category

#### `GET /feedback/:id/points-calculation`
- Returns detailed calculation of points for specific feedback
- Shows all adjustments and factors

## Conclusion

The Feedback page and system form the core value proposition of the platform, enabling meaningful, contextual feedback that benefits both website owners and reviewers. By combining sophisticated element selection, intelligent analysis, comprehensive visualization, and engaging gamification, the platform creates a powerful ecosystem for improving early-stage websites and startup ideas.

The implementation should prioritize the user experience for both feedback providers and website owners, ensuring that the process is intuitive, rewarding, and ultimately valuable for improving digital products.