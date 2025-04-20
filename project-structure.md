# Project Structure Documentation

## Overview

This document provides a reference for the project's folder structure and import paths to help avoid common import errors.

## Root Structure

```
.
├── public/            # Static assets
├── src/              # Source code
├── supabase/         # Supabase configuration
└── ... (config files)
```

## Source Code Structure

```
./src
├── components/       # UI components
│   ├── auth/         # Authentication components
│   ├── dashboard/    # Dashboard components
│   ├── home/         # Home page components
│   ├── pages/        # Page components
│   ├── projects/     # Project-related components
│   └── ui/           # UI library components
├── lib/              # Utility functions
├── services/         # Service modules
├── stories/          # Component stories
├── tempobook/        # Storyboards
│   └── storyboards/  # Individual storyboards
├── types/            # TypeScript type definitions
└── ... (other files)
```

## Supabase Structure

```
./supabase
├── auth.tsx          # Authentication provider
├── functions/        # Supabase edge functions
├── migrations/       # Database migrations
└── supabase.ts       # Supabase client
```

## Common Import Paths

### Importing from Supabase

From files in `/src`:
```typescript
import { supabase } from "../supabase/supabase";
import { useAuth } from "../supabase/auth";
```

From files in `/src/components` or other subdirectories:
```typescript
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../supabase/auth";
```

From files in `/src/tempobook`:
```typescript
import { supabase } from "../../supabase/supabase";
import { useAuth } from "../../supabase/auth";
```

From files in `/src/tempobook/storyboards/*`:
```typescript
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
```

### Importing UI Components

Using path aliases (recommended):
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Importing Services

Using path aliases (recommended):
```typescript
import { activityService } from "@/services/activity";
import { projectService } from "@/services/project";
```

## Path Alias Configuration

The project uses path aliases to simplify imports. The main alias is:

- `@/` - Points to the `/src` directory

This is configured in `tsconfig.json` and `vite.config.ts`.

## Best Practices

1. **Use path aliases** whenever possible to avoid relative path issues
2. **Verify import paths** when moving files between directories
3. **Maintain this document** when adding new directories or changing the project structure
4. **Use consistent import patterns** across the project

## Automated Structure Generation

To update this document automatically, you can use the following command:

```bash
find . -type d -not -path "*/node_modules/*" -not -path "*/\.*" | sort > project-structure.txt
```

Or for a more detailed view including files:

```bash
find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" -not -path "*/dist/*" | sort > project-files.txt
```
